<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6 flex-wrap gap-3">
      <div>
        <h1 class="font-heading text-h5 font-weight-bold">บันทึกอาหาร</h1>
        <p class="text-medium-emphasis text-body-2">บันทึกอาหารในแต่ละมื้อ</p>
      </div>
      <v-text-field
        v-model="selectedDate" type="date"
        density="compact" hide-details style="max-width: 180px"
        prepend-inner-icon="mdi-calendar"
        @update:model-value="store.fetchAll()"
      />
    </div>

    <!-- Daily Summary Bar -->
    <v-card class="mb-5 pa-4" color="primary" theme="dark">
      <v-row align="center">
        <v-col v-for="s in summaryStats" :key="s.label" cols="6" sm="3" class="text-center">
          <div class="text-h6 font-weight-bold">{{ s.value }}</div>
          <div class="text-caption opacity-80">{{ s.label }}</div>
        </v-col>
      </v-row>
    </v-card>

    <!-- Meal Sections -->
    <div v-for="meal in mealTypes" :key="meal.value" class="mb-5">
      <v-card :class="`meal-card meal-${meal.value}`">
        <v-card-title class="d-flex align-center justify-space-between py-3 px-5">
          <div class="d-flex align-center gap-2">
            <v-icon :color="meal.color">{{ meal.icon }}</v-icon>
            <span class="font-heading text-subtitle-1 font-weight-bold">{{ meal.label }}</span>
            <v-chip size="small" :color="meal.color" variant="tonal">
              {{ mealSummary[meal.value]?.calories || 0 }} kcal
            </v-chip>
          </div>
          <v-btn size="small" :color="meal.color" variant="tonal" @click="openAddDialog(meal.value)">
            <v-icon start>mdi-plus</v-icon> เพิ่มอาหาร
          </v-btn>
        </v-card-title>

        <v-divider />

        <v-data-table
          v-if="mealLogs(meal.value).length > 0"
          :items="mealLogs(meal.value)"
          :headers="tableHeaders"
          density="compact"
          hide-default-footer
          class="data-table"
        >
          <template #item.foodName="{ item }">
            <span class="font-weight-medium">{{ item.foodName }}</span>
          </template>
          <template #item.quantity="{ item }">{{ item.quantity }}g</template>
          <template #item.calories="{ item }">
            <span class="text-primary font-weight-bold">{{ item.calories }}</span>
          </template>
          <template #item.carbs="{ item }">{{ item.carbs?.toFixed(1) }}</template>
          <template #item.protein="{ item }">{{ item.protein?.toFixed(1) }}</template>
          <template #item.fat="{ item }">{{ item.fat?.toFixed(1) }}</template>
          <template #item.sugar="{ item }">{{ item.sugar?.toFixed(1) }}</template>
          <template #item.sodium="{ item }">{{ item.sodium?.toFixed(0) }}</template>
          <template #item.cholesterol="{ item }">{{ item.cholesterol?.toFixed(0) }}</template>
          <template #item.actions="{ item }">
            <v-btn icon size="x-small" color="error" variant="text" @click="deleteLog(item.id)">
              <v-icon>mdi-delete-outline</v-icon>
            </v-btn>
          </template>
          <template #bottom />
        </v-data-table>

        <div v-else class="pa-6 text-center text-medium-emphasis">
          <v-icon size="36" color="grey-lighten-2">mdi-food-outline</v-icon>
          <p class="text-body-2 mt-2">ยังไม่มีรายการอาหาร — คลิก "เพิ่มอาหาร" เพื่อบันทึก</p>
        </div>

        <div v-if="mealLogs(meal.value).length > 0" class="px-5 py-3 meal-total d-flex gap-4 flex-wrap">
          <span class="text-caption text-medium-emphasis font-weight-bold">รวม:</span>
          <span class="text-caption">🔥 {{ mealSummary[meal.value]?.calories }} kcal</span>
          <span class="text-caption">🌾 คาร์บ {{ mealSummary[meal.value]?.carbs?.toFixed(1) }}g</span>
          <span class="text-caption">💪 โปรตีน {{ mealSummary[meal.value]?.protein?.toFixed(1) }}g</span>
          <span class="text-caption">🧈 ไขมัน {{ mealSummary[meal.value]?.fat?.toFixed(1) }}g</span>
        </div>
      </v-card>
    </div>

    <!-- ── Add Food Dialog ── -->
    <v-dialog v-model="dialog" max-width="640">
      <v-card>
        <v-card-title class="font-heading pa-5 pb-2">
          <v-icon color="primary" class="mr-2">mdi-food-plus-outline</v-icon>
          เพิ่มอาหาร — {{ activeMealLabel }}
        </v-card-title>

        <!-- แท็บเลือกแหล่งอาหาร -->
        <v-tabs v-model="activeTab" color="primary" class="px-5">
          <v-tab value="local">
            <v-icon start size="18">mdi-database-outline</v-icon>
            เมนูมาตรฐาน
          </v-tab>
          <v-tab value="world">
            <v-icon start size="18">mdi-earth</v-icon>
            Menu of the World
          </v-tab>
          <v-tab value="manual">
            <v-icon start size="18">mdi-pencil-outline</v-icon>
            กรอกเอง
          </v-tab>
        </v-tabs>

        <v-divider />

        <v-card-text class="pa-5 pt-4" style="min-height: 320px">

          <!-- ── แท็บ 1: เมนูมาตรฐาน ── -->
          <div v-if="activeTab === 'local'">
            <v-autocomplete
              v-model="selectedFood"
              :items="foodItems"
              item-title="name"
              item-value="id"
              return-object
              label="ค้นหาจากคลังเมนู"
              prepend-inner-icon="mdi-magnify"
              clearable
              class="mb-4"
              @update:search="searchFood"
              @update:model-value="fillFromFood"
            >
              <template #item="{ item, props }">
                <v-list-item v-bind="props">
                  <template #append>
                    <v-chip v-if="item.raw.custom" size="x-small" color="primary" variant="tonal">ของฉัน ⭐</v-chip>
                  </template>
                </v-list-item>
              </template>
            </v-autocomplete>

            <div v-if="selectedFood" class="selected-food-preview pa-4 rounded-xl mb-4">
              <div class="d-flex align-center gap-2 mb-3">
                <v-icon color="primary">mdi-food</v-icon>
                <span class="font-weight-bold">{{ selectedFood.name }}</span>
                <v-chip v-if="selectedFood.custom" size="x-small" color="primary" variant="tonal">ของฉัน ⭐</v-chip>
              </div>
              <v-row dense>
                <v-col cols="6" sm="3" v-for="n in nutrientPreview" :key="n.label">
                  <div class="text-center pa-2 rounded-lg nutrient-chip">
                    <div class="text-body-2 font-weight-bold" :style="{color: n.color}">{{ n.value }}</div>
                    <div class="text-caption text-medium-emphasis">{{ n.label }}</div>
                  </div>
                </v-col>
              </v-row>
              <v-row class="mt-3" align="center">
                <v-col cols="6">
                  <v-text-field
                    v-model.number="form.quantity"
                    label="ปริมาณที่กิน"
                    :suffix="selectedFood.unit || 'g'"
                    type="number" density="compact" hide-details
                    @update:model-value="recalcFromQuantity"
                  />
                </v-col>
                <v-col cols="6" class="text-center">
                  <div class="text-h6 font-weight-bold text-primary">{{ form.calories }} kcal</div>
                  <div class="text-caption text-medium-emphasis">พลังงานที่ได้รับ</div>
                </v-col>
              </v-row>
            </div>

            <div v-else class="text-center py-6 text-medium-emphasis">
              <v-icon size="48" color="grey-lighten-2">mdi-food-outline</v-icon>
              <p class="text-body-2 mt-2">พิมพ์ชื่ออาหารเพื่อค้นหา</p>
            </div>
          </div>

          <!-- ── แท็บ 2: Menu of the World ── -->
          <div v-if="activeTab === 'world'">
            <div class="d-flex gap-2 mb-4">
              <v-text-field
                v-model="worldSearch"
                label="ค้นหาอาหารทั่วโลก (ภาษาอังกฤษ)"
                prepend-inner-icon="mdi-earth"
                hide-details clearable
                @keyup.enter="searchWorldFood"
              />
              <v-btn color="primary" :loading="worldLoading" @click="searchWorldFood" height="56">
                <v-icon>mdi-magnify</v-icon>
              </v-btn>
            </div>

            <!-- ผลลัพธ์ -->
            <div v-if="worldLoading" class="text-center py-6">
              <v-progress-circular indeterminate color="primary" />
              <p class="text-body-2 mt-3 text-medium-emphasis">กำลังค้นหา...</p>
            </div>

            <div v-else-if="worldError" class="text-center py-4">
              <v-icon color="error" size="40">mdi-wifi-off</v-icon>
              <p class="text-body-2 mt-2 text-error">{{ worldError }}</p>
            </div>

            <div v-else-if="worldResults.length === 0 && worldSearched" class="text-center py-6 text-medium-emphasis">
              <v-icon size="48" color="grey-lighten-2">mdi-food-off-outline</v-icon>
              <p class="text-body-2 mt-2">ไม่พบผลลัพธ์ ลองใช้ภาษาอังกฤษครับ</p>
            </div>

            <div v-else-if="!worldSearched" class="text-center py-6 text-medium-emphasis">
              <v-icon size="48" color="grey-lighten-2">mdi-earth</v-icon>
              <p class="text-body-2 mt-2">ค้นหาอาหารจากฐานข้อมูลทั่วโลก</p>
              <p class="text-caption">เช่น rice, chicken breast, banana, pizza</p>
            </div>

            <v-list v-else lines="two" class="world-results rounded-xl" style="max-height: 300px; overflow-y: auto">
              <v-list-item
                v-for="item in worldResults"
                :key="item.code"
                :title="item.product_name || item.product_name_en || 'ไม่ระบุชื่อ'"
                :subtitle="item.brands || item.categories_tags?.[0] || ''"
                class="mb-1 rounded-lg"
                @click="selectWorldFood(item)"
                style="cursor: pointer"
              >
                <template #prepend>
                  <v-avatar size="40" rounded="lg" color="green-lighten-5">
                    <v-img v-if="item.image_small_url" :src="item.image_small_url" />
                    <v-icon v-else color="primary">mdi-food</v-icon>
                  </v-avatar>
                </template>
                <template #append>
                  <div class="text-right">
                    <div class="text-body-2 font-weight-bold text-primary">
                      {{ item.nutriments?.['energy-kcal_100g'] ? Math.round(item.nutriments['energy-kcal_100g']) + ' kcal' : '-' }}
                    </div>
                    <div class="text-caption text-medium-emphasis">ต่อ 100g</div>
                  </div>
                </template>
              </v-list-item>
            </v-list>

            <!-- แสดงรายละเอียดที่เลือก -->
            <div v-if="selectedWorldFood" class="mt-4 selected-food-preview pa-4 rounded-xl">
              <div class="d-flex align-center gap-2 mb-3">
                <v-icon color="primary">mdi-earth</v-icon>
                <span class="font-weight-bold">{{ selectedWorldFood.product_name || 'ไม่ระบุชื่อ' }}</span>
              </div>
              <v-row dense>
                <v-col cols="6" sm="3" v-for="n in worldNutrientPreview" :key="n.label">
                  <div class="text-center pa-2 rounded-lg nutrient-chip">
                    <div class="text-body-2 font-weight-bold" :style="{color: n.color}">{{ n.value }}</div>
                    <div class="text-caption text-medium-emphasis">{{ n.label }}</div>
                  </div>
                </v-col>
              </v-row>
              <v-row class="mt-3" align="center">
                <v-col cols="6">
                  <v-text-field
                    v-model.number="form.quantity"
                    label="ปริมาณที่กิน"
                    suffix="g"
                    type="number" density="compact" hide-details
                    @update:model-value="recalcFromWorldFood"
                  />
                </v-col>
                <v-col cols="6" class="text-center">
                  <div class="text-h6 font-weight-bold text-primary">{{ form.calories }} kcal</div>
                  <div class="text-caption text-medium-emphasis">พลังงานที่ได้รับ</div>
                </v-col>
              </v-row>
            </div>
          </div>

          <!-- ── แท็บ 3: กรอกเอง ── -->
          <div v-if="activeTab === 'manual'">
            <v-row>
              <v-col cols="12" sm="8">
                <v-text-field v-model="form.foodName" label="ชื่ออาหาร *" prepend-inner-icon="mdi-food" />
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field v-model.number="form.quantity" label="ปริมาณ (g/ml)" type="number" />
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="6" sm="3">
                <v-text-field v-model.number="form.calories" label="พลังงาน" suffix="kcal" type="number" />
              </v-col>
              <v-col cols="6" sm="3">
                <v-text-field v-model.number="form.carbs" label="คาร์บ" suffix="g" type="number" />
              </v-col>
              <v-col cols="6" sm="3">
                <v-text-field v-model.number="form.protein" label="โปรตีน" suffix="g" type="number" />
              </v-col>
              <v-col cols="6" sm="3">
                <v-text-field v-model.number="form.fat" label="ไขมัน" suffix="g" type="number" />
              </v-col>
              <v-col cols="6" sm="4">
                <v-text-field v-model.number="form.sugar" label="น้ำตาล" suffix="g" type="number" />
              </v-col>
              <v-col cols="6" sm="4">
                <v-text-field v-model.number="form.sodium" label="โซเดียม" suffix="mg" type="number" />
              </v-col>
              <v-col cols="6" sm="4">
                <v-text-field v-model.number="form.cholesterol" label="คอเลสเตอรอล" suffix="mg" type="number" />
              </v-col>
            </v-row>
            <v-checkbox
              v-model="saveToLibrary"
              label="บันทึกเมนูนี้ลงคลัง เพื่อใช้ซ้ำในครั้งถัดไป ⭐"
              color="primary" hide-details class="mt-1"
            />
          </div>

        </v-card-text>

        <v-card-actions class="pa-5 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">ยกเลิก</v-btn>
          <v-btn color="primary" :loading="saving" @click="saveFood" :disabled="!canSave">
            <v-icon start>mdi-content-save</v-icon> บันทึก
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useNutritionStore } from '../stores/nutrition'

