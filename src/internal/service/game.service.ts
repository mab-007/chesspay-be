import { io } from "../..";
import logger from "../../utils/logger";
import redisClient, { addUserToMatchmakingQueue } from "../../utils/redis.client";
import RealtimeMatchmaking, { UserDetailsRedisObj } from "../../worker/matchmaking/realtime.matchmaking.worker";
import { Server, Socket } from "socket.io";
import { Room, getRoom, saveRoom, saveTournamentRoom } from "../socket/socket.handler";
import { IGame } from "../../interface/entity/game.entity.interface";
import GameRepository from "../../repository/game.repository";
import AccountService from "./account.service";
import { IGameHistoryResposne } from "../../interface/ui-response/api.response.interface";
import RatingRepository from "../../repository/rating.repository";
import { IRating } from "../../interface/entity/rating.entity.interface";
import { LeaderBoardElement } from "../../types/user.types";
import EloRank from 'elo-rank';
import TransactionService from "./transaction.service";
import { TransactionType } from "../../interface/entity/transaction.entity.interface";

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
    private accountService : AccountService;
    private ratingRepository : RatingRepository;
    private transactionService: TransactionService;
    private elo = new EloRank(15)

    constructor() {
        this.gameRepository = new GameRepository();
        this.accountService = new AccountService();
        this.ratingRepository = new RatingRepository();
        this.transactionService = new TransactionService();
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

    private assignColorToUser( p1_black_win_percentage: number, p1_white_win_percentage: number): { p1Color: 'white' | 'black', p2Color: 'white' | 'black' }  {
        let p1Color: 'white' | 'black' = p1_white_win_percentage > p1_black_win_percentage ? 'white' : 'black';
        let p2Color: 'white' | 'black' =  p1Color === 'white' ? 'black' : 'white';
        return {  p1Color: p1Color, p2Color: p2Color };
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

    public async createNewGame(user_id: string, game_type: string, transaction_id: string, elo_rating: number) : Promise<IGame> {
        try {
            const gameObj : IGame = {
                user_id: user_id,
                game_id: 'GAME-' + new Date().getTime(),
                game_type: game_type,
                elo_rating_change: 0,
                elo_rating: elo_rating,
                game_room_id: 'ROOM-' + new Date().getTime(),
                game_status: 'FINDING_MATCH',
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

    private async udpateGameDetails(game_id: string, opponent_id: string, black_player_id: string, white_player_id: string, black_player_rating?: number, white_player_rating?: number, elo_rating_change?: number, game_room_id?: string  ) : Promise<IGame> {
        try {

            const gameObj : Partial<IGame> = {
                game_id: game_id,
                opponent_id: opponent_id,
                black_player_id: black_player_id,
                white_player_id: white_player_id,
                black_player_rating: black_player_rating,
                white_player_rating: white_player_rating,
                elo_rating_change: elo_rating_change,
                game_room_id: game_room_id,
                game_status: 'IN_PROGRESS'
            }

            const updateGameObj = await this.gameRepository.updateGame(gameObj);
            if(!updateGameObj) throw new Error(`Error updateting game details`);
            return updateGameObj;
        } catch (err) {
            logger.error(`Error fetching game details: ${err}`);
            throw new Error(`Error fetching game details: ${err}`);
        }
    }

    private async updateGameAbondon(game_id: string) : Promise<IGame> {
        try {
            const gameObj : Partial<IGame> = {
                game_id: game_id,
                game_status: 'ABONDONED'
            }
            const res = await this.gameRepository.updateGame(gameObj);
            if(!res) throw new Error(`Error updating game abondon`);
            return res;
        } catch(err) {
            logger.error(`Error updating game abondon: ${err}`);
            throw new Error(`Error updating game abondon: ${err}`)
        }
    }

    public async createAndJoinRoom(socket: Socket, player1Details: UserDetailsRedisObj, player2Details: UserDetailsRedisObj, gameResultPoints: any) : Promise<IGame | null> {
        try { 
            logger.info(`Received request to create and join room for players ${player1Details.user_id} and ${player2Details.user_id})}`)
            const player1Socket = io.sockets.sockets.get(player1Details.socket_id);
            const player2Socket = io.sockets.sockets.get(player2Details.socket_id);
            const gameDetails1 = await this.gameRepository.findByUserId(player1Details.user_id);
            const gameDetails2 = await this.gameRepository.findByUserId(player2Details.user_id);

            const gameDetails = gameDetails1 || gameDetails2;

            if(!gameDetails){
                logger.error(`Game object not found for ${player1Details.user_id} and ${player2Details.user_id}`);
                return null;
            }

            if (!player1Socket || !player1Socket.connected) {
                logger.error(`Player 1 (${player1Details.socket_id}) disconnected after match. Informing player 2 if connected.`);
                if (player2Socket && player2Socket.connected) {
                    player2Socket.emit('matchmakingUpdate', { message: 'Opponent disconnected before game start. Please try again.' });
                }
                const gameObj = await this.updateGameAbondon(gameDetails.game_id);
                return gameObj; // Processed, but game not started
            }
            
            if (!player2Socket || !player2Socket.connected) {
                logger.error(`Player 2 (${player2Details.socket_id}) disconnected after match. Informing player 1.`);
                player1Socket.emit('matchmakingUpdate', { message: 'Opponent disconnected before game start. Please try again.' });
                const gameObj = await this.updateGameAbondon(gameDetails.game_id);
                return gameObj; // Processed, but game not started
            }

            const roomId = `game-${Math.random().toString(36).substring(2, 11)}`;
            
            // Make both sockets join the room
            player1Socket.join(roomId);
            player2Socket.join(roomId);
            logger.info(`Player ${player1Socket.id} and ${player2Socket.id} joined room ${roomId}`);
            const { p1Color, p2Color } = this.assignColorToUser(player1Details.black_win_percentage, player1Details.white_win_percentage);

            const gamePlayers: { id: string; user_id: string; username: string; color: "white" | "black";}[] = [
                { id: player1Socket.id, user_id: player1Details.user_id, username: player1Details.username || 'Player1', color: p1Color },
                { id: player2Socket.id, user_id: player2Details.user_id, username: player2Details.username || 'Player2', color: p2Color }
            ];
            
            const currentPlayerTurn = p1Color === 'white' ? player1Socket.id : player2Socket.id;

            const newRoom: Room = {
                id: roomId,
                players: gamePlayers.map(p => ({ socketId: p.id, user_id: p.user_id, username: p.username, color: p.color as 'white' | 'black', isConnected: true })),
                currentPlayerTurn,
                gameResultPoints,
                blackMovesArray: [],
                whiteMovesArray: []
            }

            await saveRoom(newRoom);
            logger.info(`Room metadata stored for room ${roomId}`);

            // Emit gameStart to everyone in the room
            io.to(roomId).emit('gameStart', {
                roomId,
                players: gamePlayers,
                currentPlayerTurn,
                room: newRoom
            });
            const gameObj = await this.udpateGameDetails(gameDetails.game_id, player2Details.user_id, player1Details.user_id, player2Details.user_id, player1Details.rating, player2Details.rating, gameResultPoints.win, roomId);
            logger.info(`Game ${roomId} started for ${gamePlayers[0].username} and ${gamePlayers[1].username}`);
            return gameObj;
        } catch (err) {
            logger.error(`Error in creating and joining room for players ${player1Details.user_id} and ${player2Details.user_id}: ${err}`);
            return null;
        }
    }





    public async createAndJoinTournamentsRoom(leaderboardArray: Array<LeaderBoardElement> ) : Promise<string> {
        try { 
            const roomId = `game-${Math.random().toString(36).substring(2, 11)}`;
            const newRoom = {
                id: roomId,
                participantsArray: leaderboardArray,
            }
            await saveTournamentRoom(newRoom);
            logger.info(`Room metadata stored for room ${roomId}`);

            return roomId;
        } catch (err) {
            logger.error(`Error in creating and joining room `);
            throw new Error(`Error in creating and joining room `);
        }
    }

    /**
     * 
     * @param socket 
    user_id: string; // Use lowercase primitive types
    rating: number;
    socket_id: string;
    win_percentage: number;
    black_win_percentage: number;
    white_win_percentage: number;
    game_type: string;
    // Add username if it's part of the details and needed for game setup
    username?: string;

     * @param username 
     * @param preferences 
     * @param game_amount 
     * @param userDetails 
     * @param allowExtendedSearch 
     * @returns 
     */
    public async  matchMakingRealTime(socket: Socket, username: string, preferences: any, game_amount: number, userDetails: any, allowExtendedSearch: boolean) : Promise<IGame | null> {
        try {
            console.log("preferences: "+ preferences + game_amount)
            const blockAmountRes = await this.accountService.blockAccountAmount(userDetails.user_id, game_amount);
            const isGamePossible = blockAmountRes.isPossible;
            if(!isGamePossible) {
                logger.info(`Insufficent Balance in account for user ${userDetails.user_id}`)
                socket.emit('matchmakingUpdate', { message: 'Insufficient balance in account. Please try again.' });
                return null;
            }
            const transaction = await this.transactionService.createTransaction(userDetails.user_id, blockAmountRes.userAccount.account_id, game_amount.toString(), TransactionType.GAME_MONEY);
            const res : { player1Details: UserDetailsRedisObj, player2Details: UserDetailsRedisObj } | null = await this.realtimeMatchmakingService.findMatch(userDetails, allowExtendedSearch);
            logger.info(`User ${socket.id} (${username}) added to matchmaking queue, response received ${JSON.stringify(res)}`);
            let gameObj = null;
            if(res) {
                const gameResultPoints = this.getEloRatingChange(res?.player1Details.rating || 0, res?.player2Details.rating || 0);
                gameObj = await this.createAndJoinRoom(socket, res.player1Details, res.player2Details, gameResultPoints);
            } else
                gameObj = await this.createNewGame(userDetails.user_id, preferences, transaction.transaction_id, userDetails.rating);
            return gameObj;
        } catch(err) {
            logger.error(`Error adding user with ${socket.id} and username ${username} to matchmaking queue: ${err}`);
            return null;
        }
    }
    
    public async getGameHistory(user_id: string) : Promise<IGameHistoryResposne[]> {
        try {
            const result : IGame[] = await this.gameRepository.getGameHistoryByUserId(user_id);

            const gameHistoryArray = result.map((game): IGameHistoryResposne => ({
                game_id: game.game_id,
                game_type: game.game_type,
                black_player_id: game.black_player_id || '',
                white_player_id: game.white_player_id || '',
                game_winner_id: game.game_winner_id || '',
                white_player_rating: game.white_player_rating || 0,
                black_player_rating: game.black_player_rating || 0,
            }));

            return gameHistoryArray;
        } catch (err) {
            logger.error(`Error fetching game history for user ${user_id}: ${err}`);
            throw new Error(`Error fetching game history for user ${user_id}: ${err}`);
        }
    }

    public async getUserGameRating(user_id: string) : Promise<IRating> {
        try {   
            const result : IRating | null = await this.ratingRepository.getRating(user_id);
            if(!result) throw new Error(`Error fetching user game rating for user ${user_id}`);
            return result;
        } catch(err) {
            logger.error(`Error fetching user game rating for user ${user_id}: ${err}`);
            throw new Error (`Error fetching user game rating for user ${user_id}: ${err}`)
        }
    }


    private getEloRatingChange(whitePlayerRating: number, blackPlayerRating: number) : { win: number, draw: number, loose: number  } {
        try {
                var playerA = whitePlayerRating;
                var playerB = blackPlayerRating;

                //Gets expected score for first parameter
                var expectedScoreA = this.elo.getExpected(whitePlayerRating, blackPlayerRating);
                var expectedScoreB = this.elo.getExpected(blackPlayerRating, whitePlayerRating);
                
                //update score, 1 if won 0 if lost
                let win = this.elo.updateRating(expectedScoreA, 1, whitePlayerRating);
                let loose = this.elo.updateRating(expectedScoreA, 0, whitePlayerRating);
                let draw = this.elo.updateRating(expectedScoreA, 0.5, whitePlayerRating);
                
            return { win, draw, loose };
        } catch (err) {
            logger.error(`Error calculating elo rating change: ${err}`);
            throw new Error(`Error calculating elo rating change: ${err}`);
        }
    }
}

export default GameService;