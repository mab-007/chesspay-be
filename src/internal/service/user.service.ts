class UserService {


    public async getUserDetils(user_id: string) : Promise<any> {
    }

    public async createUser(userDetails: any) : Promise<any> {
        console.log(userDetails)
    }
}

export default UserService;