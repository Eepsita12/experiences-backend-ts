import { Request,Response,NextFunction } from "express"
import { error } from "node:console"

const requireRole = (...allowedRoles: Array<'user'|'host'|'admin'>)=>{
    return(req:Request,res:Response,next:NextFunction)=> {
        if(!req.user){
            return res.status(401).json({
                error:{
                    code: 'UNAUTHENTICATED',
                    message: 'Authentication required',
                    details: []
                }
            })
        }

        if(!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error:{
                    code: 'FORBIDDEN',
                    message: 'You do not have permission to perform this action',
                    details: []
                }
            })
        }

        next()
    }
}

export default requireRole