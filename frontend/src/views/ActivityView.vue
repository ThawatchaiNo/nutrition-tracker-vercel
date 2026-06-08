<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6 flex-wrap gap-3">
      <div>
        <h1 class="font-heading text-h5 font-weight-bold">กิจกรรมออกกำลังกาย</h1>
        <p class="text-medium-emphasis text-body-2">บันทึกการออกกำลังกายและการเผาผลาญพลังงาน</p>
      </div>
      <div class="d-flex align-center gap-3">
        <v-text-field v-model="selectedDate" type="date" density="compact" hide-details style="max-width: 180px"
          prepend-inner-icon="mdi-calendar" @update:model-value="store.fetchAll()" />
        <v-btn color="primary" @click="openDialog">
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
          </div>

          <div v-else>
            <v-card v-for="act in activities" :key="act.id" class="mb-3 pa-4 activity-item-card" variant="outlined"
              rounded="lg">
              <div class="d-flex align-start justify-space-between">
                <div class="d-flex align-start gap-3 flex-grow-1">
                  <div class="activity-icon-wrap mt-1">
                    <v-icon color="orange" size="20">mdi-fire</v-icon>
                  </div>
                  <div class="flex-grow-1">
                    <div class="text-body-1 font-weight-bold">{{ act.name }}</div>
                    <div class="d-flex align-center gap-2 mt-1 flex-wrap">
                      <v-chip size="x-small" :color="typeColor(act.type)" variant="tonal">{{ act.type }}</v-chip>
                      <v-chip size="x-small" :color="intensityColor(act.intensity)" variant="tonal">{{
                        intensityLabel(act.intensity) }}</v-chip>
                      <span class="text-caption text-medium-emphasis">⏱ {{ act.duration }} นาที</span>
                      <span class="text-caption text-orange font-weight-bold">🔥 {{ act.caloriesBurned }} kcal</span>
                    </div>
                    <!-- แสดง notes ถ้ามี -->
                    <div v-if="act.notes" class="mt-2 pa-2 notes-box rounded">
                      <div class="text-caption text-medium-emphasis font-weight-bold mb-1">
                        <v-icon size="12" class="mr-1">mdi-note-text-outline</v-icon>บันทึกรายละเอียด:
                      </div>
                      <div class="text-body-2" style="white-space: pre-wrap">{{ act.notes }}</div>
                    </div>
                  </div>
                </div>
                <div class="d-flex gap-1 ml-2">
                  <v-btn icon size="x-small" color="primary" variant="text" @click="openEditDialog(act)">
                    <v-icon size="16">mdi-pencil-outline</v-icon>
                  </v-btn>
                  <v-btn icon size="x-small" color="error" variant="text" @click="openConfirmDelete(act)">
                    <v-icon size="16">mdi-delete-outline</v-icon>
                  </v-btn>
                </div>
              </div>
            </v-card>
          </div>
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
                <div
                  :style="{ width: '12px', height: '12px', borderRadius: '3px', background: chartColors[idx % chartColors.length] }" />
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

    <!-- ── Add/Edit Activity Dialog ── -->
    <v-dialog v-model="dialog" max-width="540" persistent>
      <v-card>
        <v-card-title class="font-heading pa-5 pb-3">
          <v-icon color="primary" class="mr-2">mdi-run-fast</v-icon>
          {{ editMode ? 'แก้ไขกิจกรรม' : 'เพิ่มกิจกรรมออกกำลังกาย' }}
        </v-card-title>
        <v-card-text class="pa-5 pt-2">
          <v-row>
            <!-- ชื่อกิจกรรม — TextField กรอกเองได้เลย -->
            <v-col cols="12">
              <v-text-field v-model="form.name" label="ชื่อกิจกรรม *" prepend-inner-icon="mdi-run"
                placeholder="เช่น วิ่ง 5 กม., เล่นฟุตบอล, ว่ายน้ำ, โยคะ..." clearable />
              <!-- Preset chips ให้กดเลือกได้เร็ว -->
              <div class="d-flex flex-wrap gap-2 mt-1 mb-2">
                <v-chip v-for="p in presetNames" :key="p.name" size="small" variant="tonal" color="primary"
                  style="cursor:pointer" @click="fillPreset(p)">
                  {{ p.name }}
                </v-chip>
              </div>
            </v-col>

            <v-col cols="12" sm="6">
              <v-select v-model="form.type" :items="activityTypes" label="ประเภท" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-select v-model="form.intensity" :items="intensities" item-title="label" item-value="value"
                label="ความเข้มข้น" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model.number="form.duration" label="ระยะเวลา" suffix="นาที" type="number" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model.number="form.caloriesBurned" label="แคลอรี่เผาผลาญ" suffix="kcal" type="number" />
            </v-col>

            <!-- บันทึกเพิ่มเติม — textarea ขยายใหญ่ขึ้น เก็บรายละเอียดได้เยอะ -->
            <v-col cols="12">
              <v-textarea v-model="form.notes" label="บันทึกรายละเอียด"
                placeholder="เช่น วิ่งรอบสวน 3 รอบ + วิดพื้น 30 ครั้ง, เล่นฟุตบอลกับเพื่อน 5 คน ได้ 2 ประตู, ว่ายน้ำท่าฟรีสไตล์ 20 เลน..."
                rows="4" counter maxlength="1000" hint="บันทึกรายละเอียดว่าทำอะไรบ้าง เล่นอะไรบ้าง" persistent-hint />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="pa-5 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">ยกเลิก</v-btn>
          <v-btn color="primary" :loading="saving" @click="save" :disabled="!form.name">
            <v-icon start>mdi-content-save</v-icon>
            {{ editMode ? 'บันทึกการแก้ไข' : 'บันทึก' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>

  <!-- ── Confirm Delete Dialog ── -->
  <v-dialog v-model="confirmDialog" max-width="360" persistent>
    <v-card>
      <v-card-title class="font-heading pa-5 pb-3">
        <v-icon color="error" class="mr-2">mdi-alert-circle-outline</v-icon>
        ยืนยันการลบ
      </v-card-title>
      <v-card-text class="pa-5 pt-0">
        <p class="text-body-1">คุณต้องการลบกิจกรรม <strong>"{{ deletingItem?.name }}"</strong> ใช่ไหม?</p>
        <p class="text-body-2 text-medium-emphasis mt-2">การดำเนินการนี้ไม่สามารถเรียกคืนได้</p>
      </v-card-text>
      <v-card-actions class="pa-5 pt-0">
        <v-spacer />
        <v-btn variant="text" @click="confirmDialog = false">ยกเลิก</v-btn>
        <v-btn color="error" :loading="deleting" @click="confirmDelete">
          <v-icon start>mdi-delete-outline</v-icon> ลบ
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>


  <script setup>
import { ref, computed, onMounted } from 'vue'
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { useNutritionStore } from '../stores/nutrition'
import api from '../plugins/axios'

ChartJS.register(ArcElement, Tooltip, Legend)

const store = useNutritionStore()

onMounted(() => store.fetchAll())
const selectedDate = computed({ get: () => store.selectedDate, set: v => store.setDate(v) })
const activities = computed(() => store.todayActivities)
const dialog = ref(false)
const saving = ref(false)
const editMode = ref(false)
const editingId = ref(null)

const emptyForm = () => ({
  name: '', type: 'คาร์ดิโอ', duration: 30,
  caloriesBurned: 0, intensity: 'medium', notes: ''
})
const form = ref(emptyForm())

const activityTypes = ['คาร์ดิโอ', 'ฝึกน้ำหนัก', 'ยืดเส้น/โยคะ', 'กีฬาทีม', 'ว่ายน้ำ', 'ปั่นจักรยาน', 'อื่นๆ']
const intensities = [
  { value: 'low', label: 'เบา' },
  { value: 'medium', label: 'ปานกลาง' },
  { value: 'high', label: 'หนัก' },
]

// preset chips ให้กดเลือกได้เร็ว
const presetNames = [
  { name: 'วิ่ง', type: 'คาร์ดิโอ', duration: 30, caloriesBurned: 300, intensity: 'medium' },
  { name: 'เดินเร็ว', type: 'คาร์ดิโอ', duration: 45, caloriesBurned: 180, intensity: 'low' },
  { name: 'ว่ายน้ำ', type: 'ว่ายน้ำ', duration: 45, caloriesBurned: 350, intensity: 'medium' },
  { name: 'ยกน้ำหนัก', type: 'ฝึกน้ำหนัก', duration: 60, caloriesBurned: 250, intensity: 'high' },
  { name: 'ปั่นจักรยาน', type: 'ปั่นจักรยาน', duration: 60, caloriesBurned: 400, intensity: 'medium' },
  { name: 'โยคะ', type: 'ยืดเส้น/โยคะ', duration: 60, caloriesBurned: 150, intensity: 'low' },
  { name: 'HIIT', type: 'คาร์ดิโอ', duration: 20, caloriesBurned: 300, intensity: 'high' },
  { name: 'ฟุตบอล', type: 'กีฬาทีม', duration: 60, caloriesBurned: 450, intensity: 'high' },
  { name: 'บาสเกตบอล', type: 'กีฬาทีม', duration: 60, caloriesBurned: 400, intensity: 'high' },
  { name: 'เต้นแอโรบิก', type: 'คาร์ดิโอ', duration: 45, caloriesBurned: 280, intensity: 'medium' },
]

function fillPreset(p) {
  form.value.name = p.name
  form.value.type = p.type
  form.value.duration = p.duration
  form.value.caloriesBurned = p.caloriesBurned
  form.value.intensity = p.intensity
}

function openDialog() {
  editMode.value = false
  editingId.value = null
  form.value = emptyForm()
  dialog.value = true
}

function openEditDialog(act) {
  editMode.value = true
  editingId.value = act.id
  form.value = {
    name: act.name,
    type: act.type,
    duration: act.duration,
    caloriesBurned: act.caloriesBurned,
    intensity: act.intensity,
    notes: act.notes || '',
  }
  dialog.value = true
}

async function save() {
  saving.value = true
  try {
    if (editMode.value) {
      await api.put(`/activities/${editingId.value}`, form.value)
      const idx = store.activities.findIndex(a => a.id === editingId.value)
      if (idx !== -1) store.activities[idx] = { ...store.activities[idx], ...form.value }
    } else {
      await store.addActivity(form.value)
    }
    dialog.value = false
    form.value = emptyForm()
  } finally {
    saving.value = false
  }
}

const confirmDialog = ref(false)
const deletingItem = ref(null)
const deleting = ref(false)

function openConfirmDelete(act) {
  deletingItem.value = act
  confirmDialog.value = true
}

async function confirmDelete() {
  deleting.value = true
  try {
    await store.deleteActivity(deletingItem.value.id)
    confirmDialog.value = false
    deletingItem.value = null
  } finally {
    deleting.value = false
  }
}

async function deleteActivity(id) {
  await store.deleteActivity(id)
}

const summaryCards = computed(() => [
  { label: 'กิจกรรมทั้งหมด', value: activities.value.length, color: '#2D6A4F', icon: 'mdi-run-fast' },
  { label: 'เวลารวม (นาที)', value: activities.value.reduce((s, a) => s + a.duration, 0), color: '#457B9D', icon: 'mdi-clock-outline' },
  { label: 'แคลอรี่เผาผลาญ', value: store.totalBurned, color: '#E76F51', icon: 'mdi-fire' },
  { label: 'แคลอรี่สุทธิ', value: store.netCalories, color: store.netCalories > store.currentGoals.calories ? '#E76F51' : '#52B788', icon: 'mdi-scale-balance' },
])

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
  const map = { 'คาร์ดิโอ': 'orange', 'ฝึกน้ำหนัก': 'blue', 'ยืดเส้น/โยคะ': 'green', 'ว่ายน้ำ': 'cyan', 'ปั่นจักรยาน': 'purple', 'กีฬาทีม': 'red' }
  return map[type] || 'grey'
}
function intensityColor(v) { return v === 'high' ? 'error' : v === 'low' ? 'success' : 'warning' }
function intensityLabel(v) { return v === 'high' ? 'หนัก' : v === 'low' ? 'เบา' : 'ปานกลาง' }
</script>

  <style scoped>
    .activity-icon-wrap {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: rgba(244, 162, 97, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .activity-item-card {
      transition: box-shadow 0.2s;
    }

    .activity-item-card:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08) !important;
    }

    .notes-box {
      background: rgba(0, 0, 0, 0.03);
      border-left: 3px solid rgba(45, 106, 79, 0.3);
    }
  </style>
