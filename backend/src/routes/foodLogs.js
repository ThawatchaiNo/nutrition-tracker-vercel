import { Router } from 'express'
import { FoodLog } from '../database/db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)

router.get('/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    const match = { userId: req.user.id }
    if (startDate) match.date = { $gte: startDate }
    if (endDate) match.date = { ...match.date, $lte: endDate }

    const logs = await FoodLog.find(match)
    const byDate = {}
    for (const l of logs) {
      if (!byDate[l.date]) byDate[l.date] = { date: l.date, calories: 0, carbs: 0, protein: 0, fat: 0, sugar: 0, sodium: 0, cholesterol: 0 }
      byDate[l.date].calories    += l.calories
      byDate[l.date].carbs       += l.carbs
      byDate[l.date].protein     += l.protein
      byDate[l.date].fat         += l.fat
      byDate[l.date].sugar       += l.sugar
      byDate[l.date].sodium      += l.sodium
      byDate[l.date].cholesterol += l.cholesterol
    }
    res.json(Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date)))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.get('/', async (req, res) => {
  try {
    const { date } = req.query
    const q = { userId: req.user.id }
    if (date) q.date = date
    const logs = await FoodLog.find(q).sort({ createdAt: 1 })
    res.json(logs.map(l => ({ ...l.toObject(), id: l._id })))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.post('/', async (req, res) => {
  try {
    const log = await FoodLog.create({ ...req.body, userId: req.user.id })
    res.status(201).json({ ...log.toObject(), id: log._id })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.put('/:id', async (req, res) => {
  try {
    const log = await FoodLog.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body, { new: true }
    )
    if (!log) return res.status(404).json({ error: 'Not found' })
    res.json({ ...log.toObject(), id: log._id })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.delete('/:id', async (req, res) => {
  try {
    await FoodLog.findOneAndDelete({ _id: req.params.id, userId: req.user.id })
    res.json({ success: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

export default router
