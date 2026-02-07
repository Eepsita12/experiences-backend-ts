import { Request,Response,NextFunction } from "express";
import jwt, { JwtPayload } from 'jsonwebtoken'
import { error } from "node:console";

type JWTPayload= {
    userId: number,
    role: 'user'|'host'|'admin'
}

declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload
        }
    }
}

const requireAuth = (req:Request, res:Response, next:NextFunction)=> {
    const authHeader = req.headers.authorization

    if(!authHeader || !authHeader.startsWith('Bearer')){
        return res.status(400).json({
            error:
            {
                code: 'UNAUTHORIZED',
                message: 'Authorization token missing',
                details: []
            }
        })
    }

    const token = authHeader.split(' ')[1]

    try{
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET as string
        ) as JWTPayload

        req.user = decoded
        next()

    } catch(error) {
        return res.status(401).json({
            error:
            {
                code: 'INVALID_TOKEN',
                message: 'Invalid or expired token',
                details: []
            }
        })

    }
}

export default requireAuth