const store = useNutritionStore()
const selectedDate = computed({ get: () => store.selectedDate, set: v => store.setDate(v) })
const mealSummary = computed(() => store.mealSummary)
const mealTypes = computed(() => store.mealTypes)

const dialog = ref(false)
const activeTab = ref('local')
const activeMeal = ref('breakfast')
const activeMealLabel = computed(() => store.mealTypes.find(m => m.value === activeMeal.value)?.label || '')
const saving = ref(false)
const saveToLibrary = ref(false)
const selectedFood = ref(null)
const foodItems = ref([])

// ── World Food (Open Food Facts) ──
const worldSearch = ref('')
const worldLoading = ref(false)
const worldResults = ref([])
const worldSearched = ref(false)
const worldError = ref('')
const selectedWorldFood = ref(null)

const emptyForm = () => ({ foodName: '', quantity: 100, calories: 0, carbs: 0, protein: 0, fat: 0, sugar: 0, sodium: 0, cholesterol: 0 })
const form = ref(emptyForm())

const summaryStats = computed(() => {
  const s = store.dailySummary
  return [
    { label: 'พลังงานรวม', value: `${s.calories.toLocaleString()} kcal` },
    { label: 'คาร์โบไฮเดรต', value: `${s.carbs.toFixed(1)}g` },
    { label: 'โปรตีน', value: `${s.protein.toFixed(1)}g` },
    { label: 'ไขมัน', value: `${s.fat.toFixed(1)}g` },
  ]
})

