<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6 flex-wrap gap-3">
      <div>
        <h1 class="font-heading text-h5 font-weight-bold">บันทึกอาหาร</h1>
        <p class="text-medium-emphasis text-body-2">บันทึกอาหารในแต่ละมื้อ</p>
      </div>
      <v-text-field v-model="selectedDate" type="date" density="compact" hide-details style="max-width: 180px"
        prepend-inner-icon="mdi-calendar" @update:model-value="store.fetchAll()" />
    </div>

    <!-- Meal Picker Dialog -->
    <v-dialog v-model="mealPickerDialog" max-width="360">
      <v-card>
        <v-card-title class="font-heading pa-5 pb-3">
          <v-icon color="primary" class="mr-2">mdi-food-plus-outline</v-icon>
          เลือกมื้ออาหาร
        </v-card-title>
        <v-card-text class="pa-5 pt-0">
          <v-row>
            <v-col cols="6" v-for="meal in mealTypes" :key="meal.value">
              <v-btn block height="80" variant="tonal" :color="meal.color" @click="selectMealAndOpen(meal.value)"
                class="meal-pick-btn">
                <div class="text-center">
                  <v-icon size="28" class="mb-1">{{ meal.icon }}</v-icon>
                  <div class="text-body-2 font-weight-medium">{{ meal.label }}</div>
                </div>
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="pa-5 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="mealPickerDialog = false">ยกเลิก</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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

        <v-data-table v-if="mealLogs(meal.value).length > 0" :items="mealLogs(meal.value)" :headers="tableHeaders"
          density="compact" hide-default-footer class="data-table">
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
            <div class="d-flex gap-1">
              <v-btn icon size="x-small" color="primary" variant="text" @click="openEditDialog(item)">
                <v-icon size="16">mdi-pencil-outline</v-icon>
              </v-btn>
              <v-btn icon size="x-small" color="error" variant="text" @click="openConfirmDeleteLog(item)">
                <v-icon size="16">mdi-delete-outline</v-icon>
              </v-btn>
            </div>
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
    <v-dialog v-model="dialog" max-width="660" persistent>
      <v-card>
        <v-card-title class="font-heading pa-5 pb-2">
          <v-icon color="primary" class="mr-2">mdi-food-plus-outline</v-icon>
          เพิ่มอาหาร — {{ activeMealLabel }}
        </v-card-title>

        <v-tabs v-model="activeTab" color="primary" class="px-5">
          <v-tab value="local">
            <v-icon start size="18">mdi-database-outline</v-icon> เมนูมาตรฐาน
          </v-tab>
          <v-tab value="world">
            <v-icon start size="18">mdi-earth</v-icon> Menu of the World
          </v-tab>
          <v-tab value="manual">
            <v-icon start size="18">mdi-pencil-outline</v-icon> กรอกเอง
          </v-tab>
        </v-tabs>
        <v-divider />

        <v-card-text class="pa-5 pt-4" style="min-height: 380px">

          <!-- แท็บ 1: เมนูมาตรฐาน -->
          <div v-if="activeTab === 'local'">
            <v-text-field v-model="localSearch" label="ค้นหาจากคลังเมนู" prepend-inner-icon="mdi-magnify" clearable
              hide-details class="mb-3" />
            <v-list lines="two" class="food-list rounded-xl" style="max-height: 260px; overflow-y: auto">
              <v-list-item v-for="item in filteredLocalItems" :key="item.id"
                :class="['mb-1 rounded-lg food-item-row', selectedFood?.id === item.id ? 'selected-row' : '']"
                @click="selectLocalFood(item)" style="cursor: pointer">
                <template #prepend>
                  <v-avatar size="36" rounded="lg" :color="item.custom ? 'primary' : 'green'" variant="tonal">
                    <v-icon size="18" :color="item.custom ? 'primary' : 'green'">
                      {{ item.custom ? 'mdi-star' : 'mdi-food' }}
                    </v-icon>
                  </v-avatar>
                </template>
                <template #title>
                  <span class="text-body-2 font-weight-medium">{{ item.name }}</span>
                  <v-chip v-if="item.custom" size="x-small" color="primary" variant="tonal" class="ml-2">ของฉัน
                    ⭐</v-chip>
                </template>
                <template #subtitle>
                  <span class="text-caption">{{ item.calories }} kcal / {{ item.servingSize }}{{ item.unit }}</span>
                </template>
                <template #append>
                  <v-icon v-if="selectedFood?.id === item.id" color="primary">mdi-check-circle</v-icon>
                </template>
              </v-list-item>
              <div v-if="filteredLocalItems.length === 0" class="text-center py-6 text-medium-emphasis">
                <v-icon size="36" color="grey-lighten-2">mdi-food-off-outline</v-icon>
                <p class="text-body-2 mt-2">ไม่พบเมนูที่ค้นหา</p>
              </div>
            </v-list>
            <div v-if="selectedFood" class="mt-3 selected-food-preview pa-4 rounded-xl">
              <div class="d-flex align-center gap-2 mb-2">
                <v-icon color="primary" size="18">mdi-food</v-icon>
                <span class="font-weight-bold text-body-2">{{ selectedFood.name }}</span>
              </div>
              <v-row dense align="center">
                <v-col cols="6">
                  <v-text-field v-model.number="form.quantity" label="ปริมาณที่กิน" :suffix="selectedFood.unit || 'g'"
                    type="number" density="compact" hide-details @update:model-value="recalcFromQuantity" />
                </v-col>
                <v-col cols="6" class="text-center">
                  <div class="text-h6 font-weight-bold text-primary">{{ form.calories }} kcal</div>
                  <div class="text-caption text-medium-emphasis">คาร์บ {{ form.carbs }}g · โปรตีน {{ form.protein }}g ·
                    ไขมัน {{ form.fat }}g</div>
                </v-col>
              </v-row>
            </div>
          </div>

          <!-- แท็บ 2: Menu of the World -->
          <div v-if="activeTab === 'world'">
            <div class="d-flex gap-2 mb-3">
              <v-text-field v-model="worldSearch" label="ค้นหาอาหารทั่วโลก (ภาษาอังกฤษ)" prepend-inner-icon="mdi-earth"
                hide-details clearable @keyup.enter="searchWorldFood" />
              <v-btn color="primary" :loading="worldLoading" @click="searchWorldFood" height="56">
                <v-icon>mdi-magnify</v-icon>
              </v-btn>
            </div>
            <div v-if="worldLoading" class="text-center py-8">
              <v-progress-circular indeterminate color="primary" />
              <p class="text-body-2 mt-3 text-medium-emphasis">กำลังค้นหา...</p>
            </div>
            <div v-else-if="worldError" class="text-center py-6">
              <v-icon color="error" size="40">mdi-wifi-off</v-icon>
              <p class="text-body-2 mt-2 text-error">{{ worldError }}</p>
            </div>
            <div v-else-if="!worldSearched" class="text-center py-6 text-medium-emphasis">
              <v-icon size="48" color="grey-lighten-2">mdi-earth</v-icon>
              <p class="text-body-2 mt-2">ค้นหาอาหารจากฐานข้อมูลทั่วโลก</p>
              <p class="text-caption">เช่น rice, chicken breast, banana, pizza</p>
            </div>
            <div v-else-if="worldResults.length === 0" class="text-center py-6 text-medium-emphasis">
              <v-icon size="48" color="grey-lighten-2">mdi-food-off-outline</v-icon>
              <p class="text-body-2 mt-2">ไม่พบผลลัพธ์ ลองใช้ภาษาอังกฤษครับ</p>
            </div>
            <v-list v-else lines="two" class="food-list rounded-xl" style="max-height: 220px; overflow-y: auto">
              <v-list-item v-for="item in worldResults" :key="item.code"
                :class="['mb-1 rounded-lg food-item-row', selectedWorldFood?.code === item.code ? 'selected-row' : '']"
                @click="selectWorldFood(item)" style="cursor: pointer">
                <template #prepend>
                  <v-avatar size="40" rounded="lg" color="blue-lighten-5">
                    <v-img v-if="item.image_small_url" :src="item.image_small_url" />
                    <v-icon v-else color="blue">mdi-food</v-icon>
                  </v-avatar>
                </template>
                <template #title>
                  <span class="text-body-2 font-weight-medium">{{ item.product_name }}</span>
                </template>
                <template #subtitle>
                  <span class="text-caption text-medium-emphasis">{{ item.brands }}</span>
                </template>
                <template #append>
                  <div class="text-right">
                    <div class="text-body-2 font-weight-bold text-primary">{{ item.calories_100g }} kcal</div>
                    <div class="text-caption text-medium-emphasis">ต่อ 100g</div>
                  </div>
                </template>
              </v-list-item>
            </v-list>
            <div v-if="selectedWorldFood" class="mt-3 selected-food-preview pa-4 rounded-xl">
              <div class="d-flex align-center gap-2 mb-2">
                <v-icon color="primary" size="18">mdi-earth</v-icon>
                <span class="font-weight-bold text-body-2">{{ selectedWorldFood.product_name }}</span>
              </div>
              <v-row dense align="center">
                <v-col cols="6">
                  <v-text-field v-model.number="form.quantity" label="ปริมาณที่กิน" suffix="g" type="number"
                    density="compact" hide-details @update:model-value="recalcFromWorldFood" />
                </v-col>
                <v-col cols="6" class="text-center">
                  <div class="text-h6 font-weight-bold text-primary">{{ form.calories }} kcal</div>
                  <div class="text-caption text-medium-emphasis">คาร์บ {{ form.carbs }}g · โปรตีน {{ form.protein }}g ·
                    ไขมัน {{ form.fat }}g</div>
                </v-col>
              </v-row>
            </div>
          </div>

          <!-- แท็บ 3: กรอกเอง -->
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
              <v-col cols="6" sm="3"><v-text-field v-model.number="form.calories" label="พลังงาน" suffix="kcal"
                  type="number" /></v-col>
              <v-col cols="6" sm="3"><v-text-field v-model.number="form.carbs" label="คาร์บ" suffix="g"
                  type="number" /></v-col>
              <v-col cols="6" sm="3"><v-text-field v-model.number="form.protein" label="โปรตีน" suffix="g"
                  type="number" /></v-col>
              <v-col cols="6" sm="3"><v-text-field v-model.number="form.fat" label="ไขมัน" suffix="g"
                  type="number" /></v-col>
              <v-col cols="6" sm="4"><v-text-field v-model.number="form.sugar" label="น้ำตาล" suffix="g"
                  type="number" /></v-col>
              <v-col cols="6" sm="4"><v-text-field v-model.number="form.sodium" label="โซเดียม" suffix="mg"
                  type="number" /></v-col>
              <v-col cols="6" sm="4"><v-text-field v-model.number="form.cholesterol" label="คอเลสเตอรอล" suffix="mg"
                  type="number" /></v-col>
            </v-row>
            <v-checkbox v-model="saveToLibrary" label="บันทึกเมนูนี้ลงคลัง เพื่อใช้ซ้ำในครั้งถัดไป ⭐" color="primary"
              hide-details class="mt-1" />
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

    <!-- ── Choose Meal Dialog ── -->
    <v-dialog v-model="chooseMealDialog" max-width="360" persistent>
      <v-card>
        <v-card-title class="font-heading pa-5 pb-3">
          <v-icon color="primary" class="mr-2">mdi-food-plus-outline</v-icon>
          เลือกมื้ออาหาร
        </v-card-title>
        <v-card-text class="pa-5 pt-2">
          <v-row>
            <v-col cols="6" v-for="meal in mealTypes" :key="meal.value">
              <v-btn block height="72" :color="meal.color" variant="tonal" class="d-flex flex-column meal-select-btn"
                @click="chooseMealDialog = false; openAddDialog(meal.value)">
                <v-icon size="28" class="mb-1">{{ meal.icon }}</v-icon>
                <span class="text-body-2">{{ meal.label }}</span>
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="pa-5 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="chooseMealDialog = false">ยกเลิก</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ── Edit Food Dialog ── -->
    <v-dialog v-model="editDialog" max-width="420" persistent>
      <v-card>
        <v-card-title class="font-heading pa-5 pb-2">
          <v-icon color="primary" size="18" class="mr-2">mdi-pencil-outline</v-icon>
          {{ editForm.foodName }}
        </v-card-title>
        <v-card-text class="pa-5 pt-2">
          <!-- ปริมาณ + kcal แบบเดียวกับในภาพ -->
          <div class="d-flex align-center gap-4">
            <v-text-field v-model.number="editForm.quantity" label="ปริมาณที่กิน" suffix="g" type="number"
              density="comfortable" hide-details style="max-width: 160px" @update:model-value="recalcEdit" />
            <div class="flex-grow-1">
              <div class="text-h5 font-weight-bold text-primary">{{ editForm.calories }} kcal</div>
              <div class="text-caption text-medium-emphasis mt-1">
                คาร์บ {{ editForm.carbs }}g · โปรตีน {{ editForm.protein }}g · ไขมัน {{ editForm.fat }}g
              </div>
            </div>
          </div>
        </v-card-text>
        <v-card-actions class="pa-5 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="editDialog = false">ยกเลิก</v-btn>
          <v-btn color="primary" :loading="editSaving" @click="saveEdit">
            <v-icon start>mdi-content-save</v-icon> บันทึก
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>


    <!-- ── Confirm Delete Food Log ── -->
    <v-dialog v-model="confirmDeleteDialog" max-width="360" persistent>
      <v-card>
        <v-card-title class="font-heading pa-5 pb-3">
          <v-icon color="error" class="mr-2">mdi-alert-circle-outline</v-icon>
          ยืนยันการลบ
        </v-card-title>
        <v-card-text class="pa-5 pt-0">
          <p class="text-body-1">คุณต้องการลบ <strong>"{{ deletingLog?.foodName }}"</strong> ใช่ไหม?</p>
          <p class="text-body-2 text-medium-emphasis mt-2">การดำเนินการนี้ไม่สามารถเรียกคืนได้</p>
        </v-card-text>
        <v-card-actions class="pa-5 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="confirmDeleteDialog = false">ยกเลิก</v-btn>
          <v-btn color="error" :loading="deleting" @click="confirmDeleteLog">
            <v-icon start>mdi-delete-outline</v-icon> ลบ
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useNutritionStore } from '../stores/nutrition'
import api from '../plugins/axios'

