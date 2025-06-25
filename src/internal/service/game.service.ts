import { io } from "../..";
import logger from "../../utils/logger";
import redisClient, { addUserToMatchmakingQueue } from "../../utils/redis.client";
import RealtimeMatchmaking, { UserDetailsRedisObj } from "../../worker/matchmaking/realtime.matchmaking.worker";
import { Server, Socket } from "socket.io";
import { Room, rooms } from "../socket/socket.handler";
import { IGame } from "../../interface/entity/game.entity.interface";
import GameRepository from "../../repository/game.repository";

type GameOutcome = 'W' | 'L' | 'D'; // Win, Loss, Draw

interface PlayerStats {
    gamesPlayed: number;
    rating: number;
    winPercentage: number; // Should be a value like 0.0 to 1.0
    lastTenStreaks: GameOutcome[]; // e.g., ['W', 'W', 'L', 'W', 'L', 'W', 'W', 'W', 'L', 'D']
    gamesAsWhite: number;
    gamesAsBlack: number;
}

export interface Player {
    id: string; // Unique identifier for the player
    stats: PlayerStats;
}

export interface MatchedPair {
    player1: Player;
    player2: Player;
    player1Color: 'white' | 'black';
}

const INITIAL_RATING_DIFFERENCE = 25;
const RATING_DIFFERENCE_INCREMENT = 25;
const MAX_RATING_ITERATIONS = 10; // Max attempts to widen rating gap (e.g., up to 25 * 10 = 250 points)
// Define realistic min/max rating if applicable, to stop iteration.
// const MIN_RATING = 0;
// const MAX_RATING = 3000;

class GameService {

    private realtimeMatchmakingService = new RealtimeMatchmaking();
    private gameRepository : GameRepository;

    constructor() {
        this.gameRepository = new GameRepository();
    }





    private calculateStreakSimilarity(streak1: GameOutcome[], streak2: GameOutcome[]): number {
        let similarity = 0;
        const len = Math.min(streak1.length, streak2.length, 10); // Consider only up to 10 games
        for (let i = 0; i < len; i++) {
            if (streak1[i] === streak2[i]) {
                similarity++;
            }
        }
        return similarity;
    }

    private assignColorToUser(): { p1Color: 'white' | 'black', p2Color: 'white' | 'black' }  {
        // Rule 5: "Choose color of the user by simply by looking if opponent if greater number of color played
        // as compared to the user then user should get the color (i.e black/white)"
        // This means if the opponent has played more of a certain color than the user, the user gets that color.

        const p1Color = Math.random() < 0.5 ? 'white' : 'black';
        return {
            p1Color: p1Color,
            p2Color: p1Color === 'white' ? 'black' : 'white'
        };
    }


    private findOpponnentByCriteria(currentUser: Player) {

    }

    public async updateGameMove(game_id: string, game_moves_fen: string) : Promise<void> {
        try {
            

        } catch (err) {
            logger.error(`Error saving game history: ${err}`);
            throw new Error(`Error saving game history: ${err}`);
        }
    }

    public async updateGameStatus(user_id: string, game_id: string, game_status: string, game_result: string) : Promise<IGame> {
        try {
            const gameObj : Partial<IGame> = {
                user_id: user_id,
                game_id: game_id,
                game_status: game_status,
                game_result: game_result
            }
            const res = await this.gameRepository.updateGame(gameObj);
            if(!res) throw new Error(`Error updating game status in db`);
            return res;
        } catch (err) {
            logger.error(`Error updating game status: ${err}`);
            throw new Error(`Error updating game status: ${err}`);
        }
    }

