<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6 flex-wrap gap-3">
      <div>
        <h1 class="font-heading text-h5 font-weight-bold">กิจกรรมออกกำลังกาย</h1>
        <p class="text-medium-emphasis text-body-2">บันทึกการออกกำลังกายและการเผาผลาญพลังงาน</p>
      </div>
      <div class="d-flex align-center gap-3">
        <v-text-field
          v-model="selectedDate" type="date"
          density="compact" hide-details style="max-width: 180px"
          prepend-inner-icon="mdi-calendar"
          @update:model-value="store.fetchAll()"
        />
        <v-btn color="primary" @click="dialog = true">
          <v-icon start>mdi-plus</v-icon> เพิ่มกิจกรรม
        </v-btn>
      </div>
    </div>

    <!-- Summary cards -->
    <v-row class="mb-5">
      <v-col cols="6" sm="3" v-for="s in summaryCards" :key="s.label">
        <v-card class="stat-card pa-4 text-center">
          <v-icon :color="s.color" size="28" class="mb-1">{{ s.icon }}</v-icon>
          <div class="text-h5 font-weight-bold font-heading" :style="{ color: s.color }">{{ s.value }}</div>
          <div class="text-caption text-medium-emphasis">{{ s.label }}</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Activity List + Chart -->
    <v-row>
      <v-col cols="12" md="7">
        <v-card class="pa-5">
          <h3 class="font-heading text-subtitle-1 font-weight-semibold mb-4">
            <v-icon color="primary" class="mr-2">mdi-run</v-icon>
            รายการกิจกรรมวันนี้
          </h3>

          <div v-if="activities.length === 0" class="text-center py-8">
            <v-icon size="64" color="grey-lighten-2">mdi-run-fast</v-icon>
            <p class="text-body-1 text-medium-emphasis mt-3">ยังไม่มีกิจกรรมวันนี้</p>
            <p class="text-body-2 text-medium-emphasis">เริ่มบันทึกการออกกำลังกายของคุณ!</p>
          </div>

          <v-data-table
            v-else
            :items="activities"
            :headers="headers"
            density="comfortable"
            hide-default-footer
            class="data-table"
          >
            <template #item.type="{ item }">
              <v-chip size="small" :color="typeColor(item.type)" variant="tonal">
                {{ item.type }}
              </v-chip>
            </template>
            <template #item.intensity="{ item }">
              <v-chip size="x-small" :color="intensityColor(item.intensity)" variant="tonal">
                {{ intensityLabel(item.intensity) }}
              </v-chip>
            </template>
            <template #item.duration="{ item }">
              {{ item.duration }} นาที
            </template>
            <template #item.caloriesBurned="{ item }">
              <span class="text-orange font-weight-bold">{{ item.caloriesBurned }}</span>
            </template>
            <template #item.actions="{ item }">
              <v-btn icon size="x-small" color="error" variant="text" @click="deleteActivity(item.id)">
                <v-icon>mdi-delete-outline</v-icon>
              </v-btn>
            </template>
            <template #bottom />
          </v-data-table>
        </v-card>
      </v-col>

      <v-col cols="12" md="5">
        <v-card class="pa-5">
          <h3 class="font-heading text-subtitle-1 font-weight-semibold mb-4">
            <v-icon color="primary" class="mr-2">mdi-chart-donut</v-icon>
            การเผาผลาญตามประเภท
          </h3>
          <div v-if="activities.length > 0">
            <Doughnut :data="activityChartData" :options="chartOptions" style="max-height: 220px" />
            <div class="mt-4">
              <div v-for="(item, idx) in chartLegend" :key="item.name" class="d-flex align-center gap-2 mb-2">
                <div :style="{ width: '12px', height: '12px', borderRadius: '3px', background: chartColors[idx % chartColors.length] }" />
                <span class="text-body-2 flex-grow-1">{{ item.name }}</span>
                <span class="text-body-2 font-weight-bold text-orange">{{ item.calories }} kcal</span>
              </div>
            </div>
          </div>
          <div v-else class="d-flex align-center justify-center py-8 text-medium-emphasis">
            <div class="text-center">
              <v-icon size="48" color="grey-lighten-2">mdi-chart-donut</v-icon>
              <p class="text-body-2 mt-2">ยังไม่มีข้อมูล</p>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Add Activity Dialog -->
    <v-dialog v-model="dialog" max-width="500">
      <v-card>
        <v-card-title class="font-heading pa-5 pb-3">
          <v-icon color="primary" class="mr-2">mdi-run-fast</v-icon>
          เพิ่มกิจกรรมออกกำลังกาย
        </v-card-title>
        <v-card-text class="pa-5 pt-2">
          <v-row>
            <v-col cols="12">
              <v-autocomplete
                v-model="form.name"
                :items="presetActivities"
                item-title="name"
                label="ชื่อกิจกรรม"
                prepend-inner-icon="mdi-run"
                @update:model-value="fillPreset"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-select v-model="form.type" :items="activityTypes" label="ประเภท" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-select v-model="form.intensity" :items="intensities" item-title="label" item-value="value" label="ความเข้มข้น" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model.number="form.duration" label="ระยะเวลา" suffix="นาที" type="number" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model.number="form.caloriesBurned" label="แคลอรี่เผาผลาญ" suffix="kcal" type="number" />
            </v-col>
            <v-col cols="12">
              <v-textarea v-model="form.notes" label="บันทึกเพิ่มเติม" rows="2" />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="pa-5 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">ยกเลิก</v-btn>
          <v-btn color="primary" :loading="saving" @click="save" :disabled="!form.name">
            <v-icon start>mdi-content-save</v-icon> บันทึก
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { useNutritionStore } from '../stores/nutrition'

