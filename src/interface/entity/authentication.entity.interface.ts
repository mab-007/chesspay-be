export interface IAuthentication {
    user_id: string
    authentication_id: string
    authentication_type: string
    authentication_token: string
    authentication_expiry: number
    is_active: boolean
    createdAt?: Date
    updatedAt?: Date
}

