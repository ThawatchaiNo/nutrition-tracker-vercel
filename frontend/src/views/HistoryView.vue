<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6 flex-wrap gap-3">
      <div>
        <h1 class="font-heading text-h5 font-weight-bold">ประวัติการบันทึก</h1>
        <p class="text-medium-emphasis text-body-2">ข้อมูลอาหารและกิจกรรมทั้งหมดที่บันทึกไว้</p>
      </div>
    </div>

    <!-- Filter Bar -->
    <v-card class="pa-4 mb-5">
      <v-row align="center" dense>
        <v-col cols="12" sm="4" md="3">
          <v-text-field v-model="filters.startDate" label="วันที่เริ่ม" type="date" density="compact" hide-details prepend-inner-icon="mdi-calendar-start" />
        </v-col>
        <v-col cols="12" sm="4" md="3">
          <v-text-field v-model="filters.endDate" label="วันที่สิ้นสุด" type="date" density="compact" hide-details prepend-inner-icon="mdi-calendar-end" />
        </v-col>
        <v-col cols="12" sm="4" md="3">
          <v-text-field v-model="filters.search" label="ค้นหาชื่ออาหาร/กิจกรรม" density="compact" hide-details prepend-inner-icon="mdi-magnify" clearable />
        </v-col>
        <v-col cols="6" sm="4" md="2">
          <v-select
            v-model="filters.meal" label="มื้อ" density="compact" hide-details
            :items="[{title:'ทั้งหมด',value:''},{title:'เช้า',value:'breakfast'},{title:'กลางวัน',value:'lunch'},{title:'เย็น',value:'dinner'},{title:'ว่าง',value:'snack'}]"
            item-title="title" item-value="value"
          />
        </v-col>
        <v-col cols="6" sm="4" md="1">
          <v-btn color="primary" block @click="loadHistory" :loading="loading">
            <v-icon>mdi-magnify</v-icon>
          </v-btn>
        </v-col>
      </v-row>
    </v-card>

    <!-- Tabs -->
    <v-tabs v-model="activeTab" color="primary" class="mb-4">
      <v-tab value="food">
        <v-icon start>mdi-food</v-icon> อาหาร
        <v-chip size="x-small" class="ml-2" color="primary" variant="tonal">{{ filteredFoodLogs.length }}</v-chip>
      </v-tab>
      <v-tab value="activity">
        <v-icon start>mdi-run-fast</v-icon> กิจกรรม
        <v-chip size="x-small" class="ml-2" color="orange" variant="tonal">{{ activities.length }}</v-chip>
      </v-tab>
    </v-tabs>

    <div v-if="loading" class="text-center py-12">
      <v-progress-circular indeterminate color="primary" size="48" />
      <p class="text-body-2 text-medium-emphasis mt-3">กำลังโหลดข้อมูล...</p>
    </div>

    <template v-else>

      <!-- ── อาหาร ── -->
      <div v-if="activeTab === 'food'">
        <v-row class="mb-4">
          <v-col cols="6" sm="3" v-for="s in foodSummary" :key="s.label">
            <v-card class="pa-4 text-center stat-card">
              <div class="text-h5 font-weight-bold font-heading" :style="{color: s.color}">{{ s.value }}</div>
              <div class="text-caption text-medium-emphasis">{{ s.label }}</div>
            </v-card>
          </v-col>
        </v-row>

        <v-card v-if="filteredFoodLogs.length === 0" class="pa-8 text-center">
          <v-icon size="64" color="grey-lighten-2">mdi-food-off-outline</v-icon>
          <p class="text-body-1 text-medium-emphasis mt-3">ไม่พบข้อมูลในช่วงเวลานี้</p>
        </v-card>

        <v-card v-else>
          <v-data-table
            :items="filteredFoodLogs"
            :headers="foodHeaders"
            density="comfortable"
            class="data-table"
            :items-per-page="20"
            :sort-by="[{key:'date', order:'desc'}]"
          >
            <template #item.date="{ item }">
              <span class="font-weight-medium">{{ formatDate(item.date) }}</span>
            </template>
            <template #item.meal="{ item }">
              <v-chip size="small" :color="mealColor(item.meal)" variant="tonal">{{ mealLabel(item.meal) }}</v-chip>
            </template>
            <template #item.foodName="{ item }">
              <span class="font-weight-medium">{{ item.foodName }}</span>
            </template>
            <template #item.quantity="{ item }">{{ item.quantity }}g</template>
            <template #item.calories="{ item }">
              <span class="text-primary font-weight-bold">{{ item.calories }}</span>
            </template>
            <template #item.carbs="{ item }">{{ Number(item.carbs).toFixed(1) }}</template>
            <template #item.protein="{ item }">{{ Number(item.protein).toFixed(1) }}</template>
            <template #item.fat="{ item }">{{ Number(item.fat).toFixed(1) }}</template>
            <template #item.sugar="{ item }">{{ Number(item.sugar).toFixed(1) }}</template>
            <template #item.sodium="{ item }">{{ Number(item.sodium).toFixed(0) }}</template>
            <template #item.cholesterol="{ item }">{{ Number(item.cholesterol).toFixed(0) }}</template>
          </v-data-table>
        </v-card>
      </div>

      <!-- ── กิจกรรม ── -->
      <div v-if="activeTab === 'activity'">
        <v-row class="mb-4">
          <v-col cols="6" sm="3" v-for="s in actSummary" :key="s.label">
            <v-card class="pa-4 text-center stat-card">
              <div class="text-h5 font-weight-bold font-heading" :style="{color: s.color}">{{ s.value }}</div>
              <div class="text-caption text-medium-emphasis">{{ s.label }}</div>
            </v-card>
          </v-col>
        </v-row>

        <v-card v-if="activities.length === 0" class="pa-8 text-center">
          <v-icon size="64" color="grey-lighten-2">mdi-run-fast</v-icon>
          <p class="text-body-1 text-medium-emphasis mt-3">ไม่พบข้อมูลในช่วงเวลานี้</p>
        </v-card>

        <v-card v-else>
          <v-data-table
            :items="filteredActivities"
            :headers="actHeaders"
            density="comfortable"
            class="data-table"
            :items-per-page="20"
            :sort-by="[{key:'date', order:'desc'}]"
          >
            <template #item.date="{ item }">
              <span class="font-weight-medium">{{ formatDate(item.date) }}</span>
            </template>
            <template #item.name="{ item }">
              <span class="font-weight-medium">{{ item.name }}</span>
            </template>
            <template #item.type="{ item }">
              <v-chip size="small" :color="typeColor(item.type)" variant="tonal">{{ item.type }}</v-chip>
            </template>
            <template #item.intensity="{ item }">
              <v-chip size="x-small" :color="intensityColor(item.intensity)" variant="tonal">{{ intensityLabel(item.intensity) }}</v-chip>
            </template>
            <template #item.duration="{ item }">{{ item.duration }} นาที</template>
            <template #item.caloriesBurned="{ item }">
              <span class="text-orange font-weight-bold">{{ item.caloriesBurned }}</span>
            </template>
            <template #item.notes="{ item }">
              <span class="text-caption text-medium-emphasis">{{ item.notes || '-' }}</span>
            </template>
          </v-data-table>
        </v-card>
      </div>

    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../plugins/axios'