const store = useNutritionStore()

onMounted(() => store.fetchAll())
const selectedDate = computed({ get: () => store.selectedDate, set: v => store.setDate(v) })
const mealSummary = computed(() => store.mealSummary)
const mealTypes = computed(() => store.mealTypes)

// ── Add dialog ──
const dialog = ref(false)
const chooseMealDialog = ref(false)
const activeTab = ref('local')
const activeMeal = ref('breakfast')
const activeMealLabel = computed(() => store.mealTypes.find(m => m.value === activeMeal.value)?.label || '')
const saving = ref(false)
const saveToLibrary = ref(false)
const allFoodItems = ref([])
const localSearch = ref('')
const selectedFood = ref(null)
const filteredLocalItems = computed(() => {
  if (!localSearch.value) return allFoodItems.value
  const q = localSearch.value.toLowerCase()
  return allFoodItems.value.filter(f => f.name.toLowerCase().includes(q))
})

// ── World food ──
const worldSearch = ref('')
const worldLoading = ref(false)
const worldResults = ref([])
const worldSearched = ref(false)
const worldError = ref('')
const selectedWorldFood = ref(null)

async function searchWorldFood() {
  if (!worldSearch.value.trim()) return
  worldLoading.value = true
  worldError.value = ''
  worldSearched.value = true
  selectedWorldFood.value = null
  try {
    const res = await api.get(`/world-food?q=${encodeURIComponent(worldSearch.value.trim())}`)
    worldResults.value = res.data
  } catch (e) {
    worldError.value = 'ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่'
  } finally {
    worldLoading.value = false
  }
}

