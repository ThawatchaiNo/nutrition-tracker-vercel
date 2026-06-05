import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  { path: '/login', name: 'Login', component: () => import('../views/LoginView.vue'), meta: { public: true } },
  { path: '/register', name: 'Register', component: () => import('../views/RegisterView.vue'), meta: { public: true } },
  {
    path: '/',
    component: () => import('../views/AppLayout.vue'),
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', name: 'Dashboard', component: () => import('../views/DashboardView.vue') },
      { path: 'food-log', name: 'FoodLog', component: () => import('../views/FoodLogView.vue') },
      { path: 'activity', name: 'Activity', component: () => import('../views/ActivityView.vue') },
      { path: 'reports', name: 'Reports', component: () => import('../views/ReportsView.vue') },
      { path: 'goals', name: 'Goals', component: () => import('../views/GoalsView.vue') },
      { path: 'menu-library', name: 'MenuLibrary', component: () => import('../views/MenuLibraryView.vue') },
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (!to.meta.public && !auth.token) return '/login'
})

export default router