import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../plugins/axios'

export const useNutritionStore = defineStore('nutrition', () => {
  const foodLogs = ref([])
  const activities = ref([])
  const goals = ref(null)
  const foodItems = ref([])
  const selectedDate = ref(new Date().toISOString().split('T')[0])
  const loading = ref(false)

  const defaultGoals = {
    calories: 2000, carbs: 250, protein: 50, fat: 65,
    sugar: 50, sodium: 2300, cholesterol: 300
  }

  const currentGoals = computed(() => goals.value || defaultGoals)

  const mealTypes = [
    { value: 'breakfast', label: 'มื้อเช้า', icon: 'mdi-weather-sunny', color: 'orange' },
    { value: 'lunch', label: 'มื้อกลางวัน', icon: 'mdi-white-balance-sunny', color: 'green' },
    { value: 'dinner', label: 'มื้อเย็น', icon: 'mdi-weather-night', color: 'blue' },
    { value: 'snack', label: 'อาหารว่าง', icon: 'mdi-food-apple', color: 'amber' },
  ]

  // แยก custom items ออกจาก preset
  const customFoodItems = computed(() => foodItems.value.filter(f => f.custom))
  const presetFoodItems = computed(() => foodItems.value.filter(f => !f.custom))

  const todayLogs = computed(() => foodLogs.value.filter(l => l.date === selectedDate.value))
  const todayActivities = computed(() => activities.value.filter(a => a.date === selectedDate.value))

  const dailySummary = computed(() => {
    const sum = { calories: 0, carbs: 0, protein: 0, fat: 0, sugar: 0, sodium: 0, cholesterol: 0 }
    todayLogs.value.forEach(l => {
      sum.calories += l.calories; sum.carbs += l.carbs; sum.protein += l.protein
      sum.fat += l.fat; sum.sugar += l.sugar; sum.sodium += l.sodium; sum.cholesterol += l.cholesterol
    })
    return sum
  })

  const totalBurned = computed(() => todayActivities.value.reduce((s, a) => s + a.caloriesBurned, 0))
  const netCalories = computed(() => dailySummary.value.calories - totalBurned.value)

  const mealSummary = computed(() => {
    const result = {}
    mealTypes.forEach(m => {
      const logs = todayLogs.value.filter(l => l.meal === m.value)
      result[m.value] = {
        ...m, logs,
        calories: logs.reduce((s, l) => s + l.calories, 0),
        carbs: logs.reduce((s, l) => s + l.carbs, 0),
        protein: logs.reduce((s, l) => s + l.protein, 0),
        fat: logs.reduce((s, l) => s + l.fat, 0),
      }
    })
    return result
  })

  async function fetchAll() {
    loading.value = true
    try {
      const [logsRes, actRes, goalRes, foodRes] = await Promise.all([
        api.get(`/food-logs?date=${selectedDate.value}`),
        api.get(`/activities?date=${selectedDate.value}`),
        api.get('/goals'),
        api.get('/food-items')
      ])
      foodLogs.value = logsRes.data
      activities.value = actRes.data
      goals.value = goalRes.data
      foodItems.value = foodRes.data
    } finally {
      loading.value = false
    }
  }

  async function addFoodLog(entry) {
    const res = await api.post('/food-logs', { ...entry, date: selectedDate.value })
    foodLogs.value.push(res.data)
  }

  async function deleteFoodLog(id) {
    await api.delete(`/food-logs/${id}`)
    foodLogs.value = foodLogs.value.filter(l => l.id !== id)
  }

  async function addActivity(entry) {
    const res = await api.post('/activities', { ...entry, date: selectedDate.value })
    activities.value.push(res.data)
  }

  async function deleteActivity(id) {
    await api.delete(`/activities/${id}`)
    activities.value = activities.value.filter(a => a.id !== id)
  }

  async function saveGoals(data) {
    const res = await api.post('/goals', data)
    goals.value = res.data
  }

  async function searchFoodItems(q) {
    const res = await api.get(`/food-items?q=${encodeURIComponent(q)}`)
    return res.data
  }

  // ── Custom food items (คลังเมนูของฉัน) ──
  async function addCustomFoodItem(data) {
    const res = await api.post('/food-items', { ...data, custom: true })
    foodItems.value.push(res.data)
    return res.data
  }

  async function updateCustomFoodItem(id, data) {
    const res = await api.put(`/food-items/${id}`, data)
    const idx = foodItems.value.findIndex(f => f.id === id)
    if (idx !== -1) foodItems.value[idx] = res.data
    return res.data
  }

  async function deleteCustomFoodItem(id) {
    await api.delete(`/food-items/${id}`)
    foodItems.value = foodItems.value.filter(f => f.id !== id)
  }

  async function fetchSummary(startDate, endDate) {
    const [foodRes, actRes] = await Promise.all([
      api.get(`/food-logs/summary?startDate=${startDate}&endDate=${endDate}`),
      api.get(`/activities/summary?startDate=${startDate}&endDate=${endDate}`)
    ])
    return { foodSummary: foodRes.data, actSummary: actRes.data }
  }

  function setDate(date) {
    selectedDate.value = date
  }

  return {
    foodLogs, activities, goals, foodItems, selectedDate, loading,
    currentGoals, mealTypes, todayLogs, todayActivities,
    dailySummary, totalBurned, netCalories, mealSummary,
    customFoodItems, presetFoodItems,
    fetchAll, addFoodLog, deleteFoodLog, addActivity, deleteActivity,
    saveGoals, searchFoodItems, fetchSummary, setDate,
    addCustomFoodItem, updateCustomFoodItem, deleteCustomFoodItem
  }
})
