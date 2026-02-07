import express from 'express'
import dotenv from 'dotenv'
import authRoutes from '../src/routes/auth.routes'
import './db'
import requireAuth from '../src/middlewares/requireAuth'
import requireRole from './middlewares/requireRole'
import experienceRoutes from '../src/routes/experience.routes'

dotenv.config()

const app= express()
app.use(express.json())

const PORT =process.env.PORT || 4000

app.get('/health', (req,res) => {
    res.json({status:'ok'})
})

// app.get('/protected', requireAuth, (req, res) => {
//   res.json({
//     message: 'You are authenticated',
//     user: req.user
//   })
// })

// app.get(
//   '/admin-only',
//   requireAuth,
//   requireRole('admin'),
//   (req, res) => {
//     res.json({ message: 'Welcome admin 👑' })
//   }
// )

app.use('/auth',authRoutes)
app.use('/experiences',experienceRoutes)

app.listen(PORT,() => {
    console.log(`Server running on port ${PORT}`);
    
})