    public async createNewGame(user_id: string, selected_peiece_color: string, opponent_id: string, game_type: string, game_moves_fen: Array<string>, game_result: string, transaction_id: string) : Promise<IGame> {
        try {
            const gameObj : IGame = {
                user_id: user_id,
                opponent_id: opponent_id,
                game_id: 'GAME-' + new Date().getTime(),
                game_type: game_type,
                game_player_black: selected_peiece_color === 'BLACK' ? user_id : opponent_id,
                game_player_white: selected_peiece_color === 'WHITE' ? user_id : opponent_id,
                game_room_id: 'ROOM-' + new Date().getTime(),
                game_status: 'IN_PROGRESS',
                game_moves_fen: game_moves_fen,
                game_result: game_result,
                transaction_id: transaction_id,
                game_date: new Date()
            }
            const res = await this.gameRepository.createGame(gameObj);
            if(!res) throw new Error(`Error creating new game`);
            return res;
        } catch (err) {
            logger.error(`Error creating new game: ${err}`);
            throw new Error(`Error creating new game: ${err}`);
        }
    }
    public findMatch(currentUser: Player, availablePlayers: Player[]): MatchedPair | null {
        if (!currentUser || availablePlayers.length === 0) {
            return null;
        }

        // Filter out the current user from available players
        let potentialOpponents = availablePlayers.filter(p => p.id !== currentUser.id);

        if (potentialOpponents.length === 0) {
            return null;
        }

        // Rule 1: Total Number of games played (Primary sorting factor for the entire list)
        potentialOpponents.sort((a, b) =>
            Math.abs(a.stats.gamesPlayed - currentUser.stats.gamesPlayed) -
            Math.abs(b.stats.gamesPlayed - currentUser.stats.gamesPlayed)
        );

        let bestMatchFound: Player | null = null;

        // Rule 2: Difference between user rating and opponent rating (Iterative)
        for (let i = 0; i < MAX_RATING_ITERATIONS; i++) {
            const currentRatingTolerance = INITIAL_RATING_DIFFERENCE + (i * RATING_DIFFERENCE_INCREMENT);

            // Filter by current rating tolerance.
            // These candidates are already sorted by gamesPlayed difference.
            const candidatesInRatingRange = potentialOpponents.filter(opponent =>
                Math.abs(opponent.stats.rating - currentUser.stats.rating) <= currentRatingTolerance
                // && opponent.stats.rating >= MIN_RATING && opponent.stats.rating <= MAX_RATING // Optional bounds
            );

            if (candidatesInRatingRange.length > 0) {
                // We have candidates in this rating range. Now apply rules 3 and 4.
                // Sort these candidates by Rule 3 (Win %), then Rule 4 (Streak Similarity)
                candidatesInRatingRange.sort((a, b) => {
                    // Rule 3: Average winning % should be as close as possible
                    const winPctDiffA = Math.abs(a.stats.winPercentage - currentUser.stats.winPercentage);
                    const winPctDiffB = Math.abs(b.stats.winPercentage - currentUser.stats.winPercentage);

                    if (winPctDiffA !== winPctDiffB) {
                        return winPctDiffA - winPctDiffB; // Lower difference is better
                    }

                    // Rule 4: Check last 10 streaks (higher similarity is better)
                    const streakSimilarityA = this.calculateStreakSimilarity(a.stats.lastTenStreaks, currentUser.stats.lastTenStreaks);
                    const streakSimilarityB = this.calculateStreakSimilarity(b.stats.lastTenStreaks, currentUser.stats.lastTenStreaks);

                    return streakSimilarityB - streakSimilarityA; // Higher similarity is better (sort descending)
                });

                bestMatchFound = candidatesInRatingRange[0]; // The best one after applying all rules
                break; // Exit rating iteration loop as we found the best possible match
            }
            // If no candidates in this range, the loop will continue to widen the rating tolerance
        }

        if (bestMatchFound) {
            const player1Color = this.assignColorToUser();
            return {
                player1: currentUser,
                player2: bestMatchFound,
                player1Color: player1Color.p1Color,
            };
        }

        return null; // No suitable match found after all iterations
    }

