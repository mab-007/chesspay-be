import { Model } from "mongoose";
import { ITournament } from "../interface/entity/tournament.entity.interface";
import TournamentModel from "../entity/tournament.entity";

class TournamentRepository {
    private tournamentModel: Model<ITournament>;

    constructor() {
        this.tournamentModel = TournamentModel;
    }

    public async createTournament(tournament: ITournament): Promise<ITournament> {
        return await this.tournamentModel.create(tournament);
    }

    public async findTournamentById(tournamentId: string): Promise<ITournament | null> {
        return await this.tournamentModel.findOne({ tournament_id: tournamentId }).exec();
    }

    public async updateTournament(tournamentId: string, updates: Partial<ITournament>): Promise<ITournament | null> {
        return await this.tournamentModel.findOneAndUpdate({ tournament_id: tournamentId }, updates, { new: true }).exec();
    }

    public async findAllTournaments(status: string): Promise<ITournament[]> {
        return await this.tournamentModel.find({tournament_status: status}).sort({
            tournament_start_date: -1   
        }).exec();
    }
}

export default TournamentRepository;