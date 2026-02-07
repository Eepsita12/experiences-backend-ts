import { Router, Request, Response } from 'express'
import { db } from '../db'
import requireAuth from '../middlewares/requireAuth'
import requireRole from '../middlewares/requireRole'
import { count, error } from 'node:console'

const router = Router()

type ExperienceRow = {
  id: number
  created_by: number
  status: 'draft' | 'published' | 'blocked'
}


router.post('/', requireAuth, requireRole('host','admin'),(req:Request,res:Response)=>{
    const { title, description, location, price, start_time }= req.body

    if(!title || !location || !price || !start_time) {
        return res.status(400).json({
            error:{
                code: 'VALIDATION_ERROR',
                message: 'Title, location, price and start_time are required',
                details: []
            }
        })
    }

    db.run(
        `
      INSERT INTO experiences
      (title, description, location, price, start_time, created_by, status)
      VALUES (?, ?, ?, ?, ?, ?, 'draft')
      `,
      [title,
        description || null,
        location,
        price,
        start_time,
        req.user!.userId
      ],
      function(err) {
        if(err) {
            return res.status(500).json({
                error:
                {
                    code: 'SERVER_ERROR',
                    message: 'Failed to create experience',
                    details: []
                }
            })
        }

        return res.status(201).json({
            message: 'Experience created successfully',
            experience: {
                id: this.lastID,
                title,
                location,
                price,
                start_time,
                status: 'draft'
            }
        })
      }
    )
})

router.patch('/:id/publish', requireAuth, (req:Request, res:Response)=>{
    const experienceId = req.params.id
    const userId = req.user!.userId
    const role = req.user!.role

    db.get(`SELECT id, created_by, status FROM experiences WHERE id = ?`,[experienceId],(err,experience: ExperienceRow | undefined)=>{
        if(err){
            return res.status(500).json({
                error:{
                    code: 'SERVER_ERROR',
                    message: 'Database error',
                    details: []
                }
            })
        }

        if(!experience){
            return res.status(404).json({
                error:{
                    code: 'NOT_FOUND',
                message: 'Experience not found',
                details: []
                }
        })
    }

    const isOwner = experience.created_by === userId
    const isAdmin = role === 'admin'

    if(!isOwner && !isAdmin){
        return res.status(403).json({
            error:{
                code: 'FORBIDDEN',
                message: 'You are not allowed to publish this experience',
                details: []
            }
        })
    }

    db.run(`UPDATE experiences SET status = 'published' WHERE id = ?`,
        [experienceId],
        function(updateErr){
        if(updateErr) {
            return res.status(500).json({
                error:{
                    code: 'SERVER_ERROR',
                    message: 'Failed to publish experience',
                    details: []
                }
            })
        }

        return res.status(200).json({
            message: 'Experience published successfully'
        })
    })
})
})

router.patch('/:id/block',requireAuth,requireRole('admin'),(req:Request,res:Response)=>{
    const experienceId = req.params.id

    db.get(`SELECT id FROM experiences WHERE id = ?`,[experienceId],(err,experience)=>{
        if(err){
            return res.status(500).json({
                error:{
                    code: 'SERVER_ERROR',
                    message: 'Database error',
                    details: []
                }
            })
        }

        if(!experience){
            return res.status(404).json({
                error:{
                    code: 'NOT_FOUND',
                    message: 'Experience not found',
                    details: []
                }
            })
        }

        db.run(`UPDATE experiences SET status = 'blocked' WHERE id = ?`,[experienceId],function(updateErr){
            if(updateErr) {
                return res.status(500).json({
                    error:{
                         code: 'SERVER_ERROR',
                        message: 'Failed to block experience',
                        details: []
                    }
                })
            }

            return res.status(200).json({
                message: 'Experience blocked successfully'
            })
        })
    })
})

router.get('/',(req:Request,res:Response)=>{
    const {location, from, to, page='1',limit='10',sort='asc'} = req.query
    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const offset = (pageNum-1) * limitNum

    let query = ` SELECT id, title, description, location, price, start_time FROM experiences WHERE status = 'published'`

    const params: any[]=[]

    if(location){
        query+= `AND location = ?`
        params.push(location)
    }

    if(from){
        query+= `AND start_time <= ?`
        params.push(to)
    }

    query+= ` ORDER BY start_time ${sort === 'desc' ? 'DESC' : 'ASC'}`

    query+= ` LIMIT ? OFFSET ?`
    params.push(limitNum, offset)

    db.all(query,params,(err,rows) => {
        if(err){ 
            return res.status(500).json({
                error:{
                code: 'SERVER_ERROR',
                message: 'Failed to fetch experiences',
                details: []
            }
        })
    }

    return res.status(200).json({
        page:pageNum,
        limit:limitNum,
        count:rows.length,
        experiences:rows
    })
    })
})

router.post('/:id/book', requireAuth, requireRole('user'), (req, res) => {
  const experienceId = Number(req.params.id);
  const userId = req.user!.userId;
  const seats = Number(req.body?.seats ?? 1);



  if (!Number.isInteger(seats) || seats < 1) {
    return res.status(400).json({
      error: { 
        code: 'VALIDATION_ERROR', 
        message: 'seats must be >= 1', 
        details: [] }
    });
  }

  db.get(
    `SELECT id, status FROM experiences WHERE id = ?`,
    [experienceId],
    (err, experience: { id: number; status: string } | undefined) => {
      if (err) {
        return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Database error', details: [] } });
      }

      if (!experience) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Experience not found', details: [] } });
      }

      if (experience.status !== 'published') {
        return res.status(400).json({
          error: { code: 'INVALID_STATUS', message: 'Experience is not available for booking', details: [] }
        });
      }

      db.run(
        `INSERT INTO bookings (user_id, experience_id, seats) VALUES (?, ?, ?)`,
        [userId, experienceId, seats],
        function (bookingErr: any) {
          if (bookingErr) {
        
            if (bookingErr.code === 'SQLITE_CONSTRAINT' && String(bookingErr.message).includes('UNIQUE')) {
              return res.status(400).json({
                error: { code: 'ALREADY_BOOKED', message: 'You have already booked this experience', details: [] }
              });
            }

            return res.status(400).json({
              error: { code: 'BOOKING_FAILED', message: bookingErr.message ?? 'Booking failed', details: [] }
            });
          }

          return res.status(201).json({
            message: 'Experience booked successfully',
            booking: { id: this.lastID, experienceId, userId, seats }
          });
        }
      );
    }
  );
});


export default router
