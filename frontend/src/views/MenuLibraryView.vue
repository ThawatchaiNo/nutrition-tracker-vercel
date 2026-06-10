<template>
    <div>
        <div class="d-flex align-center justify-space-between mb-6 flex-wrap gap-3">
            <div>
                <h1 class="font-heading text-h5 font-weight-bold">คลังเมนูของฉัน</h1>
                <p class="text-medium-emphasis text-body-2">จัดการเมนูอาหารส่วนตัว เพิ่ม แก้ไข ลบได้</p>
            </div>
            <div class="d-flex gap-2 flex-wrap">
                <v-btn variant="tonal" color="success" @click="triggerImport">
                    <v-icon start>mdi-file-excel</v-icon> Import Excel
                </v-btn>
                <v-btn variant="tonal" color="teal" @click="exportMyMenus" :disabled="customItems.length === 0">
                    <v-icon start>mdi-export</v-icon> Export เมนูของฉัน
                </v-btn>
                <v-btn color="primary" @click="openAddDialog">
                    <v-icon start>mdi-plus</v-icon> เพิ่มเมนูใหม่
                </v-btn>
                <input ref="fileInput" type="file" accept=".xlsx" style="display:none" @change="handleImport" />
            </div>
        </div>

        <!-- Import Result Alert -->
        <v-alert v-if="importResult" :type="importResult.type" class="mb-4" closable @click:close="importResult = null">
            {{ importResult.message }}
        </v-alert>

        <!-- Search -->
        <v-text-field v-model="search" label="ค้นหาเมนู" prepend-inner-icon="mdi-magnify" clearable hide-details
            class="mb-5" style="max-width: 400px" />

        <!-- Loading -->
        <div v-if="loading" class="text-center py-12">
            <v-progress-circular indeterminate color="primary" />
        </div>

        <!-- Empty state -->
        <v-card v-else-if="customItems.length === 0" class="pa-8 text-center">
            <v-icon size="64" color="grey-lighten-2">mdi-food-off-outline</v-icon>
            <p class="text-h6 text-medium-emphasis mt-4">ยังไม่มีเมนูของฉัน</p>
            <p class="text-body-2 text-medium-emphasis mb-4">เพิ่มเมนูเอง หรือ Import จาก Excel ได้เลยครับ</p>
            <div class="d-flex justify-center gap-3">
                <v-btn color="primary" @click="openAddDialog">
                    <v-icon start>mdi-plus</v-icon> เพิ่มเมนูแรก
                </v-btn>
                <v-btn variant="tonal" color="success" @click="triggerImport">
                    <v-icon start>mdi-file-excel</v-icon> Import Excel
                </v-btn>
                <v-btn variant="tonal" color="teal" @click="exportMyMenus" :disabled="customItems.length === 0">
                    <v-icon start>mdi-export</v-icon> Export เมนูของฉัน
                </v-btn>
            </div>
        </v-card>

        <!-- Table -->
        <v-card v-else>
            <v-data-table :items="filteredItems" :headers="headers" density="comfortable" class="data-table"
                :items-per-page="15">
                <template #item.name="{ item }">
                    <div class="d-flex align-center gap-2">
                        <v-avatar size="32" color="primary" variant="tonal" rounded="lg">
                            <v-icon size="16" color="primary">mdi-star</v-icon>
                        </v-avatar>
                        <span class="font-weight-medium">{{ item.name }}</span>
                    </div>
                </template>
                <template #item.calories="{ item }">
                    <span class="text-primary font-weight-bold">{{ item.calories }}</span>
                </template>
                <template #item.carbs="{ item }">{{ Number(item.carbs).toFixed(1) }}</template>
                <template #item.protein="{ item }">{{ Number(item.protein).toFixed(1) }}</template>
                <template #item.fat="{ item }">{{ Number(item.fat).toFixed(1) }}</template>
                <template #item.sugar="{ item }">{{ Number(item.sugar).toFixed(1) }}</template>
                <template #item.sodium="{ item }">{{ Number(item.sodium).toFixed(0) }}</template>
                <template #item.cholesterol="{ item }">{{ Number(item.cholesterol).toFixed(0) }}</template>
                <template #item.servingSize="{ item }">
                    {{ item.servingSize }}{{ item.unit }}
                </template>
                <template #item.actions="{ item }">
                    <div class="d-flex gap-1">
                        <v-btn icon size="x-small" color="primary" variant="text" @click="openEditDialog(item)">
                            <v-icon size="16">mdi-pencil-outline</v-icon>
                        </v-btn>
                        <v-btn icon size="x-small" color="error" variant="text" @click="openConfirmDelete(item)">
                            <v-icon size="16">mdi-delete-outline</v-icon>
                        </v-btn>
                    </div>
                </template>
            </v-data-table>
        </v-card>

        <!-- Add/Edit Dialog -->
        <v-dialog v-model="dialog" max-width="560" persistent>
            <v-card>
                <v-card-title class="font-heading pa-5 pb-3">
                    <v-icon color="primary" class="mr-2">{{ editMode ? 'mdi-pencil-outline' : 'mdi-food-plus-outline'
                        }}</v-icon>
                    {{ editMode ? 'แก้ไขเมนู' : 'เพิ่มเมนูใหม่' }}
                </v-card-title>
                <v-card-text class="pa-5 pt-2">
                    <v-row>
                        <v-col cols="12" sm="8">
                            <v-text-field v-model="form.name" label="ชื่อเมนู *" prepend-inner-icon="mdi-food" />
                        </v-col>
                        <v-col cols="12" sm="4">
                            <v-text-field v-model.number="form.servingSize" label="ปริมาณ/ครั้ง" type="number"
                                suffix="g" />
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
                            <v-text-field v-model.number="form.cholesterol" label="คอเลสเตอรอล" suffix="mg"
                                type="number" />
                        </v-col>
                    </v-row>
                </v-card-text>
                <v-card-actions class="pa-5 pt-0">
                    <v-spacer />
                    <v-btn variant="text" @click="dialog = false">ยกเลิก</v-btn>
                    <v-btn color="primary" :loading="saving" @click="save" :disabled="!form.name">
                        <v-icon start>mdi-content-save</v-icon>
                        {{ editMode ? 'บันทึกการแก้ไข' : 'เพิ่มเมนู' }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Confirm Delete -->
        <v-dialog v-model="confirmDialog" max-width="360" persistent>
            <v-card>
                <v-card-title class="font-heading pa-5 pb-3">
                    <v-icon color="error" class="mr-2">mdi-alert-circle-outline</v-icon>
                    ยืนยันการลบ
                </v-card-title>
                <v-card-text class="pa-5 pt-0">
                    <p class="text-body-1">คุณต้องการลบเมนู <strong>"{{ deletingItem?.name }}"</strong> ใช่ไหม?</p>
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

        <!-- Import Loading Dialog -->
        <v-dialog v-model="importing" max-width="300" persistent>
            <v-card class="pa-6 text-center">
                <v-progress-circular indeterminate color="primary" size="48" class="mb-4" />
                <p class="text-body-1">กำลัง Import ข้อมูล...</p>
            </v-card>
        </v-dialog>

        <v-snackbar v-model="snackbar" :color="snackColor" timeout="3000">
            {{ snackMsg }}
        </v-snackbar>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useNutritionStore } from '../stores/nutrition'
