import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { User } from '../database/db.js'
import { generateToken } from '../middleware/auth.js'

const router = Router()

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body
    if (await User.findOne({ email }))
      return res.status(400).json({ error: 'Email already registered' })
    const hash = await bcrypt.hash(password, 10)
    const user = await User.create({ email, name, password: hash })
    const token = generateToken(user)
    res.status(201).json({ token, user: { id: user._id, email, name } })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })
    const token = generateToken(user)
    res.json({ token, user: { id: user._id, email: user.email, name: user.name } })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
