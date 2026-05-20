<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6 flex-wrap gap-3">
      <div>
        <h1 class="font-heading text-h5 font-weight-bold">รายงานและกราฟ</h1>
        <p class="text-medium-emphasis text-body-2">วิเคราะห์โภชนาการและกิจกรรมย้อนหลัง</p>
      </div>
      <div class="d-flex align-center gap-3 flex-wrap">
        <v-btn-toggle v-model="period" mandatory color="primary" density="compact" variant="tonal">
          <v-btn value="7">7 วัน</v-btn>
          <v-btn value="14">14 วัน</v-btn>
          <v-btn value="30">30 วัน</v-btn>
        </v-btn-toggle>
        <v-btn color="primary" variant="tonal" @click="loadReports" :loading="loading">
          <v-icon start>mdi-refresh</v-icon> โหลดข้อมูล
        </v-btn>
      </div>
    </div>

    <div v-if="loading" class="text-center py-12">
      <v-progress-circular indeterminate color="primary" size="48" />
      <p class="text-body-2 text-medium-emphasis mt-3">กำลังโหลดข้อมูล...</p>
    </div>

    <template v-else>

      <!-- ── Summary avg cards ── -->
      <v-row class="mb-5">
        <v-col cols="6" sm="3" v-for="card in summaryCards" :key="card.label">
          <v-card class="stat-card pa-4">
            <div class="d-flex align-center gap-2 mb-2">
              <v-icon :color="card.color" size="22">{{ card.icon }}</v-icon>
              <span class="text-body-2 text-medium-emphasis">{{ card.label }}</span>
            </div>
            <div class="text-h5 font-weight-bold font-heading">{{ card.avg }}</div>
            <div class="text-caption text-medium-emphasis">เฉลี่ยต่อวัน</div>
            <div class="d-flex align-center gap-1 mt-1">
              <v-icon size="14" :color="card.overGoal ? 'error' : 'success'">
                {{ card.overGoal ? 'mdi-trending-up' : 'mdi-trending-down' }}
              </v-icon>
              <span class="text-caption" :class="card.overGoal ? 'text-error' : 'text-success'">
                {{ card.diffLabel }}
              </span>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- ── Calorie Chart ── -->
      <v-card class="pa-5 mb-5">
        <h3 class="font-heading text-subtitle-1 font-weight-semibold mb-1">
          <v-icon color="primary" class="mr-2">mdi-chart-bar</v-icon>
          แคลอรี่รับเข้า vs เผาผลาญ vs สุทธิ ({{ period }} วัน)
        </h3>
        <p class="text-caption text-medium-emphasis mb-4">
          แคลอรี่สุทธิ = รับเข้า − เผาผลาญจากการออกกำลังกาย
        </p>
        <div style="height: 300px">
          <Bar v-if="calorieChartData" :data="calorieChartData" :options="barOptions" />
          <div v-else class="d-flex align-center justify-center fill-height text-medium-emphasis">
            <p>ไม่มีข้อมูลในช่วงนี้</p>
          </div>
        </div>
      </v-card>

      <!-- ── Macro trend chart ── -->
      <v-card class="pa-5 mb-5">
        <h3 class="font-heading text-subtitle-1 font-weight-semibold mb-4">
          <v-icon color="primary" class="mr-2">mdi-chart-line</v-icon>
          แนวโน้มสารอาหารหลัก
        </h3>
        <div style="height: 280px">
          <Line v-if="macroChartData" :data="macroChartData" :options="lineOptions" />
          <div v-else class="d-flex align-center justify-center fill-height text-medium-emphasis">
            <p>ไม่มีข้อมูลในช่วงนี้</p>
          </div>
        </div>
      </v-card>

      <!-- ── Detailed table ── -->
      <v-card class="pa-5 mb-5">
        <h3 class="font-heading text-subtitle-1 font-weight-semibold mb-4">
          <v-icon color="primary" class="mr-2">mdi-table</v-icon>
          ตารางสรุปรายวัน
        </h3>
        <v-data-table
          :items="tableData"
          :headers="tableHeaders"
          density="comfortable"
          class="data-table"
          :items-per-page="10"
        >
          <template #item.date="{ item }">
            <span class="font-weight-medium">{{ formatDate(item.date) }}</span>
          </template>
          <template #item.calories="{ item }">
            <span class="font-weight-medium">{{ Math.round(item.calories) }}</span>
          </template>
          <template #item.burned="{ item }">
            <span class="text-orange font-weight-medium">{{ Math.round(item.burned) }}</span>
          </template>
          <template #item.net="{ item }">
            <v-chip
              size="small"
              :color="item.net > goals.calories ? 'error' : item.net < goals.calories * 0.8 ? 'warning' : 'success'"
              variant="tonal"
            >
              {{ Math.round(item.net) }}
            </v-chip>
          </template>
          <template #item.carbs="{ item }">
            <span :class="item.carbs > goals.carbs ? 'text-error' : ''">{{ item.carbs?.toFixed(1) }}</span>
          </template>
          <template #item.protein="{ item }">
            <span :class="item.protein < goals.protein * 0.8 ? 'text-warning' : 'text-success'">{{ item.protein?.toFixed(1) }}</span>
          </template>
          <template #item.fat="{ item }">
            <span :class="item.fat > goals.fat ? 'text-error' : ''">{{ item.fat?.toFixed(1) }}</span>
          </template>
          <template #item.sugar="{ item }">
            <span :class="item.sugar > goals.sugar ? 'text-error' : ''">{{ item.sugar?.toFixed(1) }}</span>
          </template>
          <template #item.sodium="{ item }">
            <span :class="item.sodium > goals.sodium ? 'text-error' : ''">{{ item.sodium?.toFixed(0) }}</span>
          </template>
        </v-data-table>
        <div class="mt-2 d-flex gap-4 flex-wrap text-caption text-medium-emphasis pa-2">
          <span><v-icon size="12" color="success">mdi-circle</v-icon> อยู่ในเป้าหมาย</span>
          <span><v-icon size="12" color="error">mdi-circle</v-icon> เกินเป้าหมาย</span>
          <span><v-icon size="12" color="warning">mdi-circle</v-icon> ต่ำกว่าเป้าหมาย</span>
        </div>
      </v-card>

      <!-- ── Goal achievement ── -->
      <v-card class="pa-5">
        <h3 class="font-heading text-subtitle-1 font-weight-semibold mb-2">
          <v-icon color="primary" class="mr-2">mdi-bullseye</v-icon>
          การบรรลุเป้าหมาย ({{ period }} วัน)
        </h3>
        <p class="text-caption text-medium-emphasis mb-5">
          % ของวันที่อยู่ในเป้าหมาย — คำนวณจากแคลอรี่สุทธิ (หักการออกกำลังกายแล้ว)
        </p>

        <v-row>
          <v-col cols="12" sm="6" md="3" v-for="g in goalAchievement" :key="g.key">
            <div class="goal-check-card pa-4 rounded-xl text-center">
              <div class="text-h4 font-weight-bold font-heading" :style="{ color: g.color }">
                {{ g.achieved }}%
              </div>
              <div class="text-body-2 font-weight-medium mb-1">{{ g.label }}</div>
              <div class="text-caption text-medium-emphasis">
                เฉลี่ย {{ g.avg }}
                <span class="ml-1">/ เป้า {{ g.target }}</span>
              </div>
              <div class="text-caption mt-1" :class="g.status === 'over' ? 'text-error' : g.status === 'low' ? 'text-warning' : 'text-success'">
                {{ g.statusLabel }}
              </div>
              <v-progress-linear
                :model-value="g.achieved"
                :color="g.achieved >= 80 ? g.color : g.achieved >= 50 ? 'warning' : 'error'"
                height="6" rounded class="mt-3"
              />
            </div>
          </v-col>
        </v-row>

        <!-- Net calorie summary box -->
        <v-card class="mt-5 pa-4" color="primary" theme="dark" rounded="xl">
          <h4 class="font-heading text-subtitle-2 mb-3">
            <v-icon class="mr-1">mdi-scale-balance</v-icon>
            สรุปพลังงานสุทธิเฉลี่ย (หักการออกกำลังกาย)
          </h4>
          <v-row text-center>
            <v-col cols="6" sm="3" class="text-center">
              <div class="text-h6 font-weight-bold">{{ Math.round(avgCalories) }}</div>
              <div class="text-caption opacity-75">รับเข้าเฉลี่ย (kcal)</div>
            </v-col>
            <v-col cols="6" sm="3" class="text-center">
              <div class="text-h6 font-weight-bold text-orange-lighten-2">{{ Math.round(avgBurned) }}</div>
              <div class="text-caption opacity-75">เผาผลาญเฉลี่ย (kcal)</div>
            </v-col>
            <v-col cols="6" sm="3" class="text-center">
              <div class="text-h6 font-weight-bold text-green-lighten-2">{{ Math.round(avgNet) }}</div>
              <div class="text-caption opacity-75">สุทธิเฉลี่ย (kcal)</div>
            </v-col>
            <v-col cols="6" sm="3" class="text-center">
              <div class="text-h6 font-weight-bold" :class="avgNet > goals.calories ? 'text-red-lighten-2' : 'text-green-lighten-2'">
                {{ avgNet > goals.calories ? '+' : '' }}{{ Math.round(avgNet - goals.calories) }}
              </div>
              <div class="text-caption opacity-75">ส่วนต่างจากเป้า (kcal)</div>
            </v-col>
          </v-row>
          <v-alert
            class="mt-3" density="compact" variant="tonal"
            :type="avgNet > goals.calories ? 'warning' : 'success'"
          >
            <template #text>
              <span v-if="avgNet > goals.calories">
                เฉลี่ยรับพลังงานสุทธิเกินเป้าหมาย {{ Math.round(avgNet - goals.calories) }} kcal/วัน
                — ลองเพิ่มการออกกำลังกายหรือลดปริมาณอาหาร
              </span>
              <span v-else>
                เฉลี่ยรับพลังงานสุทธิต่ำกว่าเป้าหมาย {{ Math.round(goals.calories - avgNet) }} kcal/วัน — กำลังดี!
              </span>
            </template>
          </v-alert>
        </v-card>
      </v-card>

    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { Bar, Line } from 'vue-chartjs'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js'
