<template>
    <v-dialog :model-value="modelValue" max-width="660" persistent
        @update:model-value="$emit('update:modelValue', $event)">
        <v-card>
            <v-card-title class="font-heading pa-5 pb-2">
                <v-icon color="primary" class="mr-2">mdi-food-plus-outline</v-icon>
                เพิ่มอาหาร — {{ mealLabel }}
            </v-card-title>

            <v-tabs v-model="activeTab" color="primary" class="px-5">
                <v-tab value="local">
                    <v-icon start size="18">mdi-database-outline</v-icon> เมนูมาตรฐาน
                </v-tab>
                <v-tab value="world">
                    <v-icon start size="18">mdi-earth</v-icon> Menu of the World
                </v-tab>
                <v-tab value="manual">
                    <v-icon start size="18">mdi-pencil-outline</v-icon> กรอกเอง
                </v-tab>
            </v-tabs>
            <v-divider />

            <v-card-text class="pa-5 pt-4" style="min-height: 380px">

                <!-- แท็บ 1: เมนูมาตรฐาน -->
                <div v-if="activeTab === 'local'">
                    <v-text-field v-model="localSearch" label="ค้นหาจากคลังเมนู" prepend-inner-icon="mdi-magnify"
                        clearable hide-details class="mb-3" />
                    <v-list lines="two" class="food-list rounded-xl" style="max-height: 260px; overflow-y: auto">
                        <v-list-item v-for="item in filteredLocalItems" :key="item.id"
                            :class="['mb-1 rounded-lg food-item-row', selectedFood?.id === item.id ? 'selected-row' : '']"
                            @click="selectLocalFood(item)" style="cursor: pointer">
                            <template #prepend>
                                <v-avatar size="36" rounded="lg" :color="item.custom ? 'primary' : 'green'"
                                    variant="tonal">
                                    <v-icon size="18" :color="item.custom ? 'primary' : 'green'">
                                        {{ item.custom ? 'mdi-star' : 'mdi-food' }}
                                    </v-icon>
                                </v-avatar>
                            </template>
                            <template #title>
                                <span class="text-body-2 font-weight-medium">{{ item.name }}</span>
                                <v-chip v-if="item.custom" size="x-small" color="primary" variant="tonal"
                                    class="ml-2">ของฉัน ⭐</v-chip>
                            </template>
                            <template #subtitle>
                                <span class="text-caption">{{ item.calories }} kcal / {{ item.servingSize }}{{ item.unit
                                    }}</span>
                            </template>
                            <template #append>
                                <v-icon v-if="selectedFood?.id === item.id" color="primary">mdi-check-circle</v-icon>
                            </template>
                        </v-list-item>
                        <div v-if="filteredLocalItems.length === 0" class="text-center py-6 text-medium-emphasis">
                            <v-icon size="36" color="grey-lighten-2">mdi-food-off-outline</v-icon>
                            <p class="text-body-2 mt-2">ไม่พบเมนูที่ค้นหา</p>
                        </div>
                    </v-list>
                    <div v-if="selectedFood" class="mt-3 selected-food-preview pa-4 rounded-xl">
                        <div class="d-flex align-center gap-2 mb-2">
                            <v-icon color="primary" size="18">mdi-food</v-icon>
                            <span class="font-weight-bold text-body-2">{{ selectedFood.name }}</span>
                        </div>
                        <v-row dense align="center">
                            <v-col cols="6">
                                <v-text-field v-model.number="form.quantity" label="ปริมาณที่กิน"
                                    :suffix="selectedFood.unit || 'g'" type="number" density="compact" hide-details
                                    @update:model-value="recalcFromLocal" />
                            </v-col>
                            <v-col cols="6" class="text-center">
                                <div class="text-h6 font-weight-bold text-primary">{{ form.calories }} kcal</div>
                                <div class="text-caption text-medium-emphasis">คาร์บ {{ form.carbs }}g · โปรตีน {{
                                    form.protein }}g · ไขมัน
                                    {{ form.fat }}g</div>
                            </v-col>
                        </v-row>
                    </div>
                </div>

                <!-- แท็บ 2: Menu of the World -->
                <div v-if="activeTab === 'world'">
                    <div class="d-flex gap-2 mb-3">
                        <v-text-field v-model="worldSearch" label="ค้นหาอาหารทั่วโลก (ภาษาอังกฤษ)"
                            prepend-inner-icon="mdi-earth" hide-details clearable @keyup.enter="searchWorldFood" />
                        <v-btn color="primary" :loading="worldLoading" @click="searchWorldFood" height="56">
                            <v-icon>mdi-magnify</v-icon>
                        </v-btn>
                    </div>
                    <div v-if="worldLoading" class="text-center py-8">
                        <v-progress-circular indeterminate color="primary" />
                    </div>
                    <div v-else-if="worldError" class="text-center py-6">
                        <v-icon color="error" size="40">mdi-wifi-off</v-icon>
                        <p class="text-body-2 mt-2 text-error">{{ worldError }}</p>
                    </div>
                    <div v-else-if="!worldSearched" class="text-center py-6 text-medium-emphasis">
                        <v-icon size="48" color="grey-lighten-2">mdi-earth</v-icon>
                        <p class="text-body-2 mt-2">ค้นหาอาหารจากฐานข้อมูลทั่วโลก</p>
                        <p class="text-caption">เช่น rice, chicken breast, banana, pizza</p>
                    </div>
                    <div v-else-if="worldResults.length === 0" class="text-center py-6 text-medium-emphasis">
                        <v-icon size="48" color="grey-lighten-2">mdi-food-off-outline</v-icon>
                        <p class="text-body-2 mt-2">ไม่พบผลลัพธ์ ลองใช้ภาษาอังกฤษ</p>
                    </div>
                    <v-list v-else lines="two" class="food-list rounded-xl" style="max-height: 220px; overflow-y: auto">
                        <v-list-item v-for="item in worldResults" :key="item.code"
                            :class="['mb-1 rounded-lg food-item-row', selectedWorldFood?.code === item.code ? 'selected-row' : '']"
                            @click="selectWorldFood(item)" style="cursor: pointer">
                            <template #prepend>
                                <v-avatar size="40" rounded="lg" color="blue-lighten-5">
                                    <v-img v-if="item.image_small_url" :src="item.image_small_url" />
                                    <v-icon v-else color="blue">mdi-food</v-icon>
                                </v-avatar>
                            </template>
                            <template #title>
                                <span class="text-body-2 font-weight-medium">{{ item.product_name }}</span>
                            </template>
                            <template #subtitle>
                                <span class="text-caption text-medium-emphasis">{{ item.brands }}</span>
                            </template>
                            <template #append>
                                <div class="text-right">
                                    <div class="text-body-2 font-weight-bold text-primary">{{ item.calories_100g }} kcal
                                    </div>
                                    <div class="text-caption text-medium-emphasis">ต่อ 100g</div>
                                </div>
                            </template>
                        </v-list-item>
                    </v-list>
                    <div v-if="selectedWorldFood" class="mt-3 selected-food-preview pa-4 rounded-xl">
                        <div class="d-flex align-center gap-2 mb-2">
                            <v-icon color="primary" size="18">mdi-earth</v-icon>
                            <span class="font-weight-bold text-body-2">{{ selectedWorldFood.product_name }}</span>
                        </div>
                        <v-row dense align="center">
                            <v-col cols="6">
                                <v-text-field v-model.number="form.quantity" label="ปริมาณที่กิน" suffix="g"
                                    type="number" density="compact" hide-details
                                    @update:model-value="recalcFromWorld" />
                            </v-col>
                            <v-col cols="6" class="text-center">
                                <div class="text-h6 font-weight-bold text-primary">{{ form.calories }} kcal</div>
                                <div class="text-caption text-medium-emphasis">คาร์บ {{ form.carbs }}g · โปรตีน {{
                                    form.protein }}g ·
                                    ไขมัน {{ form.fat }}g</div>
                            </v-col>
                        </v-row>
                    </div>
                </div>

                <!-- แท็บ 3: กรอกเอง -->
                <div v-if="activeTab === 'manual'">
                    <v-row>
                        <v-col cols="12" sm="8">
                            <v-text-field v-model="form.foodName" label="ชื่ออาหาร *" prepend-inner-icon="mdi-food" />
                        </v-col>
                        <v-col cols="12" sm="4">
                            <v-text-field v-model.number="form.quantity" label="ปริมาณ (g/ml)" type="number" />
                        </v-col>
                    </v-row>
                    <v-row>
                        <v-col cols="6" sm="3"><v-text-field v-model.number="form.calories" label="พลังงาน"
                                suffix="kcal" type="number" /></v-col>
                        <v-col cols="6" sm="3"><v-text-field v-model.number="form.carbs" label="คาร์บ" suffix="g"
                                type="number" /></v-col>
                        <v-col cols="6" sm="3"><v-text-field v-model.number="form.protein" label="โปรตีน" suffix="g"
                                type="number" /></v-col>
                        <v-col cols="6" sm="3"><v-text-field v-model.number="form.fat" label="ไขมัน" suffix="g"
                                type="number" /></v-col>
                        <v-col cols="6" sm="4"><v-text-field v-model.number="form.sugar" label="น้ำตาล" suffix="g"
                                type="number" /></v-col>
                        <v-col cols="6" sm="4"><v-text-field v-model.number="form.sodium" label="โซเดียม" suffix="mg"
                                type="number" /></v-col>
                        <v-col cols="6" sm="4"><v-text-field v-model.number="form.cholesterol" label="คอเลสเตอรอล"
                                suffix="mg" type="number" /></v-col>
                    </v-row>
                    <v-checkbox v-model="saveToLibrary" label="บันทึกเมนูนี้ลงคลัง เพื่อใช้ซ้ำในครั้งถัดไป ⭐"
                        color="primary" hide-details class="mt-1" />
                </div>

            </v-card-text>

            <v-card-actions class="pa-5 pt-0">
                <v-spacer />
                <v-btn variant="text" @click="$emit('update:modelValue', false)">ยกเลิก</v-btn>
                <v-btn color="primary" :loading="loading" @click="handleSave" :disabled="!canSave">
                    <v-icon start>mdi-content-save</v-icon> บันทึก
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useNutritionStore } from '../../stores/nutrition'
import api from '../../plugins/axios'

