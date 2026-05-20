<template>
  <div>
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-6 flex-wrap gap-3">
      <div>
        <h1 class="font-heading text-h5 font-weight-bold">แดชบอร์ด</h1>
        <p class="text-medium-emphasis text-body-2 mt-1">ภาพรวมสุขภาพและโภชนาการวันนี้</p>
      </div>
      <v-text-field
        v-model="selectedDate" type="date"
        density="compact" hide-details style="max-width: 180px"
        prepend-inner-icon="mdi-calendar"
        @update:model-value="onDateChange"
      />
    </div>

    <!-- Calorie Summary Row -->
    <v-row class="mb-4">
      <v-col cols="6" sm="3" v-for="stat in calorieSats" :key="stat.label">
        <v-card class="stat-card pa-4 text-center" :style="{ borderTop: `3px solid ${stat.color}` }">
          <v-icon :color="stat.color" class="mb-2">{{ stat.icon }}</v-icon>
          <div class="text-h5 font-weight-bold font-heading" :style="{ color: stat.color }">
            {{ stat.value.toLocaleString() }}
          </div>
          <div class="text-caption text-medium-emphasis">{{ stat.label }}</div>
          <div class="text-caption font-weight-medium">kcal</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Nutrient Progress -->
    <v-card class="mb-4 pa-5">
      <h3 class="font-heading text-subtitle-1 font-weight-semibold mb-4">
        <v-icon color="primary" class="mr-2">mdi-nutrition</v-icon>
        สารอาหารประจำวัน
      </h3>
      <v-row>
        <v-col cols="12" md="6">
          <div class="mb-4" v-for="n in mainNutrients" :key="n.key">
            <div class="d-flex justify-space-between align-center mb-1">
              <div class="d-flex align-center gap-2">
                <div :style="{ width: '10px', height: '10px', borderRadius: '50%', background: n.color }" />
                <span class="text-body-2 font-weight-medium">{{ n.label }}</span>
              </div>
              <div class="text-body-2">
                <span class="font-weight-bold">{{ summary[n.key].toFixed(1) }}</span>
                <span class="text-medium-emphasis"> / {{ goals[n.key] }} {{ n.unit }}</span>
              </div>
            </div>
            <div class="nutrient-bar">
              <div class="nutrient-bar-fill" :style="{
                width: Math.min(100, (summary[n.key] / goals[n.key]) * 100) + '%',
                background: n.color,
                opacity: summary[n.key] > goals[n.key] ? 1 : 0.8
              }" />
            </div>
            <div v-if="summary[n.key] > goals[n.key]" class="text-caption text-error mt-1">
              เกินเป้าหมาย {{ (summary[n.key] - goals[n.key]).toFixed(1) }} {{ n.unit }}
            </div>
          </div>
        </v-col>

        <v-col cols="12" md="6">
          <div v-if="hasMacros">
            <div class="text-center mb-2">
              <Doughnut :data="macroChartData" :options="doughnutOptions" style="max-height: 200px" />
            </div>
            <div class="d-flex justify-center gap-4 flex-wrap">
              <div v-for="m in macros" :key="m.key" class="text-center">
                <div class="text-caption" :style="{ color: m.color }">{{ m.label }}</div>
                <div class="text-body-2 font-weight-bold">{{ summary[m.key].toFixed(0) }}g</div>
                <div class="text-caption text-medium-emphasis">{{ macroPercent(m.key) }}%</div>
              </div>
            </div>
          </div>
          <div v-else class="d-flex align-center justify-center text-medium-emphasis" style="min-height: 180px">
            <div class="text-center">
              <v-icon size="48" color="grey-lighten-2">mdi-chart-pie-outline</v-icon>
              <p class="text-body-2 mt-2">ยังไม่มีข้อมูลอาหารวันนี้</p>
            </div>
          </div>
        </v-col>
      </v-row>
    </v-card>

    <!-- Extra nutrients -->
    <v-card class="mb-4 pa-5">
      <h3 class="font-heading text-subtitle-1 font-weight-semibold mb-4">
        <v-icon color="primary" class="mr-2">mdi-flask-outline</v-icon>
        สารอาหารเพิ่มเติม
      </h3>
      <v-row>
        <v-col cols="6" sm="3" v-for="n in extraNutrients" :key="n.key">
          <div class="extra-nutrient-card pa-3 text-center rounded-lg">
            <v-icon :color="n.color" size="28">{{ n.icon }}</v-icon>
            <div class="text-h6 font-weight-bold mt-1">{{ summary[n.key].toFixed(0) }}</div>
            <div class="text-caption">{{ n.label }}</div>
            <div class="text-caption text-medium-emphasis">เป้า: {{ goals[n.key] }} {{ n.unit }}</div>
            <v-progress-linear
              :model-value="Math.min(100, (summary[n.key] / goals[n.key]) * 100)"
              :color="summary[n.key] > goals[n.key] ? 'error' : n.color"
              height="4" rounded class="mt-2"
            />
          </div>
        </v-col>
      </v-row>
    </v-card>

    <!-- Meals + Activity Summary -->
    <v-row>
      <v-col cols="12" md="7">
        <v-card class="pa-5">
          <h3 class="font-heading text-subtitle-1 font-weight-semibold mb-4">
            <v-icon color="primary" class="mr-2">mdi-food</v-icon>
            สรุปมื้ออาหาร
          </h3>
          <v-row>
            <v-col cols="6" v-for="meal in mealSummaries" :key="meal.value">
              <div :class="`meal-card pa-3 rounded-lg meal-${meal.value}`">
                <div class="d-flex align-center gap-2 mb-2">
                  <v-icon :color="meal.color" size="20">{{ meal.icon }}</v-icon>
                  <span class="text-body-2 font-weight-medium">{{ meal.label }}</span>
                </div>
                <div class="text-h6 font-weight-bold">{{ meal.calories }} <span class="text-caption text-medium-emphasis">kcal</span></div>
                <div class="text-caption text-medium-emphasis">{{ meal.logs.length }} รายการ</div>
              </div>
            </v-col>
          </v-row>
        </v-card>
      </v-col>

      <v-col cols="12" md="5">
        <v-card class="pa-5 fill-height">
          <h3 class="font-heading text-subtitle-1 font-weight-semibold mb-4">
            <v-icon color="primary" class="mr-2">mdi-fire</v-icon>
            การออกกำลังกาย
          </h3>
          <div v-if="activities.length === 0" class="text-center py-4">
            <v-icon size="40" color="grey-lighten-2">mdi-run-fast</v-icon>
            <p class="text-body-2 text-medium-emphasis mt-2">ยังไม่มีกิจกรรมวันนี้</p>
            <v-btn size="small" color="primary" variant="tonal" to="/activity" class="mt-2">
              เพิ่มกิจกรรม
            </v-btn>
          </div>
          <div v-else>
            <div v-for="act in activities" :key="act.id" class="activity-row d-flex align-center gap-3 mb-3">
              <div class="activity-icon-wrap">
                <v-icon color="orange" size="20">mdi-fire</v-icon>
              </div>
              <div class="flex-grow-1">
                <div class="text-body-2 font-weight-medium">{{ act.name }}</div>
                <div class="text-caption text-medium-emphasis">{{ act.duration }} นาที</div>
              </div>
              <div class="text-body-2 font-weight-bold text-orange">-{{ act.caloriesBurned }} kcal</div>
            </div>
            <v-divider class="my-3" />
            <div class="d-flex justify-space-between">
              <span class="text-body-2 text-medium-emphasis">รวมเผาผลาญ</span>
              <span class="text-body-1 font-weight-bold text-orange">{{ totalBurned.toLocaleString() }} kcal</span>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { useNutritionStore } from '../stores/nutrition'

