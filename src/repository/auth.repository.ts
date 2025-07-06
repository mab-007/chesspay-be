import { Model } from "mongoose";
import { IAuth } from "../interface/entity/auth.entity.interface";
import AuthSchemaModel from "../entity/auth.entity";

class AuthRepository {
    private authModel: Model<IAuth>;
  
    constructor() {
      this.authModel = AuthSchemaModel;
    }

    public async createAuth(auth: IAuth): Promise<IAuth> {
      return await this.authModel.create(auth);
    }
    
}

export default AuthRepository;