const tableHeaders = [
  { title: 'ชื่ออาหาร', key: 'foodName', sortable: false },
  { title: 'ปริมาณ', key: 'quantity', sortable: false },
  { title: 'kcal', key: 'calories', sortable: false },
  { title: 'คาร์บ (g)', key: 'carbs', sortable: false },
  { title: 'โปรตีน (g)', key: 'protein', sortable: false },
  { title: 'ไขมัน (g)', key: 'fat', sortable: false },
  { title: 'น้ำตาล (g)', key: 'sugar', sortable: false },
  { title: 'โซเดียม (mg)', key: 'sodium', sortable: false },
  { title: 'คอเลสเตอรอล (mg)', key: 'cholesterol', sortable: false },
  { title: '', key: 'actions', sortable: false, width: 50 },
]

function mealLogs(meal) {
  return store.todayLogs.filter(l => l.meal === meal)
}

function openAddDialog(meal) {
  activeMeal.value = meal
  form.value = emptyForm()
  selectedFood.value = null
  selectedWorldFood.value = null
  worldResults.value = []
  worldSearched.value = false
  worldError.value = ''
  worldSearch.value = ''
  saveToLibrary.value = false
  activeTab.value = 'local'
  foodItems.value = store.foodItems
  dialog.value = true
}