function selectWorldFood(item) {
  selectedWorldFood.value = item
  form.value = {
    foodName: item.product_name,
    quantity: 100,
    calories: item.calories_100g,
    carbs: item.carbs_100g,
    protein: item.protein_100g,
    fat: item.fat_100g,
    sugar: item.sugar_100g,
    sodium: item.sodium_100g,
    cholesterol: item.cholesterol_100g,
  }
}

function recalcFromWorldFood(qty) {
  if (!selectedWorldFood.value) return
  const w = selectedWorldFood.value
  const r = qty / 100
  form.value.calories = Math.round(w.calories_100g * r)
  form.value.carbs = +(w.carbs_100g * r).toFixed(1)
  form.value.protein = +(w.protein_100g * r).toFixed(1)
  form.value.fat = +(w.fat_100g * r).toFixed(1)
  form.value.sugar = +(w.sugar_100g * r).toFixed(1)
  form.value.sodium = Math.round(w.sodium_100g * r)
  form.value.cholesterol = Math.round(w.cholesterol_100g * r)
}

function selectLocalFood(item) {
  selectedFood.value = item
  form.value = {
    foodName: item.name,
    quantity: item.servingSize || 100,
    calories: Math.round(item.calories),
    carbs: +item.carbs.toFixed(1),
    protein: +item.protein.toFixed(1),
    fat: +item.fat.toFixed(1),
    sugar: +item.sugar.toFixed(1),
    sodium: Math.round(item.sodium),
    cholesterol: Math.round(item.cholesterol),
  }
}

