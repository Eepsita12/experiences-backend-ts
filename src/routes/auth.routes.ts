import { Router, Request, Response } from "express"
import bcrypt from 'bcrypt'
import { db } from "../db"
import sqlite3 from "sqlite3"
import jwt from 'jsonwebtoken'

const router = Router()

type UserRow = {
    id: number
    email: string
    password_hash: string
    role: 'user' | 'host' | 'admin'
}


//signup
router.post('/signup', async (req: Request, res: Response) => {
    const { email, password, role } = req.body


    if (!email || !password || !role) {
        return res.status(400).json({
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Email, password and role are required',
                details: []
            }
        })
    }

    if (!['user', 'host'].includes(role)) {
        return res.status(400).json({
            error: {
                code: 'INVALID_ROLE',
                message: 'Role must be user or host',
                details: []
            }
        })
    }


    bcrypt.hash(password, 10).then((passwordHash) => {
        db.run(
            `INSERT INTO users (email, password_hash, role)
       VALUES (?, ?, ?)`,
            [email, passwordHash, role],
            function (this: sqlite3.RunResult, err) {
                if (err) {
                    return res.status(400).json({
                        error: {
                            code: 'USER_EXISTS',
                            message: 'Email already registered',
                            details: []
                        }
                    })
                }

                return res.status(201).json({
                    message: 'User created successfully',
                    user: {
                        id: this.lastID,
                        email,
                        role
                    }
                })
            }
        )
    })
})

//login
router.post('/login', (req: Request, res: Response) => {
    const { email, password } = req.body


    if (!email || !password) {
        return res.status(400).json({
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Email and password are required',
                details: []
            }
        })
    }


    db.get(
        `SELECT id, email, password_hash, role FROM users WHERE email = ?`,
        [email],
        async (err, row: UserRow | undefined) => {
            if (err) {
                return res.status(500).json({
                    error: {
                        code: 'SERVER_ERROR',
                        message: 'Database error',
                        details: []
                    }
                })
            }

            if (!row) {
                return res.status(401).json({
                    error: {
                        code: 'INVALID_CREDENTIALS',
                        message: 'Invalid email or password',
                        details: []
                    }
                })
            }


            const isMatch = await bcrypt.compare(password, row.password_hash)

            if (!isMatch) {
                return res.status(401).json({
                    error: {
                        code: 'INVALID_CREDENTIALS',
                        message: 'Invalid email or password',
                        details: []
                    }
                })
            }

            const token = jwt.sign(
                {
                    userId: row.id,
                    role: row.role
                },
                process.env.JWT_SECRET as string,
                { expiresIn: '1d' }
            )

            return res.status(200).json({
                token,
                user: {
                    id: row.id,
                    role: row.role
                }
            })
        }
    )
})

export default router