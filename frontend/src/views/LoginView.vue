<template>
  <v-container fluid class="fill-height login-bg">
    <v-row justify="center" align="center" class="fill-height">
      <v-col cols="12" sm="8" md="5" lg="4">
        <div class="text-center mb-8">
          <div class="logo-icon mb-3">
            <v-icon size="56" color="primary">mdi-leaf</v-icon>
          </div>
          <h1 class="font-heading text-h4 font-weight-bold text-primary">NutriTrack</h1>
          <p class="text-medium-emphasis mt-1">บันทึกโภชนาการและสุขภาพของคุณ</p>
        </div>

        <v-card class="pa-6 auth-card" elevation="0">
          <h2 class="font-heading text-h6 mb-6 font-weight-semibold">เข้าสู่ระบบ</h2>

          <v-alert v-if="error" type="error" class="mb-4" density="compact">{{ error }}</v-alert>

          <v-text-field
            v-model="email" label="อีเมล" type="email"
            prepend-inner-icon="mdi-email-outline" class="mb-3"
          />
          <v-text-field
            v-model="password" label="รหัสผ่าน" :type="showPw ? 'text' : 'password'"
            prepend-inner-icon="mdi-lock-outline"
            :append-inner-icon="showPw ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append-inner="showPw = !showPw"
            @keyup.enter="handleLogin"
            class="mb-4"
          />

          <v-btn block color="primary" size="large" :loading="loading" @click="handleLogin" class="mb-4">
            <v-icon start>mdi-login</v-icon> เข้าสู่ระบบ
          </v-btn>

          <div class="text-center text-body-2">
            ยังไม่มีบัญชี?
            <router-link to="/register" class="text-primary font-weight-medium">สมัครสมาชิก</router-link>
          </div>
        </v-card>

        <div class="text-center mt-4 text-caption text-medium-emphasis">
          Demo: demo@nutritrack.com / password123
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()
const email = ref('demo@nutritrack.com')
const password = ref('password123')
const showPw = ref(false)
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    await auth.login(email.value, password.value)
    router.push('/dashboard')
  } catch (e) {
    error.value = e.response?.data?.error || 'เข้าสู่ระบบไม่สำเร็จ'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-bg {
  background: linear-gradient(135deg, #f0f7f4 0%, #e8f4ee 50%, #f5f7f4 100%);
  min-height: 100vh;
}
.logo-icon {
  width: 80px; height: 80px;
  background: rgba(45, 106, 79, 0.1);
  border-radius: 24px;
  display: inline-flex; align-items: center; justify-content: center;
}
.auth-card {
  background: white;
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 20px !important;
}
</style>
