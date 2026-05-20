import mongoose from 'mongoose'
import 'dotenv/config'

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('❌ กรุณาตั้งค่า MONGODB_URI ในไฟล์ backend/.env')
  process.exit(1)
}

export async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('✅ MongoDB Atlas connected')
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message)
    process.exit(1)
  }
}

// ── Schemas ──
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  createdAt: { type: Date, default: Date.now }
})

const goalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  calories: Number, carbs: Number, protein: Number,
  fat: Number, sugar: Number, sodium: Number, cholesterol: Number,
  updatedAt: { type: Date, default: Date.now }
})

const foodLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: String, meal: String, foodItemId: String, foodName: String,
  quantity: Number, calories: Number, carbs: Number, protein: Number,
  fat: Number, sugar: Number, sodium: Number, cholesterol: Number,
  createdAt: { type: Date, default: Date.now }
})

const activitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: String, name: String, type: String,
  duration: Number, caloriesBurned: Number,
  intensity: String, notes: String,
  createdAt: { type: Date, default: Date.now }
})

const foodItemSchema = new mongoose.Schema({
  name: String,
  calories: Number, carbs: Number, protein: Number,
  fat: Number, sugar: Number, sodium: Number, cholesterol: Number,
  servingSize: Number, unit: String,
  custom: { type: Boolean, default: false },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdAt: { type: Date, default: Date.now }
})

export const User     = mongoose.model('User', userSchema)
export const Goal     = mongoose.model('Goal', goalSchema)
export const FoodLog  = mongoose.model('FoodLog', foodLogSchema)
export const Activity = mongoose.model('Activity', activitySchema)
export const FoodItem = mongoose.model('FoodItem', foodItemSchema)

// ── Seed preset food items ──
export async function seedFoodItems() {
  const count = await FoodItem.countDocuments({ custom: false })
  if (count > 0) return
  await FoodItem.insertMany([
    { name: 'ข้าวสวย',          calories: 130, carbs: 28,  protein: 2.7, fat: 0.3, sugar: 0,  sodium: 1,    cholesterol: 0,   servingSize: 100, unit: 'g' },
    { name: 'ไข่ต้ม',           calories: 78,  carbs: 0.6, protein: 6.3, fat: 5.3, sugar: 0.6, sodium: 62,  cholesterol: 186, servingSize: 50,  unit: 'g' },
    { name: 'ไก่ย่าง',          calories: 165, carbs: 0,   protein: 31,  fat: 3.6, sugar: 0,  sodium: 74,   cholesterol: 85,  servingSize: 100, unit: 'g' },
    { name: 'ผัดกะเพรา',        calories: 280, carbs: 15,  protein: 22,  fat: 14,  sugar: 3,  sodium: 890,  cholesterol: 65,  servingSize: 200, unit: 'g' },
    { name: 'ต้มยำกุ้ง',        calories: 95,  carbs: 4,   protein: 12,  fat: 4,   sugar: 2,  sodium: 1200, cholesterol: 95,  servingSize: 250, unit: 'ml' },
    { name: 'ส้มตำ',            calories: 100, carbs: 18,  protein: 4,   fat: 2,   sugar: 8,  sodium: 650,  cholesterol: 0,   servingSize: 150, unit: 'g' },
    { name: 'นมวัวไขมันต่ำ',    calories: 102, carbs: 12,  protein: 8,   fat: 2.5, sugar: 12, sodium: 107,  cholesterol: 12,  servingSize: 240, unit: 'ml' },
    { name: 'กล้วยหอม',         calories: 89,  carbs: 23,  protein: 1.1, fat: 0.3, sugar: 12, sodium: 1,    cholesterol: 0,   servingSize: 100, unit: 'g' },
    { name: 'ข้าวโอ๊ต',         calories: 389, carbs: 66,  protein: 17,  fat: 7,   sugar: 1,  sodium: 2,    cholesterol: 0,   servingSize: 100, unit: 'g' },
    { name: 'ปลาทูนึ่ง',        calories: 144, carbs: 0,   protein: 23,  fat: 6,   sugar: 0,  sodium: 80,   cholesterol: 63,  servingSize: 100, unit: 'g' },
    { name: 'ข้าวมันไก่',       calories: 350, carbs: 45,  protein: 25,  fat: 8,   sugar: 1,  sodium: 650,  cholesterol: 70,  servingSize: 300, unit: 'g' },
    { name: 'ก๋วยเตี๋ยวหมู',    calories: 320, carbs: 50,  protein: 18,  fat: 6,   sugar: 2,  sodium: 980,  cholesterol: 45,  servingSize: 400, unit: 'ml' },
    { name: 'แกงเขียวหวาน',     calories: 210, carbs: 8,   protein: 18,  fat: 13,  sugar: 3,  sodium: 720,  cholesterol: 60,  servingSize: 250, unit: 'g' },
    { name: 'ผัดไทย',           calories: 400, carbs: 55,  protein: 18,  fat: 12,  sugar: 5,  sodium: 820,  cholesterol: 65,  servingSize: 250, unit: 'g' },
    { name: 'ข้าวเหนียวมะม่วง', calories: 430, carbs: 85,  protein: 5,   fat: 9,   sugar: 30, sodium: 120,  cholesterol: 0,   servingSize: 250, unit: 'g' },
  ])
  console.log('🌱 Seeded preset food items')
}
