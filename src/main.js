import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './style.css'
import BackButton from './components/common/BackButton.vue'
import AlertMessage from './components/common/AlertMessage.vue'
import ConfirmDialog from './components/common/ConfirmDialog.vue'
import ImageLightbox from './components/common/ImageLightbox.vue'
import LoadingSpinner from './components/common/LoadingSpinner.vue'
import ModalDialog from './components/common/ModalDialog.vue'
import PaginationControl from './components/common/PaginationControl.vue'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// Глобальная регистрация компонента BackButton, чтобы не импортировать в каждом файле
app.component('BackButton', BackButton)
app.component('AlertMessage', AlertMessage)
app.component('ConfirmDialog', ConfirmDialog)
app.component('ImageLightbox', ImageLightbox)
app.component('LoadingSpinner', LoadingSpinner)
app.component('ModalDialog', ModalDialog)
app.component('PaginationControl', PaginationControl)

app.mount('#app')