const activeTab = ref('food')
const loading = ref(false)
const foodLogs = ref([])
const activities = ref([])

const filters = ref({
  startDate: (() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().split('T')[0] })(),
  endDate: new Date().toISOString().split('T')[0],
  search: '',
  meal: '',
})

async function loadHistory() {
  loading.value = true
  try {
    const [foodRes, actRes] = await Promise.all([
      api.get(`/food-logs/all?startDate=${filters.value.startDate}&endDate=${filters.value.endDate}`),
      api.get(`/activities/all?startDate=${filters.value.startDate}&endDate=${filters.value.endDate}`)
    ])
    foodLogs.value = foodRes.data
    activities.value = actRes.data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(() => loadHistory())

const filteredFoodLogs = computed(() => {
  let logs = foodLogs.value
  if (filters.value.search) {
    const q = filters.value.search.toLowerCase()
    logs = logs.filter(l => l.foodName.toLowerCase().includes(q))
  }
  if (filters.value.meal) logs = logs.filter(l => l.meal === filters.value.meal)
  return logs
})

const filteredActivities = computed(() => {
  if (!filters.value.search) return activities.value
  const q = filters.value.search.toLowerCase()
  return activities.value.filter(a => a.name.toLowerCase().includes(q))
})

const foodSummary = computed(() => {
  const logs = filteredFoodLogs.value
  return [
    { label: 'รายการทั้งหมด', value: logs.length, color: '#2D6A4F' },
    { label: 'พลังงานรวม (kcal)', value: Math.round(logs.reduce((s,l) => s+l.calories, 0)).toLocaleString(), color: '#2D6A4F' },
    { label: 'คาร์บรวม (g)', value: logs.reduce((s,l) => s+l.carbs, 0).toFixed(0), color: '#F4A261' },
    { label: 'โปรตีนรวม (g)', value: logs.reduce((s,l) => s+l.protein, 0).toFixed(0), color: '#457B9D' },
  ]
})

const actSummary = computed(() => {
  const acts = activities.value
  const totalBurned = acts.reduce((s,a) => s+a.caloriesBurned, 0)
  const totalDuration = acts.reduce((s,a) => s+a.duration, 0)
  return [
    { label: 'กิจกรรมทั้งหมด', value: acts.length, color: '#2D6A4F' },
    { label: 'เวลารวม (นาที)', value: totalDuration.toLocaleString(), color: '#457B9D' },
    { label: 'เผาผลาญรวม (kcal)', value: Math.round(totalBurned).toLocaleString(), color: '#E76F51' },
    { label: 'เฉลี่ย/ครั้ง (kcal)', value: acts.length ? Math.round(totalBurned/acts.length) : 0, color: '#F4A261' },
  ]
})

const foodHeaders = [
  { title: 'วันที่', key: 'date', sortable: true },
  { title: 'มื้อ', key: 'meal', sortable: true },
  { title: 'ชื่ออาหาร', key: 'foodName', sortable: true },
  { title: 'ปริมาณ', key: 'quantity', sortable: false },
  { title: 'kcal', key: 'calories', sortable: true },
  { title: 'คาร์บ (g)', key: 'carbs', sortable: false },
  { title: 'โปรตีน (g)', key: 'protein', sortable: false },
  { title: 'ไขมัน (g)', key: 'fat', sortable: false },
  { title: 'น้ำตาล (g)', key: 'sugar', sortable: false },
  { title: 'โซเดียม (mg)', key: 'sodium', sortable: false },
  { title: 'คอเลสเตอรอล (mg)', key: 'cholesterol', sortable: false },
]

const actHeaders = [
  { title: 'วันที่', key: 'date', sortable: true },
  { title: 'ชื่อกิจกรรม', key: 'name', sortable: true },
  { title: 'ประเภท', key: 'type', sortable: true },
  { title: 'ความเข้มข้น', key: 'intensity', sortable: false },
  { title: 'ระยะเวลา', key: 'duration', sortable: true },
  { title: 'เผาผลาญ (kcal)', key: 'caloriesBurned', sortable: true },
  { title: 'บันทึก', key: 'notes', sortable: false },
]

function formatDate(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })
}
function mealLabel(m) { return { breakfast:'เช้า', lunch:'กลางวัน', dinner:'เย็น', snack:'ว่าง' }[m] || m }
function mealColor(m) { return { breakfast:'orange', lunch:'green', dinner:'blue', snack:'amber' }[m] || 'grey' }
function typeColor(t) { return { 'คาร์ดิโอ':'orange','ฝึกน้ำหนัก':'blue','ยืดเส้น/โยคะ':'green','กีฬาทีม':'red','ว่ายน้ำ':'cyan','ปั่นจักรยาน':'purple' }[t] || 'grey' }
function intensityColor(v) { return v==='high'?'error':v==='low'?'success':'warning' }
function intensityLabel(v) { return v==='high'?'หนัก':v==='low'?'เบา':'ปานกลาง' }
</script>