import { useNutritionStore } from '../stores/nutrition'

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const store = useNutritionStore()
const period = ref('7')
const loading = ref(false)
const foodSummary = ref([])
const actSummary = ref([])
const goals = computed(() => store.currentGoals)

// ── โหลดข้อมูล ──
async function loadReports() {
  loading.value = true
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - parseInt(period.value) + 1)
  const fmt = d => d.toISOString().split('T')[0]
  try {
    const data = await store.fetchSummary(fmt(start), fmt(end))
    foodSummary.value = data.foodSummary
    actSummary.value = data.actSummary
  } finally {
    loading.value = false
  }
}
onMounted(loadReports)
watch(period, loadReports)

// ── Helper: map actSummary by date ──
const actByDate = computed(() =>
  Object.fromEntries(actSummary.value.map(a => [a.date, a.totalCaloriesBurned || 0]))
)

// ── Table data: รับเข้า / เผาผลาญ / สุทธิ ──
const tableData = computed(() =>
  foodSummary.value.map(d => ({
    ...d,
    burned: actByDate.value[d.date] || 0,
    net: d.calories - (actByDate.value[d.date] || 0),
  })).slice().reverse()
)

const labels = computed(() => foodSummary.value.map(d => formatDate(d.date)))

// ── Averages ──
const days = computed(() => foodSummary.value.length || 1)
const avgCalories = computed(() => foodSummary.value.reduce((s, d) => s + d.calories, 0) / days.value)
const avgBurned   = computed(() => actSummary.value.reduce((s, a) => s + (a.totalCaloriesBurned || 0), 0) / days.value)
const avgNet      = computed(() => avgCalories.value - avgBurned.value)
const avgCarbs    = computed(() => foodSummary.value.reduce((s, d) => s + d.carbs, 0) / days.value)
const avgProtein  = computed(() => foodSummary.value.reduce((s, d) => s + d.protein, 0) / days.value)
const avgFat      = computed(() => foodSummary.value.reduce((s, d) => s + d.fat, 0) / days.value)

