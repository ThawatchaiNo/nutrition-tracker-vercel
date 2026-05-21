<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6 flex-wrap gap-3">
      <div>
        <h1 class="font-heading text-h5 font-weight-bold">บันทึกอาหาร</h1>
        <p class="text-medium-emphasis text-body-2">บันทึกอาหารในแต่ละมื้อ</p>
      </div>
      <div class="d-flex align-center gap-2 flex-wrap">
        <v-text-field
          v-model="selectedDate" type="date"
          density="compact" hide-details style="max-width: 180px"
          prepend-inner-icon="mdi-calendar"
          @update:model-value="store.fetchAll()"
        />
        <v-btn color="secondary" variant="tonal" @click="openMyMenuDialog">
          <v-icon start>mdi-book-open-outline</v-icon> คลังเมนูของฉัน
          <v-badge v-if="customCount > 0" :content="customCount" color="primary" inline />
        </v-btn>
      </div>
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
          <template #item.carbs="{ item }">{{ item.carbs.toFixed(1) }}</template>
          <template #item.protein="{ item }">{{ item.protein.toFixed(1) }}</template>
          <template #item.fat="{ item }">{{ item.fat.toFixed(1) }}</template>
          <template #item.sugar="{ item }">{{ item.sugar.toFixed(1) }}</template>
          <template #item.sodium="{ item }">{{ item.sodium.toFixed(0) }}</template>
          <template #item.cholesterol="{ item }">{{ item.cholesterol.toFixed(0) }}</template>
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

    <!-- ═══════════════════════════════════════
         DIALOG: เพิ่มอาหาร
    ═══════════════════════════════════════ -->
    <v-dialog v-model="dialog" max-width="640" scrollable>
      <v-card>
        <v-card-title class="font-heading pa-5 pb-0 d-flex align-center gap-2">
          <v-icon color="primary">mdi-food-plus-outline</v-icon>
          เพิ่มอาหาร —
          <v-chip size="small" :color="activeMealColor" variant="tonal">{{ activeMealLabel }}</v-chip>
        </v-card-title>

        <v-card-text class="pa-5 pt-3">
          <!-- Tab: ค้นหา vs กรอกเอง -->
          <v-tabs v-model="addTab" color="primary" density="compact" class="mb-4">
            <v-tab value="search">
              <v-icon start size="18">mdi-magnify</v-icon> ค้นหา / คลังเมนู
            </v-tab>
            <v-tab value="manual">
              <v-icon start size="18">mdi-pencil-outline</v-icon> กรอกเอง
            </v-tab>
          </v-tabs>

          <!-- TAB: ค้นหา -->
          <div v-if="addTab === 'search'">
            <v-text-field
              v-model="searchQuery"
              label="พิมพ์ชื่ออาหาร..."
              prepend-inner-icon="mdi-magnify"
              clearable density="compact"
              @input="onSearch"
              class="mb-3"
            />

            <!-- Filter chips -->
            <div class="d-flex gap-2 mb-3 flex-wrap">
              <v-chip
                size="small" :variant="filterType === 'all' ? 'flat' : 'tonal'"
                color="primary" @click="filterType = 'all'; onSearch()"
              >ทั้งหมด</v-chip>
              <v-chip
                size="small" :variant="filterType === 'custom' ? 'flat' : 'tonal'"
                color="secondary" @click="filterType = 'custom'; onSearch()"
              >
                <v-icon start size="14">mdi-star</v-icon>
                เมนูของฉัน ({{ customCount }})
              </v-chip>
              <v-chip
                size="small" :variant="filterType === 'preset' ? 'flat' : 'tonal'"
                color="grey" @click="filterType = 'preset'; onSearch()"
              >เมนูมาตรฐาน</v-chip>
            </div>

            <!-- Search results -->
            <div v-if="searchResults.length === 0 && searchQuery" class="text-center py-4 text-medium-emphasis">
              <v-icon size="36" color="grey-lighten-2">mdi-food-off-outline</v-icon>
              <p class="text-body-2 mt-2">ไม่พบเมนู "{{ searchQuery }}"</p>
              <v-btn size="small" color="primary" variant="tonal" class="mt-2" @click="addTab = 'manual'; form.foodName = searchQuery">
                <v-icon start>mdi-plus</v-icon> กรอกข้อมูลเมนูนี้เอง
              </v-btn>
            </div>

            <div v-if="searchResults.length === 0 && !searchQuery" class="text-center py-4 text-medium-emphasis">
              <v-icon size="36" color="grey-lighten-2">mdi-food-outline</v-icon>
              <p class="text-body-2 mt-2">พิมพ์ชื่ออาหารเพื่อค้นหา หรือเลือกจากคลังเมนูของฉัน</p>
            </div>

            <v-list v-if="searchResults.length > 0" lines="two" class="search-result-list rounded-lg">
              <v-list-item
                v-for="item in searchResults" :key="item.id"
                :class="{ 'selected-food': selectedSearchItem?.id === item.id }"
                @click="selectSearchItem(item)"
                rounded="lg"
              >
                <template #prepend>
                  <div class="food-icon-wrap mr-2" :class="item.custom ? 'custom-icon' : 'preset-icon'">
                    <v-icon size="18" :color="item.custom ? 'secondary' : 'grey'">
                      {{ item.custom ? 'mdi-star' : 'mdi-food' }}
                    </v-icon>
                  </div>
                </template>
                <template #title>
                  <span class="text-body-2 font-weight-medium">{{ item.name }}</span>
                  <v-chip v-if="item.custom" size="x-small" color="secondary" variant="tonal" class="ml-2">ของฉัน</v-chip>
                </template>
                <template #subtitle>
                  <span class="text-caption">
                    {{ item.calories }} kcal | คาร์บ {{ item.carbs }}g | โปรตีน {{ item.protein }}g | ไขมัน {{ item.fat }}g
                    (ต่อ {{ item.servingSize }}{{ item.unit }})
                  </span>
                </template>
                <template #append>
                  <v-icon v-if="selectedSearchItem?.id === item.id" color="primary">mdi-check-circle</v-icon>
                </template>
              </v-list-item>
            </v-list>

            <!-- ปริมาณที่กิน -->
            <div v-if="selectedSearchItem" class="mt-4 pa-4 quantity-box rounded-xl">
              <div class="d-flex align-center gap-3 mb-3">
                <v-icon color="primary">mdi-scale</v-icon>
                <span class="font-weight-medium">{{ selectedSearchItem.name }}</span>
              </div>
              <v-row align="center">
                <v-col cols="7">
                  <v-text-field
                    v-model.number="selectedQty"
                    label="ปริมาณที่กิน"
                    :suffix="selectedSearchItem.unit || 'g'"
                    type="number" density="compact"
                    @input="calcFromQty"
                  />
                </v-col>
                <v-col cols="5">
                  <div class="text-caption text-medium-emphasis">ค่าโภชนาการ:</div>
                  <div class="text-body-2 font-weight-bold text-primary">{{ calcCalories }} kcal</div>
                  <div class="text-caption">คาร์บ {{ calcCarbs }}g | โปรตีน {{ calcProtein }}g | ไขมัน {{ calcFat }}g</div>
                </v-col>
              </v-row>
            </div>
          </div>

          <!-- TAB: กรอกเอง -->
          <div v-if="addTab === 'manual'">
            <!-- ตัวเลือกบันทึกลงคลัง -->
            <v-alert type="info" variant="tonal" density="compact" class="mb-4">
              <div class="d-flex align-center gap-2">
                <v-checkbox
                  v-model="saveToMenu" density="compact" hide-details color="primary"
                  label="บันทึกเมนูนี้ลงคลัง เพื่อใช้ซ้ำในครั้งถัดไป"
                  class="flex-grow-1"
                />
              </div>
            </v-alert>

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
          </div>
        </v-card-text>

        <v-card-actions class="pa-5 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">ยกเลิก</v-btn>
          <v-btn color="primary" :loading="saving" @click="saveFood"
            :disabled="addTab === 'search' ? !selectedSearchItem : !form.foodName">
            <v-icon start>mdi-content-save</v-icon>
            {{ addTab === 'manual' && saveToMenu ? 'บันทึก + เพิ่มในคลัง' : 'บันทึก' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ═══════════════════════════════════════
         DIALOG: คลังเมนูของฉัน
    ═══════════════════════════════════════ -->
    <v-dialog v-model="myMenuDialog" max-width="700" scrollable>
      <v-card>
        <v-card-title class="font-heading pa-5 pb-3 d-flex align-center justify-space-between">
          <div class="d-flex align-center gap-2">
            <v-icon color="secondary">mdi-book-open-outline</v-icon>
            คลังเมนูของฉัน
            <v-chip size="small" color="secondary" variant="tonal">{{ customItems.length }} เมนู</v-chip>
          </div>
          <v-btn size="small" color="primary" variant="tonal" @click="openEditDialog(null)">
            <v-icon start>mdi-plus</v-icon> เพิ่มเมนูใหม่
          </v-btn>
        </v-card-title>

        <v-card-text class="pa-0">
          <div v-if="customItems.length === 0" class="text-center py-12 text-medium-emphasis">
            <v-icon size="64" color="grey-lighten-2">mdi-silverware-fork-knife</v-icon>
            <p class="text-body-1 mt-3">ยังไม่มีเมนูในคลัง</p>
            <p class="text-body-2">กรอกข้อมูลอาหารแล้วติ๊ก "บันทึกลงคลัง" หรือกด "เพิ่มเมนูใหม่"</p>
          </div>

          <v-list v-else lines="two">
            <v-list-item
              v-for="item in customItems" :key="item.id"
              class="border-b"
            >
              <template #prepend>
                <div class="food-icon-wrap custom-icon mr-3">
                  <v-icon color="secondary" size="20">mdi-star</v-icon>
                </div>
              </template>
              <template #title>
                <span class="font-weight-medium">{{ item.name }}</span>
              </template>
              <template #subtitle>
                <span class="text-caption">
                  {{ item.calories }} kcal | คาร์บ {{ item.carbs }}g | โปรตีน {{ item.protein }}g |
                  ไขมัน {{ item.fat }}g | น้ำตาล {{ item.sugar }}g |
                  โซเดียม {{ item.sodium }}mg | คอเลสเตอรอล {{ item.cholesterol }}mg
                </span>
                <span class="text-caption text-medium-emphasis ml-2">
                  ({{ item.servingSize || item.quantity || 100 }}{{ item.unit || 'g' }} ต่อหน่วย)
                </span>
              </template>
              <template #append>
                <div class="d-flex gap-1">
                  <v-btn icon size="x-small" color="primary" variant="text" @click="openEditDialog(item)">
                    <v-icon>mdi-pencil-outline</v-icon>
                  </v-btn>
                  <v-btn icon size="x-small" color="error" variant="text" @click="confirmDelete(item)">
                    <v-icon>mdi-delete-outline</v-icon>
                  </v-btn>
                </div>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="tonal" @click="myMenuDialog = false">ปิด</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- DIALOG: แก้ไข/เพิ่มเมนูในคลัง -->
    <v-dialog v-model="editDialog" max-width="560">
      <v-card>
        <v-card-title class="font-heading pa-5 pb-3">
          <v-icon color="secondary" class="mr-2">{{ editItem ? 'mdi-pencil' : 'mdi-plus-circle' }}</v-icon>
          {{ editItem ? 'แก้ไขเมนู' : 'เพิ่มเมนูใหม่' }}
        </v-card-title>
        <v-card-text class="pa-5 pt-2">
          <v-row>
            <v-col cols="12" sm="8">
              <v-text-field v-model="editForm.name" label="ชื่ออาหาร *" prepend-inner-icon="mdi-food" />
            </v-col>
            <v-col cols="6" sm="2">
              <v-text-field v-model.number="editForm.servingSize" label="หน่วย" type="number" />
            </v-col>
            <v-col cols="6" sm="2">
              <v-select v-model="editForm.unit" :items="['g','ml','ชิ้น','ถ้วย']" label="หน่วยวัด" />
            </v-col>
            <v-col cols="6" sm="4">
              <v-text-field v-model.number="editForm.calories" label="พลังงาน" suffix="kcal" type="number" />
            </v-col>
            <v-col cols="6" sm="4">
              <v-text-field v-model.number="editForm.carbs" label="คาร์บ" suffix="g" type="number" />
            </v-col>
            <v-col cols="6" sm="4">
              <v-text-field v-model.number="editForm.protein" label="โปรตีน" suffix="g" type="number" />
            </v-col>
            <v-col cols="6" sm="4">
              <v-text-field v-model.number="editForm.fat" label="ไขมัน" suffix="g" type="number" />
            </v-col>
            <v-col cols="6" sm="4">
              <v-text-field v-model.number="editForm.sugar" label="น้ำตาล" suffix="g" type="number" />
            </v-col>
            <v-col cols="6" sm="4">
              <v-text-field v-model.number="editForm.sodium" label="โซเดียม" suffix="mg" type="number" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model.number="editForm.cholesterol" label="คอเลสเตอรอล" suffix="mg" type="number" />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="pa-5 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="editDialog = false">ยกเลิก</v-btn>
          <v-btn color="secondary" :loading="editSaving" @click="saveEditMenu" :disabled="!editForm.name">
            <v-icon start>mdi-content-save</v-icon> บันทึก
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Confirm delete -->
    <v-dialog v-model="deleteDialog" max-width="360">
      <v-card class="pa-4">
        <v-card-title class="font-heading">ลบเมนูนี้?</v-card-title>
        <v-card-text>ต้องการลบ <strong>{{ deleteTarget?.name }}</strong> ออกจากคลังเมนูของฉันใช่ไหม?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">ยกเลิก</v-btn>
          <v-btn color="error" :loading="deleting" @click="doDelete">ลบ</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snack.show" :color="snack.color" timeout="3000">
      <v-icon class="mr-2">{{ snack.icon }}</v-icon>{{ snack.msg }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useNutritionStore } from '../stores/nutrition'

const store = useNutritionStore()
const selectedDate = computed({ get: () => store.selectedDate, set: v => store.setDate(v) })
const mealSummary = computed(() => store.mealSummary)
const mealTypes = computed(() => store.mealTypes)
const customItems = computed(() => store.customFoodItems)
const customCount = computed(() => customItems.value.length)

// ── Snackbar ──
const snack = ref({ show: false, msg: '', color: 'success', icon: 'mdi-check-circle' })
function showSnack(msg, color = 'success', icon = 'mdi-check-circle') {
  snack.value = { show: true, msg, color, icon }
}

// ── Daily summary bar ──
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

function mealLogs(meal) { return store.todayLogs.filter(l => l.meal === meal) }

// ════════════════════════════════
// ADD FOOD DIALOG
// ════════════════════════════════
const dialog = ref(false)
const activeMeal = ref('breakfast')
const addTab = ref('search')
const saving = ref(false)
const saveToMenu = ref(false)
const searchQuery = ref('')
const searchResults = ref([])
const filterType = ref('all')
const selectedSearchItem = ref(null)
const selectedQty = ref(100)

const activeMealLabel = computed(() => store.mealTypes.find(m => m.value === activeMeal.value)?.label || '')
const activeMealColor = computed(() => store.mealTypes.find(m => m.value === activeMeal.value)?.color || 'primary')

// คำนวณโภชนาการตามปริมาณที่เลือก
const calcRatio = computed(() => selectedSearchItem.value
  ? selectedQty.value / (selectedSearchItem.value.servingSize || 100)
  : 1
)
const calcCalories = computed(() => selectedSearchItem.value ? Math.round(selectedSearchItem.value.calories * calcRatio.value) : 0)
const calcCarbs = computed(() => selectedSearchItem.value ? (selectedSearchItem.value.carbs * calcRatio.value).toFixed(1) : 0)
const calcProtein = computed(() => selectedSearchItem.value ? (selectedSearchItem.value.protein * calcRatio.value).toFixed(1) : 0)
const calcFat = computed(() => selectedSearchItem.value ? (selectedSearchItem.value.fat * calcRatio.value).toFixed(1) : 0)

function calcFromQty() { /* reactive via computed */ }

const emptyForm = () => ({ foodName: '', quantity: 100, calories: 0, carbs: 0, protein: 0, fat: 0, sugar: 0, sodium: 0, cholesterol: 0 })
const form = ref(emptyForm())

function openAddDialog(meal) {
  activeMeal.value = meal
  addTab.value = 'search'
  searchQuery.value = ''
  searchResults.value = store.foodItems.slice(0, 20)
  filterType.value = 'all'
  selectedSearchItem.value = null
  selectedQty.value = 100
  form.value = emptyForm()
  saveToMenu.value = false
  dialog.value = true
}

async function onSearch() {
  const q = searchQuery.value?.trim() || ''
  let items = store.foodItems

  if (filterType.value === 'custom') items = items.filter(f => f.custom)
  else if (filterType.value === 'preset') items = items.filter(f => !f.custom)

  if (q) items = items.filter(f => f.name.toLowerCase().includes(q.toLowerCase()))

  searchResults.value = items.slice(0, 30)
}

function selectSearchItem(item) {
  selectedSearchItem.value = item
  selectedQty.value = item.servingSize || 100
}

async function saveFood() {
  saving.value = true
  try {
    if (addTab.value === 'search' && selectedSearchItem.value) {
      const item = selectedSearchItem.value
      const ratio = selectedQty.value / (item.servingSize || 100)
      await store.addFoodLog({
        meal: activeMeal.value,
        foodName: item.name,
        foodItemId: item.id,
        quantity: selectedQty.value,
        calories: Math.round(item.calories * ratio),
        carbs: parseFloat((item.carbs * ratio).toFixed(2)),
        protein: parseFloat((item.protein * ratio).toFixed(2)),
        fat: parseFloat((item.fat * ratio).toFixed(2)),
        sugar: parseFloat((item.sugar * ratio).toFixed(2)),
        sodium: parseFloat((item.sodium * ratio).toFixed(2)),
        cholesterol: parseFloat((item.cholesterol * ratio).toFixed(2)),
      })
    } else {
      // กรอกเอง — ถ้าติ๊กบันทึกลงคลังด้วย
      if (saveToMenu.value && form.value.foodName) {
        try {
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
          showSnack(`เพิ่ม "${form.value.foodName}" ลงคลังเมนูแล้ว ⭐`, 'secondary', 'mdi-star')
        } catch (e) {
          if (e.response?.data?.error !== 'มีเมนูนี้อยู่แล้ว') throw e
        }
      }
      await store.addFoodLog({ ...form.value, meal: activeMeal.value })
    }
    dialog.value = false
  } finally {
    saving.value = false
  }
}

async function deleteLog(id) { await store.deleteFoodLog(id) }

// ════════════════════════════════
// MY MENU DIALOG
// ════════════════════════════════
const myMenuDialog = ref(false)
function openMyMenuDialog() {
  myMenuDialog.value = true
}

// EDIT / ADD menu
const editDialog = ref(false)
const editItem = ref(null)
const editSaving = ref(false)
const emptyEditForm = () => ({ name: '', servingSize: 100, unit: 'g', calories: 0, carbs: 0, protein: 0, fat: 0, sugar: 0, sodium: 0, cholesterol: 0 })
const editForm = ref(emptyEditForm())

function openEditDialog(item) {
  editItem.value = item
  if (item) {
    editForm.value = { ...item }
  } else {
    editForm.value = emptyEditForm()
  }
  editDialog.value = true
}

async function saveEditMenu() {
  editSaving.value = true
  try {
    if (editItem.value) {
      await store.updateCustomFoodItem(editItem.value.id, editForm.value)
      showSnack('แก้ไขเมนูสำเร็จ', 'success', 'mdi-check-circle')
    } else {
      await store.addCustomFoodItem(editForm.value)
      showSnack(`เพิ่ม "${editForm.value.name}" ลงคลังแล้ว ⭐`, 'secondary', 'mdi-star')
    }
    editDialog.value = false
  } catch (e) {
    showSnack(e.response?.data?.error || 'เกิดข้อผิดพลาด', 'error', 'mdi-alert')
  } finally {
    editSaving.value = false
  }
}

// DELETE menu
const deleteDialog = ref(false)
const deleteTarget = ref(null)
const deleting = ref(false)

function confirmDelete(item) { deleteTarget.value = item; deleteDialog.value = true }

async function doDelete() {
  deleting.value = true
  try {
    await store.deleteCustomFoodItem(deleteTarget.value.id)
    showSnack('ลบเมนูสำเร็จ', 'error', 'mdi-delete')
    deleteDialog.value = false
  } finally {
    deleting.value = false
  }
}

// เมื่อเปิด dialog ค้นหา โหลด food items ใหม่
watch(dialog, v => { if (v) onSearch() })
</script>

<style scoped>
.meal-total { background: rgba(0,0,0,0.025); border-top: 1px solid rgba(0,0,0,0.06); }
.search-result-list { border: 1px solid rgba(0,0,0,0.08); max-height: 280px; overflow-y: auto; }
.selected-food { background: rgba(45,106,79,0.08) !important; }
.food-icon-wrap { width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
.custom-icon { background: rgba(82,183,136,0.12); }
.preset-icon { background: rgba(0,0,0,0.05); }
.quantity-box { background: rgba(45,106,79,0.06); border: 1px solid rgba(45,106,79,0.15); }
.border-b { border-bottom: 1px solid rgba(0,0,0,0.06); }
</style>