import * as XLSX from 'xlsx'

const store = useNutritionStore()
const search = ref('')
const loading = ref(false)
const dialog = ref(false)
const editMode = ref(false)
const editingId = ref(null)
const saving = ref(false)
const confirmDialog = ref(false)
const deletingItem = ref(null)
const deleting = ref(false)
const snackbar = ref(false)
const snackMsg = ref('')
const snackColor = ref('success')
const fileInput = ref(null)
const importing = ref(false)
const importResult = ref(null)

const emptyForm = () => ({
    name: '', servingSize: 100, unit: 'g',
    calories: 0, carbs: 0, protein: 0,
    fat: 0, sugar: 0, sodium: 0, cholesterol: 0,
})
const form = ref(emptyForm())

const customItems = computed(() => store.foodItems.filter(f => f.custom))

const filteredItems = computed(() => {
    if (!search.value) return customItems.value
    const q = search.value.toLowerCase()
    return customItems.value.filter(f => f.name.toLowerCase().includes(q))
})

const headers = [
    { title: 'ชื่อเมนู', key: 'name', sortable: true },
    { title: 'ปริมาณ/ครั้ง', key: 'servingSize', sortable: false },
    { title: 'kcal', key: 'calories', sortable: true },
    { title: 'คาร์บ (g)', key: 'carbs', sortable: false },
    { title: 'โปรตีน (g)', key: 'protein', sortable: false },
    { title: 'ไขมัน (g)', key: 'fat', sortable: false },
    { title: 'น้ำตาล (g)', key: 'sugar', sortable: false },
    { title: 'โซเดียม (mg)', key: 'sodium', sortable: false },
    { title: 'คอเลสเตอรอล (mg)', key: 'cholesterol', sortable: false },
    { title: '', key: 'actions', sortable: false, width: 80 },
]

onMounted(async () => {
    loading.value = true
    try { await store.fetchAll() }
    finally { loading.value = false }
})

function openAddDialog() {
    editMode.value = false
    editingId.value = null
    form.value = emptyForm()
    dialog.value = true
}