// ── Local food search ──
async function searchFood(q) {
  if (q?.length > 1) foodItems.value = await store.searchFoodItems(q)
}

function fillFromFood(food) {
  if (!food) { form.value = emptyForm(); return }
  const ratio = form.value.quantity / (food.servingSize || 100)
  form.value = {
    foodName: food.name,
    quantity: food.servingSize || 100,
    calories: Math.round(food.calories * ratio),
    carbs: +(food.carbs * ratio).toFixed(1),
    protein: +(food.protein * ratio).toFixed(1),
    fat: +(food.fat * ratio).toFixed(1),
    sugar: +(food.sugar * ratio).toFixed(1),
    sodium: Math.round(food.sodium * ratio),
    cholesterol: Math.round(food.cholesterol * ratio),
  }
}

function recalcFromQuantity(qty) {
  if (!selectedFood.value) return
  const base = selectedFood.value.servingSize || 100
  const ratio = qty / base
  const f = selectedFood.value
  form.value.calories = Math.round(f.calories * ratio)
  form.value.carbs = +(f.carbs * ratio).toFixed(1)
  form.value.protein = +(f.protein * ratio).toFixed(1)
  form.value.fat = +(f.fat * ratio).toFixed(1)
  form.value.sugar = +(f.sugar * ratio).toFixed(1)
  form.value.sodium = Math.round(f.sodium * ratio)
  form.value.cholesterol = Math.round(f.cholesterol * ratio)
}

