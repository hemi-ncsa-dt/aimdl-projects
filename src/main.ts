import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'
import { useAuthStore } from './stores/auth'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(vuetify)

const authStore = useAuthStore()

router.beforeEach(async (to, from, next) => {
    const token = new URLSearchParams(window.location.search).get('girderToken')
    if (token) {
        authStore.setToken(token)
        // Remove token from URL
        window.history.replaceState({}, document.title, window.location.pathname)
    }

    await authStore.fetchUser()

    if (to.name !== 'login' && !authStore.user) {
        next({ name: 'login' })
    } else if (to.name === 'login' && authStore.user) {
        next({ name: 'proposals' })
    } else {
        next()
    }
})

app.mount('#app')
