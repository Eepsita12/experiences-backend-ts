import express from 'express'
import dotenv from 'dotenv'
import authRoutes from '../src/routes/auth.routes'
import { db } from './db'
import experienceRoutes from '../src/routes/experience.routes'
import { requestLogger } from './middlewares/logger'

dotenv.config()

const app= express()    
app.use(express.json())

const PORT =process.env.PORT || 4000

app.get('/health', (req, res) => {
  db.get('SELECT 1', [], (err) => {
    if (err) {
      return res.status(500).json({
        status: 'down',
        db: 'disconnected'
      })
    }

    return res.json({
      status: 'ok',
      db: 'connected'
    })
  })
})


app.use('/auth',authRoutes)
app.use('/experiences',experienceRoutes)
app.use(requestLogger)

app.listen(PORT,() => {
    console.log(`Server running on port ${PORT}`);
    
})