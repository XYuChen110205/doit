import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// 引入全局样式
import './styles/tokens.css'

const app = createApp(App)

// 使用 Vue Router
app.use(router)

app.mount('#app')
