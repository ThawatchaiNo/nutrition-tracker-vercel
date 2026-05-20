import { Router } from 'express'
import { Activity } from '../database/db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)

router.get('/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    const match = { userId: req.user.id }
    if (startDate) match.date = { $gte: startDate }
    if (endDate) match.date = { ...match.date, $lte: endDate }

    const acts = await Activity.find(match)
    const byDate = {}
    for (const a of acts) {
      if (!byDate[a.date]) byDate[a.date] = { date: a.date, totalCaloriesBurned: 0, totalDuration: 0, count: 0 }
      byDate[a.date].totalCaloriesBurned += a.caloriesBurned
      byDate[a.date].totalDuration       += a.duration
      byDate[a.date].count++
    }
    res.json(Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date)))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.get('/', async (req, res) => {
  try {
    const { date } = req.query
    const q = { userId: req.user.id }
    if (date) q.date = date
    const acts = await Activity.find(q).sort({ createdAt: 1 })
    res.json(acts.map(a => ({ ...a.toObject(), id: a._id })))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.post('/', async (req, res) => {
  try {
    const act = await Activity.create({ ...req.body, userId: req.user.id })
    res.status(201).json({ ...act.toObject(), id: act._id })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.delete('/:id', async (req, res) => {
  try {
    await Activity.findOneAndDelete({ _id: req.params.id, userId: req.user.id })
    res.json({ success: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

export default router
