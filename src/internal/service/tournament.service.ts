import { IGame } from "../../interface/entity/game.entity.interface";
import { ITournament } from "../../interface/entity/tournament.entity.interface";
import TournamentRepository from "../../repository/tournament.repository";
import UserRepository from "../../repository/user.repository";
import { LeaderBoardElement } from "../../types/user.types";
import logger from "../../utils/logger";
import GameService from "./game.service";


class TournamentService {
    private tournamentRepository: TournamentRepository;
    private userRepository: UserRepository;
    private gameService: GameService;

    constructor() {
        this.tournamentRepository = new TournamentRepository();
        this.userRepository = new UserRepository();
        this.gameService = new GameService();
    }

    public async createTournament(tournament_type: string, tournament_name: string, prize_pool: number, participants: number, description: string, start_date: Date, end_date: Date): Promise<ITournament> {
       try {
            const tournamentObj : ITournament = {
                tournament_id: `TOURNAMENT-${new Date().getTime()}`,
                tournament_type: tournament_type,
                tournament_name: tournament_name,
                tournament_prize_pool: prize_pool,
                tournament_status: 'INIT_PENDING',
                tournament_participants: participants,
                tournament_description: description,
                tournament_start_date: start_date.getTime(),
                tournament_end_date: end_date.getTime(),
                is_active: true,
            }
            return await this.tournamentRepository.createTournament(tournamentObj);

       } catch(err) {
            logger.error(`Error creating tournament: ${err}`);
            throw new Error(`Error creating tournament: ${err}`);
       }
    }

    public async findTournamentById(tournamentId: string): Promise<ITournament | null> {
        try {
            return await this.tournamentRepository.findTournamentById(tournamentId);
        } catch(err) {
            logger.error(`Error fetching tournament by ID: ${err}`);
            throw new Error(`Error fetching tournament by ID: ${err}`);
        }
    }

    public async startTournament(tournamentId: string): Promise<ITournament | null> {
        
        try {
            const leaderboardArray = await this.tournamentLeaderboard([]);
            const roomId = await this.gameService.createAndJoinTournamentsRoom(leaderboardArray);
            const partialTournamentObj : Partial<ITournament> = {
                tournament_status: 'IN_PROGRESS',
                tournament_socket_id: roomId,
            }
            const tournamentObj = await this.updateTournament(tournamentId, partialTournamentObj);
            
            // join all player in the same room
            // realtime-matchmaking and leaderboard changes
            return null;
        } catch (err) {
            logger.error(`Error starting tournament: ${err}`);
            throw new Error(`Error starting tournament: ${err}`);
        }
    }

    private async tournamentLeaderboard(games: Array<IGame>): Promise<Array<LeaderBoardElement>> {
        try {
            const playerStats: { [key: string]: { user_id: string, points: number, wins: number, losses: number, draws: number, elo_change: number } } = {};

            // 1. Aggregate stats from all games
            for (const game of games) {
                // A game in a tournament must have two players. Skip if data is incomplete.
                if (!game.white_player_id || !game.black_player_id) {
                    logger.warn(`Skipping game ${game.game_id} in leaderboard calculation due to missing player ID(s).`);
                    continue;
                }

                const playerIds = [game.white_player_id, game.black_player_id];

                // Initialize player stats if they haven't played yet
                for (const playerId of playerIds) {
                    if (!playerStats[playerId]) {
                        playerStats[playerId] = { user_id: playerId, points: 0, wins: 0, losses: 0, draws: 0, elo_change: 0 };
                    }
                }

                // Update stats based on game result
                if (game.game_winner_id) {
                    const winnerId = game.game_winner_id;
                    const loserId = winnerId === game.white_player_id ? game.black_player_id : game.white_player_id;

                    // Update winner: 1 point for a win
                    playerStats[winnerId].wins += 1;
                    playerStats[winnerId].points += 1;
                    playerStats[winnerId].elo_change += game.elo_rating_change || 0;

                    // Update loser
                    playerStats[loserId].losses += 1;
                    playerStats[loserId].elo_change -= game.elo_rating_change || 0;

                } else { // It's a draw: 0.5 points
                    playerStats[game.white_player_id].draws += 1;
                    playerStats[game.white_player_id].points += 0.5;

                    playerStats[game.black_player_id].draws += 1;
                    playerStats[game.black_player_id].points += 0.5;
                }
            }

            const playerIds = Object.keys(playerStats);
            if (playerIds.length === 0) return [];

            // 2. Fetch user details for all participants in a single query
            const users = await this.userRepository.findUsersByIds(playerIds);
            const userMap = new Map(users.map(user => [user.user_id, user]));

            // 3. Combine stats with user details to create the leaderboard
            let leaderboard = Object.values(playerStats).map(stat => ({
                user_id: stat.user_id,
                username: userMap.get(stat.user_id)?.username || 'Unknown Player',
                points: stat.points,
                wins: stat.wins,
                loose: stat.losses, // Matching the 'loose' property in LeaderBoardElement type
                draws: stat.draws,
                elo_change: stat.elo_change,
            }));

            // 4. Sort leaderboard: by points (desc), then by ELO change (desc) as a tie-breaker
            leaderboard.sort((a, b) => b.points - a.points || b.elo_change - a.elo_change);

            return leaderboard;

        } catch(err) {
            logger.error(`Error creating tournament leaderboard: ${err}`);
            throw new Error(`Error creating tournament leaderboard: ${err}`);
        }
    }


    public async updateTournament(tournamentId: string, updates: Partial<ITournament>): Promise<ITournament | null> {
        return await this.tournamentRepository.updateTournament(tournamentId, updates);
    }

    public async findAllTournaments(): Promise<ITournament[]> {
        try {
            return await this.tournamentRepository.findAllTournaments('INIT_PENDING');
        } catch(err) {
            logger.error(`Error fetching all tournaments: ${err}`);
            throw new Error(`Error fetching all tournaments: ${err}`);
        }
    }

}

export default TournamentService;