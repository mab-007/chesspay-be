import logger from "../../utils/logger";
import { addUserToMatchmakingQueue } from "../../utils/redis.client";
import RealtimeMatchmaking from "../../worker/matchmaking/realtime.matchmaking.worker";
import { Server, Socket } from "socket.io";

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

    private assignColorToUser(user: Player, opponent: Player): 'white' | 'black' {
        // Rule 5: "Choose color of the user by simply by looking if opponent if greater number of color played
        // as compared to the user then user should get the color (i.e black/white)"
        // This means if the opponent has played more of a certain color than the user, the user gets that color.

        if (opponent.stats.gamesAsWhite > user.stats.gamesAsWhite) {
            return 'white'; // User (player1) gets White
        } else if (opponent.stats.gamesAsBlack > user.stats.gamesAsBlack) {
            return 'black'; // User (player1) gets Black
        }
        // Default: if none of the above, or if user has played more of both.
        // A common default is white for the player initiating, or random.
        return 'white'; // User (player1) defaults to White
    }


    private findOpponnentByCriteria(currentUser: Player) {

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
            const player1Color = this.assignColorToUser(currentUser, bestMatchFound);
            return {
                player1: currentUser,
                player2: bestMatchFound,
                player1Color: player1Color,
            };
        }

        return null; // No suitable match found after all iterations
    }

    // public handleJoinRoom = () => {
    //     if (socket && roomToJoin && username) {
    //         socket.emit('joinRoom', { roomId: roomToJoin, username }, (response: { status: string; message?: string; room?: any }) => {
    //             if (response.status === 'success' && response.room) {
    //                 setGameMessage(`Joined room: ${response.room.id}.`);
    //                 console.log('Joined room:', response.room);
    //                 // gameStart event will handle setting up player colors and turn
    //             } else {
    //                 setGameMessage(`Error joining room: ${response.message}`);
    //                 console.error('Error joining room:', response.message);
    //             }
    //         });
    //     }
    // };

    // const handleCreateRoom = () => {
    //     if (socket && username) {
    //         socket.emit('createRoom', { username }, (response: { roomId?: string; error?: string }) => {
    //             if (response.roomId) {
    //                 setRoomId(response.roomId);
    //                 setGameMessage(`Room created: ${response.roomId}. Waiting for opponent...`);
    //                 console.log('Room created:', response.roomId);
    //             } else {
    //                 setGameMessage(`Error creating room: ${response.error}`);
    //                 console.error('Error creating room:', response.error);
    //             }
    //         });
    //     }
    // };

    public async  createAndJoinRoom(socket: Socket, player_one_id: String, player_two_id: String) : Promise<Boolean> {
        try { 

            if (socket && player_one_id && player_two_id) {
                let roomId : String | null = null;
                await socket.emit('createRoom', { player_one_id }, (response: { roomId?: string; error?: string }) => {
                    if (response.roomId) {
                        roomId = response.roomId;
                    } else {
                        console.error('Error creating room:', response.error);
                        throw Error('Error creating room');
                    }
                });
                
                if(roomId) {
                    await socket.emit('joinRoom', { roomId, player_two_id }, (response: { status: string; message?: string; room?: any }) => {
                        if (response.status === 'success' && response.room) {
                            logger.info(`Joined room: ${response.room.id}.`);
                            logger.info('Joined room:', response.room);
                            // gameStart event will handle setting up player colors and turn
                        } else {
                            logger.error(`Error joining room: ${response.message}`);
                            logger.error('Error joining room:', response.message);
                            throw Error('Error joining room');
                        }
                    });
                }
            }
            return true;
        } catch (err) {
            return false
        }
    }

    public async  matchMakingRealTime(socket: Socket, username: string, preferences: any, userDetails: any, allowExtendedSearch: boolean) : Promise<Boolean> {
        try {
            const res = await this.realtimeMatchmakingService.findMatch(userDetails, allowExtendedSearch);
            logger.info(`User ${socket.id} (${username}) added to matchmaking queue.`);
            await this.createAndJoinRoom(socket, 'res.player1Details.user_id', 'res.player2Details.user_id');
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