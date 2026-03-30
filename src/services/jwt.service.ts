import env from "../config/env.js";
import jwt from "jsonwebtoken"
import { UnauthorizedError, ValidationError } from "../utils/errors.js";


export const verifyToken = (token:string)=>{
    try {
        return jwt.verify(token, env.JWT_SECRET_KEY)
    } catch {
        throw new UnauthorizedError("Invalid credentials")
    }
}


export const generateToken = (payload:string|object)=>{
    // @ts-ignore because expiresIn expects number | ms.StringValue | undefined
    // but we have it as a plain string in env
    const token = jwt.sign(payload , env.JWT_SECRET_KEY , {
        expiresIn:env.JWT_EXPIRES_IN
    })
    return token
}