function recalcFromQuantity(qty) {
  if (!selectedFood.value) return
  const base = selectedFood.value.servingSize || 100
  const r = qty / base
  const f = selectedFood.value
  form.value.calories = Math.round(f.calories * r)
  form.value.carbs = +(f.carbs * r).toFixed(1)
  form.value.protein = +(f.protein * r).toFixed(1)
  form.value.fat = +(f.fat * r).toFixed(1)
  form.value.sugar = +(f.sugar * r).toFixed(1)
  form.value.sodium = Math.round(f.sodium * r)
  form.value.cholesterol = Math.round(f.cholesterol * r)
}

// ── Form ──
const emptyForm = () => ({ foodName: '', quantity: 100, calories: 0, carbs: 0, protein: 0, fat: 0, sugar: 0, sodium: 0, cholesterol: 0 })
const form = ref(emptyForm())

const canSave = computed(() => {
  if (activeTab.value === 'local') return !!selectedFood.value
  if (activeTab.value === 'world') return !!selectedWorldFood.value
  if (activeTab.value === 'manual') return !!form.value.foodName
  return false
})

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
  { title: '', key: 'actions', sortable: false, width: 80 },
]

function mealLogs(meal) {
  return store.todayLogs.filter(l => l.meal === meal)
}

function openAddDialogQuick() {
  // เปิด dialog พร้อม dialog เลือกมื้อก่อน
  chooseMealDialog.value = true
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
  localSearch.value = ''
  saveToLibrary.value = false
  activeTab.value = 'local'
  allFoodItems.value = store.foodItems
  dialog.value = true
}

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