ChartJS.register(ArcElement, Tooltip, Legend)

const store = useNutritionStore()
const selectedDate = computed({ get: () => store.selectedDate, set: v => store.setDate(v) })
const summary = computed(() => store.dailySummary)
const goals = computed(() => store.currentGoals)
const activities = computed(() => store.todayActivities)
const totalBurned = computed(() => store.totalBurned)
const netCalories = computed(() => store.netCalories)

function onDateChange() { store.fetchAll() }

const calorieSats = computed(() => [
  { label: 'รับเข้า', value: summary.value.calories, color: '#2D6A4F', icon: 'mdi-food' },
  { label: 'เผาผลาญ', value: totalBurned.value, color: '#F4A261', icon: 'mdi-fire' },
  { label: 'สุทธิ', value: netCalories.value, color: netCalories.value > goals.value.calories ? '#E76F51' : '#457B9D', icon: 'mdi-scale-balance' },
  { label: 'เป้าหมาย', value: goals.value.calories, color: '#52B788', icon: 'mdi-bullseye' },
])

const mainNutrients = [
  { key: 'calories', label: 'พลังงาน', unit: 'kcal', color: '#2D6A4F' },
  { key: 'carbs', label: 'คาร์โบไฮเดรต', unit: 'g', color: '#F4A261' },
  { key: 'protein', label: 'โปรตีน', unit: 'g', color: '#457B9D' },
  { key: 'fat', label: 'ไขมัน', unit: 'g', color: '#E76F51' },
]

const macros = [
  { key: 'carbs', label: 'คาร์บ', color: '#F4A261' },
  { key: 'protein', label: 'โปรตีน', color: '#457B9D' },
  { key: 'fat', label: 'ไขมัน', color: '#E76F51' },
]

const extraNutrients = [
  { key: 'sugar', label: 'น้ำตาล', unit: 'g', color: '#E9C46A', icon: 'mdi-sugar' },
  { key: 'sodium', label: 'โซเดียม', unit: 'mg', color: '#A8DADC', icon: 'mdi-water-outline' },
  { key: 'cholesterol', label: 'คอเลสเตอรอล', unit: 'mg', color: '#E76F51', icon: 'mdi-heart-pulse' },
  { key: 'fat', label: 'ไขมัน', unit: 'g', color: '#E76F51', icon: 'mdi-oil' },
]

const hasMacros = computed(() => summary.value.carbs + summary.value.protein + summary.value.fat > 0)

const macroChartData = computed(() => ({
  labels: ['คาร์บ', 'โปรตีน', 'ไขมัน'],
  datasets: [{
    data: [summary.value.carbs * 4, summary.value.protein * 4, summary.value.fat * 9],
    backgroundColor: ['#F4A261', '#457B9D', '#E76F51'],
    borderWidth: 0,
  }]
}))

const doughnutOptions = {
  plugins: { legend: { display: false } },
  cutout: '65%',
  responsive: true,
  maintainAspectRatio: true,
}

function macroPercent(key) {
  const total = summary.value.carbs * 4 + summary.value.protein * 4 + summary.value.fat * 9
  if (!total) return 0
  const val = key === 'carbs' ? summary.value.carbs * 4 : key === 'protein' ? summary.value.protein * 4 : summary.value.fat * 9
  return Math.round((val / total) * 100)
}

const mealSummaries = computed(() => Object.values(store.mealSummary))
</script>

<style scoped>
.extra-nutrient-card { background: rgba(0,0,0,0.025); }
.activity-icon-wrap {
  width: 36px; height: 36px; border-radius: 10px;
  background: rgba(244, 162, 97, 0.1);
  display: flex; align-items: center; justify-content: center;
}
</style>