const props = defineProps({
    modelValue: Boolean,
    meal: { type: String, default: 'breakfast' },
    loading: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'save'])

const store = useNutritionStore()
const activeTab = ref('local')
const saveToLibrary = ref(false)
const localSearch = ref('')
const selectedFood = ref(null)
const worldSearch = ref('')
const worldLoading = ref(false)
const worldResults = ref([])
const worldSearched = ref(false)
const worldError = ref('')
const selectedWorldFood = ref(null)

const mealLabel = computed(() => store.mealTypes.find(m => m.value === props.meal)?.label || '')

const emptyForm = () => ({
    foodName: '', quantity: 100,
    calories: 0, carbs: 0, protein: 0, fat: 0,
    sugar: 0, sodium: 0, cholesterol: 0,
})
const form = ref(emptyForm())

// reset เมื่อเปิด dialog ใหม่
watch(() => props.modelValue, (val) => {
    if (val) {
        form.value = emptyForm()
        selectedFood.value = null
        selectedWorldFood.value = null
        worldResults.value = []
        worldSearched.value = false
        worldError.value = ''
        worldSearch.value = ''
        localSearch.value = ''
        saveToLibrary.value = false
        activeTab.value = 'local'
    }
})

const filteredLocalItems = computed(() => {
    const items = store.foodItems
    if (!localSearch.value) return items
    const q = localSearch.value.toLowerCase()
    return items.filter(f => f.name.toLowerCase().includes(q))
})

