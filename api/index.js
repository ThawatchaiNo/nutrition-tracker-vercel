import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { connectDB, User, Goal, FoodLog, Activity, FoodItem, seedFoodItems } from './db.js'

const app = express()
app.use(express.json())

const JWT_SECRET = process.env.JWT_SECRET || 'nutritrack_jwt_secret_2024'

function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'No token' })
  try { req.user = jwt.verify(token, JWT_SECRET); next() }
  catch { res.status(401).json({ error: 'Invalid token' }) }
}

const genToken = (user) => jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' })

app.get('/api/health', (_, res) => res.json({ status: 'ok' }))

// ── Auth ──
app.post('/api/auth/register', async (req, res) => {
  try {
    await connectDB(); await seedFoodItems()
    const { email, password, name } = req.body
    if (await User.findOne({ email })) return res.status(400).json({ error: 'Email already registered' })
    const user = await User.create({ email, name, password: await bcrypt.hash(password, 10) })
    res.status(201).json({ token: genToken(user), user: { id: user._id, email, name } })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    await connectDB()
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ error: 'Invalid credentials' })
    res.json({ token: genToken(user), user: { id: user._id, email: user.email, name: user.name } })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── Goals ──
app.get('/api/goals', auth, async (req, res) => {
  try { await connectDB(); res.json(await Goal.findOne({ userId: req.user.id }).sort({ updatedAt: -1 })) }
  catch (e) { res.status(500).json({ error: e.message }) }
})
app.post('/api/goals', auth, async (req, res) => {
  try { await connectDB(); res.status(201).json(await Goal.create({ ...req.body, userId: req.user.id, updatedAt: new Date() })) }
  catch (e) { res.status(500).json({ error: e.message }) }
})

// ── Food Logs ──
app.get('/api/food-logs/summary', auth, async (req, res) => {
  try {
    await connectDB()
    const { startDate, endDate } = req.query
    const match = { userId: req.user.id }
    if (startDate || endDate) match.date = {}
    if (startDate) match.date.$gte = startDate
    if (endDate) match.date.$lte = endDate
    const logs = await FoodLog.find(match)
    const byDate = {}
    for (const l of logs) {
      if (!byDate[l.date]) byDate[l.date] = { date: l.date, calories: 0, carbs: 0, protein: 0, fat: 0, sugar: 0, sodium: 0, cholesterol: 0 }
      byDate[l.date].calories += l.calories; byDate[l.date].carbs += l.carbs
      byDate[l.date].protein += l.protein; byDate[l.date].fat += l.fat
      byDate[l.date].sugar += l.sugar; byDate[l.date].sodium += l.sodium
      byDate[l.date].cholesterol += l.cholesterol
    }
    res.json(Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date)))
  } catch (e) { res.status(500).json({ error: e.message }) }
})
app.get('/api/food-logs', auth, async (req, res) => {
  try {
    await connectDB()
    const q = { userId: req.user.id }
    if (req.query.date) q.date = req.query.date
    res.json((await FoodLog.find(q).sort({ createdAt: 1 })).map(l => ({ ...l.toObject(), id: l._id })))
  } catch (e) { res.status(500).json({ error: e.message }) }
})
app.post('/api/food-logs', auth, async (req, res) => {
  try { await connectDB(); const l = await FoodLog.create({ ...req.body, userId: req.user.id }); res.status(201).json({ ...l.toObject(), id: l._id }) }
  catch (e) { res.status(500).json({ error: e.message }) }
})
app.put('/api/food-logs/:id', auth, async (req, res) => {
  try {
    await connectDB()
    const log = await FoodLog.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    )
    if (!log) return res.status(404).json({ error: 'Not found' })
    res.json({ ...log.toObject(), id: log._id })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.delete('/api/food-logs/:id', auth, async (req, res) => {
  try { await connectDB(); await FoodLog.findOneAndDelete({ _id: req.params.id, userId: req.user.id }); res.json({ success: true }) }
  catch (e) { res.status(500).json({ error: e.message }) }
})

// ── Activities ──
app.get('/api/activities/summary', auth, async (req, res) => {
  try {
    await connectDB()
    const { startDate, endDate } = req.query
    const match = { userId: req.user.id }
    if (startDate || endDate) match.date = {}
    if (startDate) match.date.$gte = startDate
    if (endDate) match.date.$lte = endDate
    const acts = await Activity.find(match)
    const byDate = {}
    for (const a of acts) {
      if (!byDate[a.date]) byDate[a.date] = { date: a.date, totalCaloriesBurned: 0, totalDuration: 0, count: 0 }
      byDate[a.date].totalCaloriesBurned += a.caloriesBurned
      byDate[a.date].totalDuration += a.duration
      byDate[a.date].count++
    }
    res.json(Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date)))
  } catch (e) { res.status(500).json({ error: e.message }) }
})
app.get('/api/activities', auth, async (req, res) => {
  try {
    await connectDB()
    const q = { userId: req.user.id }
    if (req.query.date) q.date = req.query.date
    res.json((await Activity.find(q).sort({ createdAt: 1 })).map(a => ({ ...a.toObject(), id: a._id })))
  } catch (e) { res.status(500).json({ error: e.message }) }
})
app.post('/api/activities', auth, async (req, res) => {
  try { await connectDB(); const a = await Activity.create({ ...req.body, userId: req.user.id }); res.status(201).json({ ...a.toObject(), id: a._id }) }
  catch (e) { res.status(500).json({ error: e.message }) }
})
app.put('/api/activities/:id', auth, async (req, res) => {
  try {
    await connectDB()
    const act = await Activity.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body, { new: true }
    )
    if (!act) return res.status(404).json({ error: 'Not found' })
    res.json({ ...act.toObject(), id: act._id })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.delete('/api/activities/:id', auth, async (req, res) => {
  try { await connectDB(); await Activity.findOneAndDelete({ _id: req.params.id, userId: req.user.id }); res.json({ success: true }) }
  catch (e) { res.status(500).json({ error: e.message }) }
})

// ── Food Items ──
app.get('/api/food-items', auth, async (req, res) => {
  try {
    await connectDB()
    const filter = { $or: [{ custom: false }, { custom: true, userId: req.user.id }] }
    if (req.query.q) filter.name = { $regex: req.query.q, $options: 'i' }
    res.json((await FoodItem.find(filter).sort({ custom: 1, name: 1 })).map(f => ({ ...f.toObject(), id: f._id })))
  } catch (e) { res.status(500).json({ error: e.message }) }
})
app.post('/api/food-items', auth, async (req, res) => {
  try {
    await connectDB()
    const dup = await FoodItem.findOne({ custom: true, userId: req.user.id, name: { $regex: `^${req.body.name}$`, $options: 'i' } })
    if (dup) return res.status(400).json({ error: 'มีเมนูนี้อยู่แล้ว' })
    const item = await FoodItem.create({ ...req.body, custom: true, userId: req.user.id })
    res.status(201).json({ ...item.toObject(), id: item._id })
  } catch (e) { res.status(500).json({ error: e.message }) }
})
app.put('/api/food-items/:id', auth, async (req, res) => {
  try {
    await connectDB()
    const item = await FoodItem.findOneAndUpdate({ _id: req.params.id, custom: true, userId: req.user.id }, req.body, { new: true })
    if (!item) return res.status(404).json({ error: 'ไม่พบเมนูนี้' })
    res.json({ ...item.toObject(), id: item._id })
  } catch (e) { res.status(500).json({ error: e.message }) }
})
app.delete('/api/food-items/:id', auth, async (req, res) => {
  try {
    await connectDB()
    const item = await FoodItem.findOneAndDelete({ _id: req.params.id, custom: true, userId: req.user.id })
    if (!item) return res.status(404).json({ error: 'ไม่พบเมนูนี้' })
    res.json({ success: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── Open Food Facts Proxy ── แก้ปัญหา CORS
app.get('/api/world-food', auth, async (req, res) => {
  try {
    const { q } = req.query
    if (!q) return res.json([])
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=20&fields=code,product_name,product_name_en,brands,image_small_url,nutriments`
    const response = await fetch(url)
    const data = await response.json()
    const results = (data.products || [])
      .filter(p => p.product_name && p.nutriments?.['energy-kcal_100g'])
      .slice(0, 15)
      .map(p => ({
        code: p.code,
        product_name: p.product_name || p.product_name_en || '',
        brands: p.brands || '',
        image_small_url: p.image_small_url || '',
        calories_100g: Math.round(p.nutriments['energy-kcal_100g'] || 0),
        carbs_100g: +(p.nutriments['carbohydrates_100g'] || 0).toFixed(1),
        protein_100g: +(p.nutriments['proteins_100g'] || 0).toFixed(1),
        fat_100g: +(p.nutriments['fat_100g'] || 0).toFixed(1),
        sugar_100g: +(p.nutriments['sugars_100g'] || 0).toFixed(1),
        sodium_100g: Math.round((p.nutriments['sodium_100g'] || 0) * 1000),
        cholesterol_100g: Math.round((p.nutriments['cholesterol_100g'] || 0) * 1000),
      }))
    res.json(results)
  } catch (e) {
    res.status(500).json({ error: 'ไม่สามารถเชื่อมต่อ Open Food Facts ได้' })
  }
})

export default app