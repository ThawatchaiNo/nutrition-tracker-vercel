<template>
    <v-dialog :model-value="modelValue" max-width="420" persistent
        @update:model-value="$emit('update:modelValue', $event)">
        <v-card>
            <v-card-title class="font-heading pa-5 pb-2">
                <v-icon color="primary" size="18" class="mr-2">mdi-pencil-outline</v-icon>
                {{ form.foodName }}
            </v-card-title>
            <v-card-text class="pa-5 pt-2">
                <div class="d-flex align-center gap-4">
                    <v-text-field v-model.number="form.quantity" label="ปริมาณที่กิน" suffix="g" type="number"
                        density="comfortable" hide-details style="max-width: 160px" @update:model-value="recalc" />
                    <div class="flex-grow-1">
                        <div class="text-h5 font-weight-bold text-primary">{{ form.calories }} kcal</div>
                        <div class="text-caption text-medium-emphasis mt-1">
                            คาร์บ {{ form.carbs }}g · โปรตีน {{ form.protein }}g · ไขมัน {{ form.fat }}g
                        </div>
                    </div>
                </div>
            </v-card-text>
            <v-card-actions class="pa-5 pt-0">
                <v-spacer />
                <v-btn variant="text" @click="$emit('update:modelValue', false)">ยกเลิก</v-btn>
                <v-btn color="primary" :loading="loading" @click="$emit('save', form)">
                    <v-icon start>mdi-content-save</v-icon> บันทึก
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
    modelValue: Boolean,
    item: { type: Object, default: null },
    loading: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'save'])

const form = ref({
    foodName: '', quantity: 100,
    calories: 0, carbs: 0, protein: 0, fat: 0,
    sugar: 0, sodium: 0, cholesterol: 0,
})

const baseValues = ref({})

// เมื่อ item เปลี่ยน (เปิด dialog ใหม่) ให้ reset form
watch(() => props.item, (newItem) => {
    if (!newItem) return
    baseValues.value = { ...newItem }
    form.value = { ...newItem }
}, { immediate: true })

function recalc(newQty) {
    if (!newQty || !baseValues.value.quantity) return
    const r = newQty / baseValues.value.quantity
    form.value.calories = Math.round(baseValues.value.calories * r)
    form.value.carbs = +(baseValues.value.carbs * r).toFixed(1)
    form.value.protein = +(baseValues.value.protein * r).toFixed(1)
    form.value.fat = +(baseValues.value.fat * r).toFixed(1)
    form.value.sugar = +(baseValues.value.sugar * r).toFixed(1)
    form.value.sodium = Math.round(baseValues.value.sodium * r)
    form.value.cholesterol = Math.round(baseValues.value.cholesterol * r)
}
</script>