function selectLocalFood(item) {
    selectedFood.value = item
    form.value = {
        foodName: item.name,
        quantity: item.servingSize || 100,
        calories: Math.round(item.calories),
        carbs: +item.carbs.toFixed(1),
        protein: +item.protein.toFixed(1),
        fat: +item.fat.toFixed(1),
        sugar: +item.sugar.toFixed(1),
        sodium: Math.round(item.sodium),
        cholesterol: Math.round(item.cholesterol),
    }
}

function recalcFromLocal(qty) {
    if (!selectedFood.value || !qty) return
    const base = selectedFood.value.servingSize || 100
    const r = qty / base
    const f = selectedFood.value
    form.value.calories = Math.round(f.calories * r)
    form.value.carbs = +(f.carbs * r).toFixed(1)
    form.value.protein = +(f.protein * r).toFixed(1)
    form.value.fat = +(f.fat * r).toFixed(1)
    form.value.sugar = +(f.sugar * r).toFixed(1)
    form.value.sodium = Math.round(f.sodium * r)
    form.value.cholesterol = Math.round(f.cholesterol * r)
}

async function searchWorldFood() {
    if (!worldSearch.value.trim()) return
    worldLoading.value = true
    worldError.value = ''
    worldSearched.value = true
    selectedWorldFood.value = null
    try {
        const res = await api.get(`/world-food?q=${encodeURIComponent(worldSearch.value.trim())}`)
        worldResults.value = res.data
    } catch {
        worldError.value = 'ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่'
    } finally {
        worldLoading.value = false
    }
}

