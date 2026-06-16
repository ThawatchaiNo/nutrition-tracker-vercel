<template>
    <v-dialog :model-value="modelValue" max-width="360" persistent
        @update:model-value="$emit('update:modelValue', $event)">
        <v-card>
            <v-card-title class="font-heading pa-5 pb-3">
                <v-icon color="primary" class="mr-2">mdi-food-plus-outline</v-icon>
                เลือกมื้ออาหาร
            </v-card-title>
            <v-card-text class="pa-5 pt-2">
                <v-row>
                    <v-col cols="6" v-for="meal in mealTypes" :key="meal.value">
                        <v-btn block height="72" :color="meal.color" variant="tonal" class="d-flex flex-column"
                            @click="selectMeal(meal.value)">
                            <v-icon size="28" class="mb-1">{{ meal.icon }}</v-icon>
                            <span class="text-body-2">{{ meal.label }}</span>
                        </v-btn>
                    </v-col>
                </v-row>
            </v-card-text>
            <v-card-actions class="pa-5 pt-0">
                <v-spacer />
                <v-btn variant="text" @click="$emit('update:modelValue', false)">ยกเลิก</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { useNutritionStore } from '../../stores/nutrition'
import { computed } from 'vue'

defineProps({
    modelValue: Boolean,
})

const emit = defineEmits(['update:modelValue', 'select'])

const store = useNutritionStore()
const mealTypes = computed(() => store.mealTypes)

function selectMeal(meal) {
    emit('select', meal)
    emit('update:modelValue', false)
}
</script>