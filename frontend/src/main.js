import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import router from './router'
import App from './App.vue'

import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import './assets/main.css'

const vuetify = createVuetify({
  components,
  directives,
  icons: { defaultSet: 'mdi', aliases, sets: { mdi } },
  theme: {
    defaultTheme: 'nutriLight',
    themes: {
      nutriLight: {
        dark: false,
        colors: {
          primary: '#2D6A4F',
          secondary: '#52B788',
          accent: '#F4A261',
          error: '#E76F51',
          warning: '#F4A261',
          info: '#457B9D',
          success: '#52B788',
          surface: '#FAFAF8',
          background: '#F5F7F4',
          'on-primary': '#FFFFFF',
          'nutrition-carbs': '#F4A261',
          'nutrition-protein': '#2D6A4F',
          'nutrition-fat': '#E76F51',
          'nutrition-sugar': '#E9C46A',
        }
      },
      nutriDark: {
        dark: true,
        colors: {
          primary: '#52B788',
          secondary: '#74C69D',
          accent: '#F4A261',
          surface: '#1C2B22',
          background: '#141F18',
        }
      }
    }
  },
  defaults: {
    VCard: { rounded: 'lg', elevation: 0 },
    VBtn: { rounded: 'lg' },
    VTextField: { variant: 'outlined', density: 'comfortable' },
    VSelect: { variant: 'outlined', density: 'comfortable' },
  }
})

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(vuetify)
app.mount('#app')