function selectWorldFood(item) {
    selectedWorldFood.value = item
    form.value = {
        foodName: item.product_name,
        quantity: 100,
        calories: item.calories_100g,
        carbs: item.carbs_100g,
        protein: item.protein_100g,
        fat: item.fat_100g,
        sugar: item.sugar_100g,
        sodium: item.sodium_100g,
        cholesterol: item.cholesterol_100g,
    }
}

function recalcFromWorld(qty) {
    if (!selectedWorldFood.value || !qty) return
    const w = selectedWorldFood.value
    const r = qty / 100
    form.value.calories = Math.round(w.calories_100g * r)
    form.value.carbs = +(w.carbs_100g * r).toFixed(1)
    form.value.protein = +(w.protein_100g * r).toFixed(1)
    form.value.fat = +(w.fat_100g * r).toFixed(1)
    form.value.sugar = +(w.sugar_100g * r).toFixed(1)
    form.value.sodium = Math.round(w.sodium_100g * r)
    form.value.cholesterol = Math.round(w.cholesterol_100g * r)
}

const canSave = computed(() => {
    if (activeTab.value === 'local') return !!selectedFood.value
    if (activeTab.value === 'world') return !!selectedWorldFood.value
    if (activeTab.value === 'manual') return !!form.value.foodName
    return false
})

async function handleSave() {
    if (saveToLibrary.value && activeTab.value === 'manual') {
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
    }
    emit('save', { ...form.value, meal: props.meal })
    emit('update:modelValue', false)
}
</script>

<style scoped>
.selected-food-preview {
    background: rgba(45, 106, 79, 0.06);
    border: 1px solid rgba(45, 106, 79, 0.15);
}

.food-list {
    border: 1px solid rgba(0, 0, 0, 0.08);
}

.food-item-row {
    transition: background 0.15s;
}

.food-item-row:hover {
    background: rgba(45, 106, 79, 0.06) !important;
}

.selected-row {
    background: rgba(45, 106, 79, 0.1) !important;
}
</style>