// ── Edit dialog ──
const editDialog = ref(false)
const editBaseValues = ref({})
const editSaving = ref(false)
const editingId = ref(null)
const editForm = ref(emptyForm())

function openEditDialog(item) {
  editingId.value = item.id
  // เก็บค่า base (ต้นฉบับ) ไว้สำหรับคำนวณ ไม่แตะคลังเมนู
  editBaseValues.value = {
    quantity: item.quantity,
    calories: item.calories,
    carbs: item.carbs,
    protein: item.protein,
    fat: item.fat,
    sugar: item.sugar,
    sodium: item.sodium,
    cholesterol: item.cholesterol,
  }
  editForm.value = {
    foodName: item.foodName,
    quantity: item.quantity,
    calories: item.calories,
    carbs: item.carbs,
    protein: item.protein,
    fat: item.fat,
    sugar: item.sugar,
    sodium: item.sodium,
    cholesterol: item.cholesterol,
  }
  editDialog.value = true
}

// คำนวณสารอาหารใหม่เมื่อแก้ปริมาณ
function recalcEdit(newQty) {
  if (!newQty || !editBaseValues.value.quantity) return
  const base = editBaseValues.value
  const ratio = newQty / base.quantity
  editForm.value.calories = Math.round(base.calories * ratio)
  editForm.value.carbs = +(base.carbs * ratio).toFixed(1)
  editForm.value.protein = +(base.protein * ratio).toFixed(1)
  editForm.value.fat = +(base.fat * ratio).toFixed(1)
  editForm.value.sugar = +(base.sugar * ratio).toFixed(1)
  editForm.value.sodium = Math.round(base.sodium * ratio)
  editForm.value.cholesterol = Math.round(base.cholesterol * ratio)
}

async function saveEdit() {
  editSaving.value = true
  try {
    await api.put(`/food-logs/${editingId.value}`, editForm.value)
    // อัปเดต local state
    const idx = store.foodLogs.findIndex(l => l.id === editingId.value)
    if (idx !== -1) {
      store.foodLogs[idx] = { ...store.foodLogs[idx], ...editForm.value }
    }
    editDialog.value = false
  } finally {
    editSaving.value = false
  }
}

const confirmDeleteDialog = ref(false)
const deletingLog = ref(null)
const deleting = ref(false)

function openConfirmDeleteLog(item) {
  deletingLog.value = item
  confirmDeleteDialog.value = true
}

async function confirmDeleteLog() {
  deleting.value = true
  try {
    await store.deleteFoodLog(deletingLog.value.id)
    confirmDeleteDialog.value = false
    deletingLog.value = null
  } finally {
    deleting.value = false
  }
}

async function deleteLog(id) {
  await store.deleteFoodLog(id)
}
</script>

<style scoped>
.calc-result-box {
  background: rgba(45, 106, 79, 0.05);
  border: 1px solid rgba(45, 106, 79, 0.15);
}

.nutrient-chip {
  text-align: center;
  padding: 8px;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 8px;
}

.meal-total {
  background: rgba(0, 0, 0, 0.025);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.selected-food-preview {
  background: rgba(45, 106, 79, 0.06);
  border: 1px solid rgba(45, 106, 79, 0.15);
}

.food-list {
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.food-item-row {
  transition: background 0.15s;
}

.food-item-row:hover {
  background: rgba(45, 106, 79, 0.06) !important;
}

.selected-row {
  background: rgba(45, 106, 79, 0.1) !important;
}
</style>