function openEditDialog(item) {
    editMode.value = true
    editingId.value = item.id
    form.value = {
        name: item.name, servingSize: item.servingSize || 100, unit: item.unit || 'g',
        calories: item.calories, carbs: item.carbs, protein: item.protein,
        fat: item.fat, sugar: item.sugar, sodium: item.sodium, cholesterol: item.cholesterol,
    }
    dialog.value = true
}

async function save() {
    saving.value = true
    try {
        if (editMode.value) {
            await store.updateCustomFoodItem(editingId.value, form.value)
            showSnack('แก้ไขเมนูสำเร็จ')
        } else {
            await store.addCustomFoodItem(form.value)
            showSnack('เพิ่มเมนูสำเร็จ')
        }
        dialog.value = false
    } catch (e) {
        showSnack(e.response?.data?.error || 'เกิดข้อผิดพลาด', 'error')
    } finally {
        saving.value = false
    }
}

function openConfirmDelete(item) {
    deletingItem.value = item
    confirmDialog.value = true
}

async function confirmDelete() {
    deleting.value = true
    try {
        await store.deleteCustomFoodItem(deletingItem.value.id)
        confirmDialog.value = false
        deletingItem.value = null
        showSnack('ลบเมนูสำเร็จ')
    } catch (e) {
        showSnack('เกิดข้อผิดพลาด', 'error')
    } finally {
        deleting.value = false
    }
}

// ── Export เมนูของฉันเป็น Excel ──
function exportMyMenus() {
    if (customItems.value.length === 0) return

    const rows = [
        ['ชื่อเมนู', 'ปริมาณ/ครั้ง (g)', 'พลังงาน (kcal)', 'คาร์บ (g)', 'โปรตีน (g)', 'ไขมัน (g)', 'น้ำตาล (g)', 'โซเดียม (mg)', 'คอเลสเตอรอล (mg)'],
        ...customItems.value.map(item => [
            item.name,
            item.servingSize || 100,
            item.calories || 0,
            item.carbs || 0,
            item.protein || 0,
            item.fat || 0,
            item.sugar || 0,
            item.sodium || 0,
            item.cholesterol || 0,
        ])
    ]

    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [
        { wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 12 },
        { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 18 }
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'เมนูของฉัน')

    const date = new Date().toISOString().split('T')[0]
    XLSX.writeFile(wb, `my_menus_${date}.xlsx`)
    showSnack(`Export ${customItems.value.length} เมนู สำเร็จ`)
}

// ── Import Excel ──
function triggerImport() {
    fileInput.value.click()
}

async function handleImport(event) {
    const file = event.target.files[0]
    if (!file) return
    fileInput.value.value = '' // reset input

    importing.value = true
    importResult.value = null

    try {
        const data = await file.arrayBuffer()
        const wb = XLSX.read(data)
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1 })

        // ข้ามแถว header (แถวแรก)
        const dataRows = rows.slice(1).filter(row => row[0]) // กรองแถวที่มีชื่อเมนู

        if (dataRows.length === 0) {
            importResult.value = { type: 'warning', message: 'ไม่พบข้อมูลในไฟล์ กรุณาตรวจสอบ format ตาม Template' }
            return
        }

        let success = 0
        let skip = 0
        const errors = []

        for (const row of dataRows) {
            const name = String(row[0] || '').trim()
            if (!name) continue

            try {
                await store.addCustomFoodItem({
                    name,
                    servingSize: Number(row[1]) || 100,
                    unit: 'g',
                    calories: Number(row[2]) || 0,
                    carbs: Number(row[3]) || 0,
                    protein: Number(row[4]) || 0,
                    fat: Number(row[5]) || 0,
                    sugar: Number(row[6]) || 0,
                    sodium: Number(row[7]) || 0,
                    cholesterol: Number(row[8]) || 0,
                })
                success++
            } catch (e) {
                if (e.response?.data?.error === 'มีเมนูนี้อยู่แล้ว') {
                    skip++
                } else {
                    errors.push(name)
                }
            }
        }

        let msg = `Import สำเร็จ ${success} รายการ`
        if (skip > 0) msg += ` • ข้าม ${skip} รายการ (มีอยู่แล้ว)`
        if (errors.length > 0) msg += ` • ล้มเหลว ${errors.length} รายการ`

        importResult.value = {
            type: success > 0 ? 'success' : 'warning',
            message: msg
        }

    } catch (e) {
        importResult.value = { type: 'error', message: 'ไม่สามารถอ่านไฟล์ได้ กรุณาใช้ไฟล์ .xlsx ตาม Template' }
    } finally {
        importing.value = false
    }
}

function showSnack(msg, color = 'success') {
    snackMsg.value = msg
    snackColor.value = color
    snackbar.value = true
}
</script>