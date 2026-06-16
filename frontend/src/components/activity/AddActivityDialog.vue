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
                <v-btn color="primary" @click="openAdd">
                    <v-icon start>mdi-plus</v-icon> เพิ่มกิจกรรม
                </v-btn>
            </div>
        </div>

        <v-row class="mb-5">
            <v-col cols="6" sm="3" v-for="s in summaryCards" :key="s.label">
                <v-card class="stat-card pa-4 text-center">
                    <v-icon :color="s.color" size="28" class="mb-1">{{ s.icon }}</v-icon>
                    <div class="text-h5 font-weight-bold font-heading" :style="{ color: s.color }">{{ s.value }}</div>
                    <div class="text-caption text-medium-emphasis">{{ s.label }}</div>
                </v-card>
            </v-col>
        </v-row>

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
                        <v-card v-for="act in activities" :key="act.id" class="mb-3 pa-4 activity-item-card"
                            variant="outlined" rounded="lg">
                            <div class="d-flex align-start justify-space-between">
                                <div class="d-flex align-start gap-3 flex-grow-1">
                                    <div class="activity-icon-wrap mt-1">
                                        <v-icon color="orange" size="20">mdi-fire</v-icon>
                                    </div>
                                    <div class="flex-grow-1">
                                        <div class="text-body-1 font-weight-bold">{{ act.name }}</div>
                                        <div class="d-flex align-center gap-2 mt-1 flex-wrap">
                                            <v-chip size="x-small" :color="typeColor(act.type)" variant="tonal">{{
                                                act.type }}</v-chip>
                                            <v-chip size="x-small" :color="intensityColor(act.intensity)"
                                                variant="tonal">{{ intensityLabel(act.intensity) }}</v-chip>
                                            <span class="text-caption text-medium-emphasis">⏱ {{ act.duration }}
                                                นาที</span>
                                            <span class="text-caption text-orange font-weight-bold">🔥 {{
                                                act.caloriesBurned }} kcal</span>
                                        </div>
                                        <div v-if="act.notes" class="mt-2 pa-2 notes-box rounded">
                                            <div class="text-caption text-medium-emphasis font-weight-bold mb-1">
                                                <v-icon size="12"
                                                    class="mr-1">mdi-note-text-outline</v-icon>บันทึกรายละเอียด:
                                            </div>
                                            <div class="text-body-2" style="white-space: pre-wrap">{{ act.notes }}</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="d-flex gap-1 ml-2">
                                    <v-btn icon size="x-small" color="primary" variant="text" @click="openEdit(act)">
                                        <v-icon size="16">mdi-pencil-outline</v-icon>
                                    </v-btn>
                                    <v-btn icon size="x-small" color="error" variant="text" @click="openDelete(act)">
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
                            <div v-for="(item, idx) in chartLegend" :key="item.name"
                                class="d-flex align-center gap-2 mb-2">
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

        <!-- ── Components ── -->
        <AddActivityDialog v-model="addDialog" :item="editingItem" :edit-mode="editMode" :loading="saving"
            @save="handleSave" />
        <ConfirmDeleteDialog v-model="deleteDialog" :item-name="deletingItem?.name" :loading="deleting"
            @confirm="handleDelete" />
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { useNutritionStore } from '../stores/nutrition'
import api from '../plugins/axios'
import AddActivityDialog from '../components/activity/AddActivityDialog.vue'
import ConfirmDeleteDialog from '../components/common/ConfirmDeleteDialog.vue'

ChartJS.register(ArcElement, Tooltip, Legend)

const store = useNutritionStore()
onMounted(() => store.fetchAll())

const selectedDate = computed({ get: () => store.selectedDate, set: v => store.setDate(v) })
const activities = computed(() => store.todayActivities)

const addDialog = ref(false)
const editMode = ref(false)
const editingItem = ref(null)
const saving = ref(false)

function openAdd() {
    editMode.value = false
    editingItem.value = null
    addDialog.value = true
}

function openEdit(act) {
    editMode.value = true
    editingItem.value = act
    addDialog.value = true
}

async function handleSave(data) {
    saving.value = true
    try {
        if (editMode.value && editingItem.value) {
            await api.put(`/activities/${editingItem.value.id}`, data)
            const idx = store.activities.findIndex(a => a.id === editingItem.value.id)
            if (idx !== -1) store.activities[idx] = { ...store.activities[idx], ...data }
        } else {
            await store.addActivity(data)
        }
    } finally { saving.value = false }
}

const deleteDialog = ref(false)
const deletingItem = ref(null)
const deleting = ref(false)

function openDelete(act) {
    deletingItem.value = act
    deleteDialog.value = true
}

async function handleDelete() {
    deleting.value = true
    try {
        await store.deleteActivity(deletingItem.value.id)
        deleteDialog.value = false
        deletingItem.value = null
    } finally { deleting.value = false }
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
    activities.value.forEach(a => { byName[a.name] = (byName[a.name] || 0) + a.caloriesBurned })
    return Object.entries(byName).map(([name, calories]) => ({ name, calories }))
})
const activityChartData = computed(() => ({
    labels: chartLegend.value.map(c => c.name),
    datasets: [{ data: chartLegend.value.map(c => c.calories), backgroundColor: chartColors, borderWidth: 0 }]
}))
const chartOptions = { plugins: { legend: { display: false } }, cutout: '60%', responsive: true, maintainAspectRatio: true }

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