import { Router } from 'express'
import { Goal, FoodItem } from '../database/db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)

router.get('/', async (req, res) => {
  try {
    const goal = await Goal.findOne({ userId: req.user.id }).sort({ updatedAt: -1 })
    res.json(goal)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.post('/', async (req, res) => {
  try {
    const goal = await Goal.create({ ...req.body, userId: req.user.id, updatedAt: new Date() })
    res.status(201).json(goal)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

export { router as goalsRouter }

// ── Food Items ──
const foodRouter = Router()
foodRouter.use(authMiddleware)

foodRouter.get('/', async (req, res) => {
  try {
    const { q } = req.query
    const filter = {
      $or: [
        { custom: false },
        { custom: true, userId: req.user.id }
      ]
    }
    if (q) filter.name = { $regex: q, $options: 'i' }
    const items = await FoodItem.find(filter).sort({ custom: 1, name: 1 })
    res.json(items.map(f => ({ ...f.toObject(), id: f._id })))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

foodRouter.post('/', async (req, res) => {
  try {
    const dup = await FoodItem.findOne({
      custom: true, userId: req.user.id,
      name: { $regex: `^${req.body.name}$`, $options: 'i' }
    })
    if (dup) return res.status(400).json({ error: 'มีเมนูนี้อยู่แล้ว' })
    const item = await FoodItem.create({ ...req.body, custom: true, userId: req.user.id })
    res.status(201).json({ ...item.toObject(), id: item._id })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

foodRouter.put('/:id', async (req, res) => {
  try {
    const item = await FoodItem.findOneAndUpdate(
      { _id: req.params.id, custom: true, userId: req.user.id },
      req.body, { new: true }
    )
    if (!item) return res.status(404).json({ error: 'ไม่พบเมนูนี้' })
    res.json({ ...item.toObject(), id: item._id })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

foodRouter.delete('/:id', async (req, res) => {
  try {
    const item = await FoodItem.findOneAndDelete({ _id: req.params.id, custom: true, userId: req.user.id })
    if (!item) return res.status(404).json({ error: 'ไม่พบเมนูนี้' })
    res.json({ success: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

export { foodRouter }
