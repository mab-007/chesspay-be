import { IAuth } from "../../interface/entity/auth.entity.interface";
import AuthRepository from "../../repository/auth.repository";
import logger from "../../utils/logger";

class AuthService {
    private authRepository: AuthRepository;

    constructor() {
        this.authRepository = new AuthRepository();
    }

    public async createAuth(uuid: string, supabase_id: string, token?: string, token_expiry?: Date): Promise<void> {
        try {
            const authObj: IAuth = {
                user_id: uuid,
                supabase_id: supabase_id,
                token: token,
                token_expiry: token_expiry ? new Date(token_expiry).getTime() : undefined,
            };
            await this.authRepository.createAuth(authObj);
        } catch (error) {
            logger.error(`Error in storing auth data for user ${uuid}: ${error}`);
        }
    }

    public async fetchBySupabaseId(supabaseId: string): Promise<IAuth | null> {
        try {
            return await this.authRepository.findBySupabaseId(supabaseId);
        } catch (error) {
            logger.error(`Error in fetching auth data for user ${supabaseId}: ${error}`);
            return null;
        }
    }
}

export default AuthService;