ChartJS.register(ArcElement, Tooltip, Legend)

const store = useNutritionStore()
const selectedDate = computed({ get: () => store.selectedDate, set: v => store.setDate(v) })
const activities = computed(() => store.todayActivities)
const dialog = ref(false)
const saving = ref(false)

const emptyForm = () => ({ name: '', type: 'คาร์ดิโอ', duration: 30, caloriesBurned: 0, intensity: 'medium', notes: '' })
const form = ref(emptyForm())

const activityTypes = ['คาร์ดิโอ', 'ฝึกน้ำหนัก', 'ยืดเส้น/โยคะ', 'กีฬาทีม', 'ว่ายน้ำ', 'ปั่นจักรยาน', 'อื่นๆ']
const intensities = [
  { value: 'low', label: 'เบา' },
  { value: 'medium', label: 'ปานกลาง' },
  { value: 'high', label: 'หนัก' },
]

const presetActivities = [
  { name: 'วิ่ง 5 กม.', type: 'คาร์ดิโอ', duration: 30, caloriesBurned: 300, intensity: 'medium' },
  { name: 'เดินเร็ว', type: 'คาร์ดิโอ', duration: 45, caloriesBurned: 180, intensity: 'low' },
  { name: 'ว่ายน้ำ', type: 'ว่ายน้ำ', duration: 45, caloriesBurned: 350, intensity: 'medium' },
  { name: 'ยกน้ำหนัก', type: 'ฝึกน้ำหนัก', duration: 60, caloriesBurned: 250, intensity: 'high' },
  { name: 'ปั่นจักรยาน', type: 'ปั่นจักรยาน', duration: 60, caloriesBurned: 400, intensity: 'medium' },
  { name: 'โยคะ', type: 'ยืดเส้น/โยคะ', duration: 60, caloriesBurned: 150, intensity: 'low' },
  { name: 'เต้นแอโรบิก', type: 'คาร์ดิโอ', duration: 45, caloriesBurned: 280, intensity: 'high' },
  { name: 'HIIT', type: 'คาร์ดิโอ', duration: 20, caloriesBurned: 300, intensity: 'high' },
]

function fillPreset(name) {
  const preset = presetActivities.find(p => p.name === name)
  if (preset) Object.assign(form.value, preset)
}

const summaryCards = computed(() => [
  { label: 'กิจกรรมทั้งหมด', value: activities.value.length, color: '#2D6A4F', icon: 'mdi-run-fast' },
  { label: 'เวลารวม (นาที)', value: activities.value.reduce((s, a) => s + a.duration, 0), color: '#457B9D', icon: 'mdi-clock-outline' },
  { label: 'แคลอรี่เผาผลาญ', value: store.totalBurned, color: '#E76F51', icon: 'mdi-fire' },
  { label: 'แคลอรี่สุทธิ', value: store.netCalories, color: store.netCalories > store.currentGoals.calories ? '#E76F51' : '#52B788', icon: 'mdi-scale-balance' },
])

const headers = [
  { title: 'กิจกรรม', key: 'name' },
  { title: 'ประเภท', key: 'type' },
  { title: 'ความเข้มข้น', key: 'intensity' },
  { title: 'เวลา', key: 'duration' },
  { title: 'เผาผลาญ (kcal)', key: 'caloriesBurned' },
  { title: '', key: 'actions', width: 50 },
]

const chartColors = ['#2D6A4F', '#F4A261', '#457B9D', '#E76F51', '#52B788', '#E9C46A']

const chartLegend = computed(() => {
  const byName = {}
  activities.value.forEach(a => {
    byName[a.name] = (byName[a.name] || 0) + a.caloriesBurned
  })
  return Object.entries(byName).map(([name, calories]) => ({ name, calories }))
})

const activityChartData = computed(() => ({
  labels: chartLegend.value.map(c => c.name),
  datasets: [{
    data: chartLegend.value.map(c => c.calories),
    backgroundColor: chartColors,
    borderWidth: 0,
  }]
}))

const chartOptions = {
  plugins: { legend: { display: false } },
  cutout: '60%',
  responsive: true,
  maintainAspectRatio: true,
}

function typeColor(type) {
  const map = { 'คาร์ดิโอ': 'orange', 'ฝึกน้ำหนัก': 'blue', 'ยืดเส้น/โยคะ': 'green', 'ว่ายน้ำ': 'cyan', 'ปั่นจักรยาน': 'purple' }
  return map[type] || 'grey'
}

function intensityColor(v) { return v === 'high' ? 'error' : v === 'low' ? 'success' : 'warning' }
function intensityLabel(v) { return v === 'high' ? 'หนัก' : v === 'low' ? 'เบา' : 'ปานกลาง' }

async function save() {
  saving.value = true
  try {
    await store.addActivity(form.value)
    dialog.value = false
    form.value = emptyForm()
  } finally {
    saving.value = false
  }
}

async function deleteActivity(id) {
  await store.deleteActivity(id)
}
</script>
