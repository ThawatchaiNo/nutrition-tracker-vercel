<template>
  <v-app>
    <!-- Mobile app bar -->
    <v-app-bar v-if="mobile" color="white" elevation="0" border="b">
      <v-app-bar-nav-icon @click="drawer = !drawer" />
      <v-app-bar-title>
        <span class="font-heading text-primary font-weight-bold">NutriTrack</span>
      </v-app-bar-title>
      <template #append>
        <v-btn icon @click="toggleTheme">
          <v-icon>{{ isDark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
        </v-btn>
      </template>
    </v-app-bar>

    <!-- Sidebar Navigation -->
    <v-navigation-drawer v-model="drawer" :permanent="!mobile" :temporary="mobile" width="240" color="surface">
      <!-- Logo -->
      <div class="px-4 py-5">
        <div class="d-flex align-center gap-3">
          <div class="logo-badge">
            <v-icon color="primary" size="24">mdi-leaf</v-icon>
          </div>
          <div>
            <div class="font-heading text-h6 font-weight-bold text-primary">NutriTrack</div>
            <div class="text-caption text-medium-emphasis">บันทึกสุขภาพ</div>
          </div>
        </div>
      </div>

      <v-divider />

      <!-- User info -->
      <div class="px-4 py-3">
        <div class="d-flex align-center gap-2">
          <v-avatar color="primary" size="36">
            <span class="text-body-2 font-weight-bold text-white">{{ userInitial }}</span>
          </v-avatar>
          <div>
            <div class="text-body-2 font-weight-medium">{{ auth.user?.name }}</div>
            <div class="text-caption text-medium-emphasis">{{ todayFormatted }}</div>
          </div>
        </div>
      </div>

      <v-divider class="mb-2" />

      <!-- Nav items -->
      <v-list class="px-2">
        <v-list-item v-for="item in navItems" :key="item.to" :to="item.to" :prepend-icon="item.icon" :title="item.title"
          rounded="lg" class="nav-item mb-1" active-class="active-nav" color="primary" />
      </v-list>

      <template #append>
        <v-divider class="mb-2" />
        <div class="px-2 pb-3">
          <v-list-item prepend-icon="mdi-book-open-outline" title="คลังเมนูของฉัน" to="/menu-library" rounded="lg"
            class="nav-item mb-1" color="primary" active-class="active-nav" />
          <v-list-item prepend-icon="mdi-cog-outline" title="เป้าหมาย" to="/goals" rounded="lg" class="nav-item mb-1"
            color="primary" active-class="active-nav" />
          <v-list-item prepend-icon="mdi-logout" title="ออกจากระบบ" rounded="lg" class="nav-item" color="error"
            @click="handleLogout" />
        </div>
      </template>
    </v-navigation-drawer>

    <!-- Main content -->
    <v-main>
      <div class="pa-4 pa-md-6">
        <router-view v-slot="{ Component }">
          <transition name="slide" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDisplay, useTheme } from 'vuetify'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useNutritionStore } from '../stores/nutrition'

const router = useRouter()
const auth = useAuthStore()
const nutrition = useNutritionStore()
const { mobile } = useDisplay()
const theme = useTheme()
const drawer = ref(!mobile.value)

const isDark = computed(() => theme.global.current.value.dark)
function toggleTheme() {
  theme.global.name.value = isDark.value ? 'nutriLight' : 'nutriDark'
}

const userInitial = computed(() => (auth.user?.name || 'U').charAt(0).toUpperCase())

const todayFormatted = computed(() => {
  return new Date().toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
})

const navItems = [
  { to: '/dashboard', icon: 'mdi-view-dashboard-outline', title: 'แดชบอร์ด' },
  { to: '/food-log', icon: 'mdi-food-outline', title: 'บันทึกอาหาร' },
  { to: '/activity', icon: 'mdi-run-fast', title: 'กิจกรรมออกกำลังกาย' },
  { to: '/reports', icon: 'mdi-chart-line', title: 'รายงานและกราฟ' },
]

onMounted(() => nutrition.fetchAll())

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.logo-badge {
  width: 40px;
  height: 40px;
  background: rgba(45, 106, 79, 0.1);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>