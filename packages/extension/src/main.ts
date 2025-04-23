import { createApp } from 'vue'
import { installI18n } from '@prompt-assistant/ui'
import App from './App.vue'

import './style.css'
import '@prompt-assistant/ui/dist/style.css' 

const app = createApp(App)
installI18n(app)
app.mount('#app')