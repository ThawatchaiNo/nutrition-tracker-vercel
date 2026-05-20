import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { connectDB, User, seedFoodItems } from './db.js'

const app = express()
app.use(express.json())

const JWT_SECRET = process.env.JWT_SECRET || 'nutritrack_jwt_secret_2024'
const generateToken = (user) => jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' })

app.post('/api/auth/register', async (req, res) => {
  try {
    await connectDB()
    await seedFoodItems()
    const { email, password, name } = req.body
    if (await User.findOne({ email })) return res.status(400).json({ error: 'Email already registered' })
    const hash = await bcrypt.hash(password, 10)
    const user = await User.create({ email, name, password: hash })
    res.status(201).json({ token: generateToken(user), user: { id: user._id, email, name } })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    await connectDB()
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ error: 'Invalid credentials' })
    res.json({ token: generateToken(user), user: { id: user._id, email: user.email, name: user.name } })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

export default app
