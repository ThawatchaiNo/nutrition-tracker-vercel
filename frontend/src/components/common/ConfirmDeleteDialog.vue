<template>
    <v-dialog :model-value="modelValue" max-width="360" persistent
        @update:model-value="$emit('update:modelValue', $event)">
        <v-card>
            <v-card-title class="font-heading pa-5 pb-3">
                <v-icon color="error" class="mr-2">mdi-alert-circle-outline</v-icon>
                ยืนยันการลบ
            </v-card-title>
            <v-card-text class="pa-5 pt-0">
                <p class="text-body-1">คุณต้องการลบ <strong>"{{ itemName }}"</strong> ใช่ไหม?</p>
                <p class="text-body-2 text-medium-emphasis mt-2">การดำเนินการนี้ไม่สามารถเรียกคืนได้</p>
            </v-card-text>
            <v-card-actions class="pa-5 pt-0">
                <v-spacer />
                <v-btn variant="text" @click="$emit('update:modelValue', false)">ยกเลิก</v-btn>
                <v-btn color="error" :loading="loading" @click="$emit('confirm')">
                    <v-icon start>mdi-delete-outline</v-icon> ลบ
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
defineProps({
    modelValue: Boolean,
    itemName: { type: String, default: 'รายการนี้' },
    loading: { type: Boolean, default: false },
})

defineEmits(['update:modelValue', 'confirm'])
</script>