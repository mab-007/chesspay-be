import { IAuth } from "../../interface/entity/auth.entity.interface";
import AuthRepository from "../../repository/auth.repository";
import logger from "../../utils/logger";

class AuthService {
    private authRepository: AuthRepository;

    constructor() {
        this.authRepository = new AuthRepository();
    }

    public async createAuth(uuid: string, token?: string, token_expiry?: Date): Promise<void> {
        try {
            const authObj: IAuth = {
                user_id: uuid,
                token: token,
                token_expiry: token_expiry ? new Date(token_expiry).getTime() : undefined,
            };
            await this.authRepository.createAuth(authObj);
        } catch (error) {
            logger.error(`Error in storing auth data for user ${uuid}: ${error}`);
        }
    }
}

export default AuthService;
