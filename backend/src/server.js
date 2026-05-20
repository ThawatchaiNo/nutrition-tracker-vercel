import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { connectDB, seedFoodItems } from './database/db.js'
import authRoutes from './routes/auth.js'
import foodLogsRoutes from './routes/foodLogs.js'
import activitiesRoutes from './routes/activities.js'
import { goalsRouter, foodRouter } from './routes/goals.js'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3001

async function start() {
  await connectDB()
  await seedFoodItems()

  const app = express()
  app.use(cors())
  app.use(express.json())

  // ── API Routes ──
  app.use('/api/auth', authRoutes)
  app.use('/api/food-logs', foodLogsRoutes)
  app.use('/api/activities', activitiesRoutes)
  app.use('/api/goals', goalsRouter)
  app.use('/api/food-items', foodRouter)
  app.get('/api/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

  // ── Serve Vue Frontend ──
  const distPath = join(__dirname, '../../frontend/dist')
  if (existsSync(distPath)) {
    app.use(express.static(distPath))
    app.get('*', (req, res) => res.sendFile(join(distPath, 'index.html')))
    console.log('🌐 Serving Vue frontend')
  }

  app.listen(PORT, () => console.log(`🚀 NutriTrack running on http://localhost:${PORT}`))
}

start().catch(console.error)