// ── Summary cards (top row) ──
const summaryCards = computed(() => {
  const g = goals.value
  const mkDiff = (avg, target) => {
    const diff = avg - target
    const pct = Math.abs(Math.round((diff / target) * 100))
    const over = diff > 0
    return { overGoal: over, diffLabel: `${over ? '+' : '-'}${pct}% จากเป้า` }
  }
  return [
    { label: 'แคลอรี่สุทธิเฉลี่ย', avg: `${Math.round(avgNet.value)} kcal`, color: '#2D6A4F', icon: 'mdi-fire', ...mkDiff(avgNet.value, g.calories) },
    { label: 'คาร์บเฉลี่ย',         avg: `${avgCarbs.value.toFixed(1)}g`,   color: '#F4A261', icon: 'mdi-grain',       ...mkDiff(avgCarbs.value, g.carbs) },
    { label: 'โปรตีนเฉลี่ย',        avg: `${avgProtein.value.toFixed(1)}g`, color: '#457B9D', icon: 'mdi-arm-flex',    ...mkDiff(avgProtein.value, g.protein) },
    { label: 'ไขมันเฉลี่ย',         avg: `${avgFat.value.toFixed(1)}g`,     color: '#E76F51', icon: 'mdi-oil',         ...mkDiff(avgFat.value, g.fat) },
  ]
})