const nutrientPreview = computed(() => {
  if (!selectedFood.value) return []
  return [
    { label: 'kcal/100g', value: selectedFood.value.calories, color: '#2D6A4F' },
    { label: 'คาร์บ', value: `${selectedFood.value.carbs}g`, color: '#F4A261' },
    { label: 'โปรตีน', value: `${selectedFood.value.protein}g`, color: '#457B9D' },
    { label: 'ไขมัน', value: `${selectedFood.value.fat}g`, color: '#E76F51' },
  ]
})

// ── Open Food Facts ──
async function searchWorldFood() {
  if (!worldSearch.value.trim()) return
  worldLoading.value = true
  worldError.value = ''
  worldSearched.value = true
  selectedWorldFood.value = null
  try {
    const q = encodeURIComponent(worldSearch.value.trim())
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${q}&search_simple=1&action=process&json=1&page_size=20&fields=code,product_name,product_name_en,brands,image_small_url,nutriments,categories_tags`
    const res = await fetch(url)
    const data = await res.json()
    // กรองเฉพาะที่มีข้อมูล kcal
    worldResults.value = (data.products || []).filter(p =>
      p.product_name && p.nutriments?.['energy-kcal_100g']
    ).slice(0, 15)
  } catch (e) {
    worldError.value = 'ไม่สามารถเชื่อมต่อ Open Food Facts ได้ กรุณาลองใหม่อีกครั้ง'
  } finally {
    worldLoading.value = false
  }
}

function selectWorldFood(item) {
  selectedWorldFood.value = item
  const n = item.nutriments || {}
  form.value = {
    foodName: item.product_name || item.product_name_en || 'Unknown',
    quantity: 100,
    calories: Math.round(n['energy-kcal_100g'] || 0),
    carbs: +(n['carbohydrates_100g'] || 0).toFixed(1),
    protein: +(n['proteins_100g'] || 0).toFixed(1),
    fat: +(n['fat_100g'] || 0).toFixed(1),
    sugar: +(n['sugars_100g'] || 0).toFixed(1),
    sodium: Math.round((n['sodium_100g'] || 0) * 1000),
    cholesterol: Math.round((n['cholesterol_100g'] || 0) * 1000),
  }
}

function recalcFromWorldFood(qty) {
  if (!selectedWorldFood.value) return
  const n = selectedWorldFood.value.nutriments || {}
  const ratio = qty / 100
  form.value.calories = Math.round((n['energy-kcal_100g'] || 0) * ratio)
  form.value.carbs = +((n['carbohydrates_100g'] || 0) * ratio).toFixed(1)
  form.value.protein = +((n['proteins_100g'] || 0) * ratio).toFixed(1)
  form.value.fat = +((n['fat_100g'] || 0) * ratio).toFixed(1)
  form.value.sugar = +((n['sugars_100g'] || 0) * ratio).toFixed(1)
  form.value.sodium = Math.round((n['sodium_100g'] || 0) * ratio * 1000)
  form.value.cholesterol = Math.round((n['cholesterol_100g'] || 0) * ratio * 1000)
}

const worldNutrientPreview = computed(() => {
  if (!selectedWorldFood.value) return []
  const n = selectedWorldFood.value.nutriments || {}
  return [
    { label: 'kcal/100g', value: Math.round(n['energy-kcal_100g'] || 0), color: '#2D6A4F' },
    { label: 'คาร์บ', value: `${(n['carbohydrates_100g'] || 0).toFixed(1)}g`, color: '#F4A261' },
    { label: 'โปรตีน', value: `${(n['proteins_100g'] || 0).toFixed(1)}g`, color: '#457B9D' },
    { label: 'ไขมัน', value: `${(n['fat_100g'] || 0).toFixed(1)}g`, color: '#E76F51' },
  ]
})

// ── canSave ──
const canSave = computed(() => {
  if (activeTab.value === 'local') return !!selectedFood.value
  if (activeTab.value === 'world') return !!selectedWorldFood.value
  if (activeTab.value === 'manual') return !!form.value.foodName
  return false
})

// ── Save ──
async function saveFood() {
  saving.value = true
  try {
    if (saveToLibrary.value && activeTab.value === 'manual') {
      await store.addCustomFoodItem({
        name: form.value.foodName,
        calories: form.value.calories,
        carbs: form.value.carbs,
        protein: form.value.protein,
        fat: form.value.fat,
        sugar: form.value.sugar,
        sodium: form.value.sodium,
        cholesterol: form.value.cholesterol,
        servingSize: form.value.quantity,
        unit: 'g',
      })
    }
    await store.addFoodLog({ ...form.value, meal: activeMeal.value })
    dialog.value = false
  } finally {
    saving.value = false
  }
}

async function deleteLog(id) {
  await store.deleteFoodLog(id)
}
</script>

<style scoped>
.meal-total { background: rgba(0,0,0,0.025); border-top: 1px solid rgba(0,0,0,0.06); }
.selected-food-preview { background: rgba(45,106,79,0.06); border: 1px solid rgba(45,106,79,0.15); }
.nutrient-chip { background: rgba(0,0,0,0.04); }
.world-results { border: 1px solid rgba(0,0,0,0.08); }
</style>