    public async  createAndJoinRoom(socket: Socket, player1Details: UserDetailsRedisObj, player2Details: UserDetailsRedisObj) : Promise<Boolean> {
        try { 
            logger.info(`Received request to create and join room for players ${player1Details.user_id} and ${player2Details.user_id})}`)
            const player1Socket = io.sockets.sockets.get(player1Details.socket_id);
            const player2Socket = io.sockets.sockets.get(player2Details.socket_id);

            if (!player1Socket || !player1Socket.connected) {
                logger.error(`Player 1 (${player1Details.socket_id}) disconnected after match. Informing player 2 if connected.`);
                if (player2Socket && player2Socket.connected) {
                    player2Socket.emit('matchmakingUpdate', { message: 'Opponent disconnected before game start. Please try again.' });
                }
                //TODO: Push event to queue for db entry
                return true; // Processed, but game not started
            }
            
            if (!player2Socket || !player2Socket.connected) {
                logger.error(`Player 2 (${player2Details.socket_id}) disconnected after match. Informing player 1.`);
                player1Socket.emit('matchmakingUpdate', { message: 'Opponent disconnected before game start. Please try again.' });
                //TODO: Push event to queue for db entry
                return true; // Processed, but game not started
            }

            const roomId = `game-${Math.random().toString(36).substring(2, 11)}`;
            
            // Make both sockets join the room
            player1Socket.join(roomId);
            player2Socket.join(roomId);
            logger.info(`Player ${player1Socket.id} and ${player2Socket.id} joined room ${roomId}`);
            const { p1Color, p2Color } = this.assignColorToUser();

            const gamePlayers = [
                { id: player1Socket.id, username: player1Details.username || 'Player1', color: p1Color },
                { id: player2Socket.id, username: player2Details.username || 'Player2', color: p2Color }
            ];
            
            const currentPlayerTurn = p1Color === 'white' ? player1Socket.id : player2Socket.id;

            const newRoom: Room = {
                id: roomId,
                players: gamePlayers.map(p => ({ socketId: p.id, username: p.username, color: p.color as 'white' | 'black' })),
                currentPlayerTurn,
            }

            rooms.set(roomId, newRoom);
            logger.info(`Room metadata stored for room ${roomId}`);

            // Emit gameStart to everyone in the room
            io.to(roomId).emit('gameStart', {
                roomId,
                players: gamePlayers,
                currentPlayerTurn,
            });
            //TODO: Push event to queue for db entry
            logger.info(`Game ${roomId} started for ${gamePlayers[0].username} and ${gamePlayers[1].username}`);
            return true;
        } catch (err) {
            logger.error(`Error in creating and joining room for players ${player1Details.user_id} and ${player2Details.user_id}: ${err}`);
            return false
        }
    }

    public async  matchMakingRealTime(socket: Socket, username: string, preferences: any, userDetails: any, allowExtendedSearch: boolean) : Promise<Boolean> {
        try {
            const res : { player1Details: UserDetailsRedisObj, player2Details: UserDetailsRedisObj } | null = await this.realtimeMatchmakingService.findMatch(userDetails, allowExtendedSearch);
            logger.info(`User ${socket.id} (${username}) added to matchmaking queue, response received ${JSON.stringify(res)}`);
            if(res)
                await this.createAndJoinRoom(socket, res.player1Details, res.player2Details);
            //TODO: push event to queue to update db
            return true;
        } catch(err) {
            logger.error(`Error adding user with ${socket.id} and username ${username} to matchmaking queue: ${err}`);
            return false;
        }
    }
}

export default GameService;

/*
// Example Usage (for testing purposes):
const gameService = new GameService();
const player1: Player = { id: 'p1', stats: { gamesPlayed: 100, rating: 1500, winPercentage: 0.5, lastTenStreaks: ['W','W','L','W','L','W','W','W','L','D'], gamesAsWhite: 50, gamesAsBlack: 50 }};
const availablePlayersList: Player[] = [
    { id: 'p2', stats: { gamesPlayed: 105, rating: 1520, winPercentage: 0.52, lastTenStreaks: ['W','W','W','L','L','W','W','D','L','W'], gamesAsWhite: 55, gamesAsBlack: 50 }},
    { id: 'p3', stats: { gamesPlayed: 95, rating: 1480, winPercentage: 0.48, lastTenStreaks: ['L','L','W','L','W','L','L','L','W','D'], gamesAsWhite: 45, gamesAsBlack: 50 }},
    { id: 'p4', stats: { gamesPlayed: 102, rating: 1525, winPercentage: 0.50, lastTenStreaks: ['W','W','L','W','L','W','W','W','L','D'], gamesAsWhite: 60, gamesAsBlack: 42 }}, // Same win%, same streak as p1
    { id: 'p5', stats: { gamesPlayed: 103, rating: 1525, winPercentage: 0.50, lastTenStreaks: ['W','W','L','W','L','W','W','W','W','W'], gamesAsWhite: 50, gamesAsBlack: 53 }}, // Same win%, better streak than p4
    { id: 'p6', stats: { gamesPlayed: 200, rating: 1750, winPercentage: 0.65, lastTenStreaks: ['W','W','W','W','W','W','W','W','W','W'], gamesAsWhite: 100, gamesAsBlack: 100 }},
];

const match = gameService.findMatch(player1, availablePlayersList);
console.log("Found match:", JSON.stringify(match, null, 2));
*/