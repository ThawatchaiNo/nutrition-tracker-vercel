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

    <v-card class="mb-5 pa-4" color="primary" theme="dark">
      <v-row align="center">
        <v-col v-for="s in summaryStats" :key="s.label" cols="6" sm="3" class="text-center">
          <div class="text-h6 font-weight-bold">{{ s.value }}</div>
          <div class="text-caption opacity-80">{{ s.label }}</div>
        </v-col>
      </v-row>
    </v-card>

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
          <v-btn size="small" :color="meal.color" variant="tonal" @click="openAdd(meal.value)">
            <v-icon start>mdi-plus</v-icon> เพิ่มอาหาร
          </v-btn>
        </v-card-title>
        <v-divider />
        <v-data-table v-if="mealLogs(meal.value).length > 0" :items="mealLogs(meal.value)" :headers="tableHeaders"
          density="compact" hide-default-footer class="data-table">
          <template #item.foodName="{ item }"><span class="font-weight-medium">{{ item.foodName }}</span></template>
          <template #item.quantity="{ item }">{{ item.quantity }}g</template>
          <template #item.calories="{ item }"><span class="text-primary font-weight-bold">{{ item.calories
              }}</span></template>
          <template #item.carbs="{ item }">{{ item.carbs?.toFixed(1) }}</template>
          <template #item.protein="{ item }">{{ item.protein?.toFixed(1) }}</template>
          <template #item.fat="{ item }">{{ item.fat?.toFixed(1) }}</template>
          <template #item.sugar="{ item }">{{ item.sugar?.toFixed(1) }}</template>
          <template #item.sodium="{ item }">{{ item.sodium?.toFixed(0) }}</template>
          <template #item.cholesterol="{ item }">{{ item.cholesterol?.toFixed(0) }}</template>
          <template #item.actions="{ item }">
            <div class="d-flex gap-1">
              <v-btn icon size="x-small" color="primary" variant="text" @click="openEdit(item)">
                <v-icon size="16">mdi-pencil-outline</v-icon>
              </v-btn>
              <v-btn icon size="x-small" color="error" variant="text" @click="openDelete(item)">
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

    <!-- ── Components ── -->
    <AddFoodDialog v-model="addDialog" :meal="activeMeal" :loading="saving" @save="handleSave" />
    <EditFoodDialog v-model="editDialog" :item="editingItem" :loading="editSaving" @save="handleEdit" />
    <ConfirmDeleteDialog v-model="deleteDialog" :item-name="deletingItem?.foodName" :loading="deleting"
      @confirm="handleDelete" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useNutritionStore } from '../stores/nutrition'
import api from '../plugins/axios'
import AddFoodDialog from '../components/food/AddFoodDialog.vue'
import EditFoodDialog from '../components/food/EditFoodDialog.vue'
import ConfirmDeleteDialog from '../components/common/ConfirmDeleteDialog.vue'

const store = useNutritionStore()
onMounted(() => store.fetchAll())

const selectedDate = computed({ get: () => store.selectedDate, set: v => store.setDate(v) })
const mealSummary = computed(() => store.mealSummary)
const mealTypes = computed(() => store.mealTypes)

const addDialog = ref(false)
const activeMeal = ref('breakfast')
const saving = ref(false)

function openAdd(meal) {
  activeMeal.value = meal
  addDialog.value = true
}

async function handleSave(data) {
  saving.value = true
  try { await store.addFoodLog({ ...data, date: store.selectedDate }) }
  finally { saving.value = false }
}

const editDialog = ref(false)
const editingItem = ref(null)
const editSaving = ref(false)

function openEdit(item) {
  editingItem.value = item
  editDialog.value = true
}

async function handleEdit(data) {
  editSaving.value = true
  try {
    await api.put(`/food-logs/${editingItem.value.id}`, data)
    const idx = store.foodLogs.findIndex(l => l.id === editingItem.value.id)
    if (idx !== -1) store.foodLogs[idx] = { ...store.foodLogs[idx], ...data }
    editDialog.value = false
  } finally { editSaving.value = false }
}

const deleteDialog = ref(false)
const deletingItem = ref(null)
const deleting = ref(false)

function openDelete(item) {
  deletingItem.value = item
  deleteDialog.value = true
}

async function handleDelete() {
  deleting.value = true
  try {
    await store.deleteFoodLog(deletingItem.value.id)
    deleteDialog.value = false
    deletingItem.value = null
  } finally { deleting.value = false }
}

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
</script>

<style scoped>
.meal-total {
  background: rgba(0, 0, 0, 0.025);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}
</style>