<template>
  <div>
    <div class="mb-6">
      <h1 class="font-heading text-h5 font-weight-bold">เป้าหมายโภชนาการ</h1>
      <p class="text-medium-emphasis text-body-2">ตั้งค่าเป้าหมายสารอาหารประจำวัน</p>
    </div>

    <v-row>
      <v-col cols="12" md="7">
        <v-card class="pa-6">
          <h3 class="font-heading text-subtitle-1 font-weight-semibold mb-5">
            <v-icon color="primary" class="mr-2">mdi-bullseye-arrow</v-icon>
            ตั้งค่าเป้าหมาย
          </h3>

          <v-alert type="info" variant="tonal" class="mb-5" density="compact">
            <template #text>
              เป้าหมายแนะนำสำหรับผู้ใหญ่ทั่วไป พลังงาน 2,000 kcal/วัน ปรับตามน้ำหนัก กิจกรรม และเป้าหมายสุขภาพของคุณ
            </template>
          </v-alert>

          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model.number="form.calories"
                label="พลังงาน (แคลอรี่)" suffix="kcal"
                type="number" prepend-inner-icon="mdi-fire"
                hint="แนะนำ: 1500-2500 kcal" persistent-hint
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model.number="form.carbs"
                label="คาร์โบไฮเดรต" suffix="g"
                type="number" prepend-inner-icon="mdi-grain"
                hint="แนะนำ: 45-65% ของแคลอรี่" persistent-hint
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model.number="form.protein"
                label="โปรตีน" suffix="g"
                type="number" prepend-inner-icon="mdi-arm-flex-outline"
                hint="แนะนำ: 10-35% ของแคลอรี่" persistent-hint
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model.number="form.fat"
                label="ไขมัน" suffix="g"
                type="number" prepend-inner-icon="mdi-oil"
                hint="แนะนำ: 20-35% ของแคลอรี่" persistent-hint
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field
                v-model.number="form.sugar"
                label="น้ำตาล" suffix="g"
                type="number" prepend-inner-icon="mdi-sugar"
                hint="ไม่เกิน 50g" persistent-hint
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field
                v-model.number="form.sodium"
                label="โซเดียม" suffix="mg"
                type="number" prepend-inner-icon="mdi-water-outline"
                hint="ไม่เกิน 2300mg" persistent-hint
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field
                v-model.number="form.cholesterol"
                label="คอเลสเตอรอล" suffix="mg"
                type="number" prepend-inner-icon="mdi-heart-pulse"
                hint="ไม่เกิน 300mg" persistent-hint
              />
            </v-col>
          </v-row>

          <div class="d-flex gap-3 mt-4">
            <v-btn color="primary" :loading="saving" @click="save">
              <v-icon start>mdi-content-save</v-icon> บันทึกเป้าหมาย
            </v-btn>
            <v-btn variant="tonal" @click="resetDefaults">
              <v-icon start>mdi-restore</v-icon> ค่าเริ่มต้น
            </v-btn>
          </div>

          <v-snackbar v-model="saved" color="success" timeout="3000">
            <v-icon class="mr-2">mdi-check-circle</v-icon> บันทึกเป้าหมายสำเร็จ!
          </v-snackbar>
        </v-card>
      </v-col>

      <v-col cols="12" md="5">
        <!-- Macro breakdown preview -->
        <v-card class="pa-5 mb-4">
          <h3 class="font-heading text-subtitle-1 font-weight-semibold mb-4">
            <v-icon color="primary" class="mr-2">mdi-chart-pie</v-icon>
            สัดส่วนพลังงาน
          </h3>
          <Doughnut :data="doughnutData" :options="doughnutOptions" style="max-height: 200px" />
          <div class="mt-4">
            <div v-for="m in macroBreakdown" :key="m.label" class="d-flex align-center gap-2 mb-2">
              <div :style="{ width: '12px', height: '12px', borderRadius: '3px', background: m.color }" />
              <span class="text-body-2 flex-grow-1">{{ m.label }}</span>
              <span class="text-body-2 font-weight-bold">{{ m.pct }}%</span>
              <span class="text-caption text-medium-emphasis">({{ m.kcal }} kcal)</span>
            </div>
          </div>
        </v-card>

        <!-- Reference guide -->
        <v-card class="pa-5">
          <h3 class="font-heading text-subtitle-1 font-weight-semibold mb-3">
            <v-icon color="primary" class="mr-2">mdi-information-outline</v-icon>
            แนวทางอ้างอิง WHO
          </h3>
          <v-list density="compact">
            <v-list-item v-for="guide in guidelines" :key="guide.label" :subtitle="guide.desc">
              <template #prepend>
                <v-icon :color="guide.color" size="18" class="mr-2">{{ guide.icon }}</v-icon>
              </template>
              <template #title>
                <span class="text-body-2 font-weight-medium">{{ guide.label }}</span>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { useNutritionStore } from '../stores/nutrition'