// ── Calorie bar chart ──
const calorieChartData = computed(() => {
  if (!foodSummary.value.length) return null
  return {
    labels: labels.value,
    datasets: [
      {
        label: 'รับเข้า (kcal)',
        data: foodSummary.value.map(d => Math.round(d.calories)),
        backgroundColor: 'rgba(45,106,79,0.75)',
        borderRadius: 5,
        order: 2,
      },
      {
        label: 'เผาผลาญ (kcal)',
        data: foodSummary.value.map(d => Math.round(actByDate.value[d.date] || 0)),
        backgroundColor: 'rgba(244,162,97,0.75)',
        borderRadius: 5,
        order: 3,
      },
      {
        label: 'สุทธิ (kcal)',
        data: tableData.value.slice().reverse().map(d => Math.round(d.net)),
        type: 'line',
        borderColor: '#457B9D',
        backgroundColor: 'rgba(69,123,157,0.1)',
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: '#457B9D',
        tension: 0.3,
        fill: false,
        order: 1,
      },
      {
        label: 'เป้าหมาย',
        data: foodSummary.value.map(() => goals.value.calories),
        type: 'line',
        borderColor: '#E76F51',
        borderDash: [6, 4],
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
        order: 0,
      },
    ]
  }
})

// ── Macro line chart ──
const macroChartData = computed(() => {
  if (!foodSummary.value.length) return null
  return {
    labels: labels.value,
    datasets: [
      { label: 'คาร์บ (g)',    data: foodSummary.value.map(d => +d.carbs.toFixed(1)),   borderColor: '#F4A261', tension: 0.4, fill: false, pointRadius: 3 },
      { label: 'โปรตีน (g)',   data: foodSummary.value.map(d => +d.protein.toFixed(1)), borderColor: '#457B9D', tension: 0.4, fill: false, pointRadius: 3 },
      { label: 'ไขมัน (g)',    data: foodSummary.value.map(d => +d.fat.toFixed(1)),     borderColor: '#E76F51', tension: 0.4, fill: false, pointRadius: 3 },
    ]
  }
})

const barOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { position: 'top' }, tooltip: { mode: 'index', intersect: false } },
  scales: { y: { beginAtZero: true, title: { display: true, text: 'kcal' } } }
}
const lineOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { position: 'top' } },
  scales: { y: { beginAtZero: true } }
}

// ── Goal achievement (% ถูกต้อง) ──
const goalAchievement = computed(() => {
  const g = goals.value
  const n = days.value

  // วันที่ "บรรลุ" = net calories ≤ goal  (หักออกกำลังกายแล้ว)
  const netDays      = tableData.value.filter(d => d.net <= g.calories).length
  // วันที่คาร์บ ≤ เป้า
  const carbDays     = foodSummary.value.filter(d => d.carbs <= g.carbs).length
  // วันที่โปรตีน ≥ 80% ของเป้า (ควรได้ถึง ไม่ใช่ไม่เกิน)
  const proteinDays  = foodSummary.value.filter(d => d.protein >= g.protein * 0.8).length
  // วันที่ไขมัน ≤ เป้า
  const fatDays      = foodSummary.value.filter(d => d.fat <= g.fat).length

  const pct = (count) => n > 0 ? Math.round((count / n) * 100) : 0

  const mkStatus = (avg, target, isMin = false) => {
    if (isMin) return avg >= target * 0.8 ? 'ok' : 'low'
    return avg <= target ? 'ok' : 'over'
  }
  const statusLabel = (s) => s === 'ok' ? '✅ อยู่ในเกณฑ์ดี' : s === 'over' ? '⚠️ เกินเป้าหมาย' : '⬇️ ต่ำกว่าเป้าหมาย'

  return [
    {
      key: 'calories', label: 'แคลอรี่สุทธิ',
      avg: `${Math.round(avgNet.value)} kcal`,
      target: `${g.calories} kcal`,
      achieved: pct(netDays),
      color: '#2D6A4F',
      status: mkStatus(avgNet.value, g.calories),
      statusLabel: statusLabel(mkStatus(avgNet.value, g.calories)),
    },
    {
      key: 'carbs', label: 'คาร์บ',
      avg: `${avgCarbs.value.toFixed(0)}g`,
      target: `${g.carbs}g`,
      achieved: pct(carbDays),
      color: '#F4A261',
      status: mkStatus(avgCarbs.value, g.carbs),
      statusLabel: statusLabel(mkStatus(avgCarbs.value, g.carbs)),
    },
    {
      key: 'protein', label: 'โปรตีน',
      avg: `${avgProtein.value.toFixed(0)}g`,
      target: `${g.protein}g`,
      achieved: pct(proteinDays),
      color: '#457B9D',
      status: mkStatus(avgProtein.value, g.protein, true),
      statusLabel: statusLabel(mkStatus(avgProtein.value, g.protein, true)),
    },
    {
      key: 'fat', label: 'ไขมัน',
      avg: `${avgFat.value.toFixed(0)}g`,
      target: `${g.fat}g`,
      achieved: pct(fatDays),
      color: '#E76F51',
      status: mkStatus(avgFat.value, g.fat),
      statusLabel: statusLabel(mkStatus(avgFat.value, g.fat)),
    },
  ]
})

// ── Table headers ──
const tableHeaders = [
  { title: 'วันที่',              key: 'date',          sortable: true },
  { title: 'รับเข้า (kcal)',      key: 'calories',      sortable: true },
  { title: 'เผาผลาญ (kcal)',     key: 'burned',        sortable: true },
  { title: 'สุทธิ (kcal)',        key: 'net',           sortable: true },
  { title: 'คาร์บ (g)',          key: 'carbs',         sortable: true },
  { title: 'โปรตีน (g)',         key: 'protein',       sortable: true },
  { title: 'ไขมัน (g)',          key: 'fat',           sortable: true },
  { title: 'น้ำตาล (g)',         key: 'sugar',         sortable: true },
  { title: 'โซเดียม (mg)',       key: 'sodium',        sortable: true },
]

function formatDate(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })
}
</script>

<style scoped>
.goal-check-card { background: rgba(0,0,0,0.025); }
</style>