ChartJS.register(ArcElement, Tooltip, Legend)

const store = useNutritionStore()
const saving = ref(false)
const saved = ref(false)

const defaults = { calories: 2000, carbs: 250, protein: 50, fat: 65, sugar: 50, sodium: 2300, cholesterol: 300 }
const form = ref({ ...defaults })

onMounted(() => {
  if (store.goals) Object.assign(form.value, store.goals)
})

function resetDefaults() { form.value = { ...defaults } }

async function save() {
  saving.value = true
  try {
    await store.saveGoals(form.value)
    saved.value = true
  } finally {
    saving.value = false
  }
}

const carbsKcal = computed(() => form.value.carbs * 4)
const proteinKcal = computed(() => form.value.protein * 4)
const fatKcal = computed(() => form.value.fat * 9)
const totalMacroKcal = computed(() => carbsKcal.value + proteinKcal.value + fatKcal.value || 1)

const macroBreakdown = computed(() => [
  { label: 'คาร์โบไฮเดรต', kcal: carbsKcal.value, pct: Math.round((carbsKcal.value / totalMacroKcal.value) * 100), color: '#F4A261' },
  { label: 'โปรตีน', kcal: proteinKcal.value, pct: Math.round((proteinKcal.value / totalMacroKcal.value) * 100), color: '#457B9D' },
  { label: 'ไขมัน', kcal: fatKcal.value, pct: Math.round((fatKcal.value / totalMacroKcal.value) * 100), color: '#E76F51' },
])

const doughnutData = computed(() => ({
  labels: ['คาร์บ', 'โปรตีน', 'ไขมัน'],
  datasets: [{ data: [carbsKcal.value, proteinKcal.value, fatKcal.value], backgroundColor: ['#F4A261', '#457B9D', '#E76F51'], borderWidth: 0 }]
}))
const doughnutOptions = { plugins: { legend: { display: false } }, cutout: '65%', responsive: true, maintainAspectRatio: true }

const guidelines = [
  { label: 'พลังงาน', desc: '2000 kcal สำหรับผู้ใหญ่', color: 'primary', icon: 'mdi-fire' },
  { label: 'คาร์โบไฮเดรต', desc: '45-65% ของพลังงานทั้งหมด', color: 'orange', icon: 'mdi-grain' },
  { label: 'โปรตีน', desc: '10-35% หรือ 0.8-1.2g/kg น้ำหนัก', color: 'blue', icon: 'mdi-arm-flex-outline' },
  { label: 'ไขมัน', desc: '20-35% ของพลังงานทั้งหมด', color: 'red', icon: 'mdi-oil' },
  { label: 'น้ำตาล', desc: 'ไม่เกิน 10% (ประมาณ 50g)', color: 'amber', icon: 'mdi-sugar' },
  { label: 'โซเดียม', desc: 'ไม่เกิน 2,300mg ต่อวัน', color: 'cyan', icon: 'mdi-water-outline' },
  { label: 'คอเลสเตอรอล', desc: 'ไม่เกิน 300mg ต่อวัน', color: 'pink', icon: 'mdi-heart-pulse' },
]
</script>
