<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useUsersStore } from '../../stores/users'
// common components are registered globally in main.js

const router = useRouter()
const authStore = useAuthStore()
const usersStore = useUsersStore()

const activeTab = ref('profile')
const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const profileForm = ref({
  login: '',
  first_name: '',
  last_name: '',
  phone_number: ''
})

const passwordForm = ref({
  current_password: '',
  new_password: '',
  confirm_password: ''
})

const profileErrors = ref({})
const passwordErrors = ref({})
// will hold server-side field errors returned by usersStore
const serverProfileErrors = ref({})

const user = computed(() => authStore.user)
const currentUserId = computed(() => authStore.currentUserId)

onMounted(() => {
  if (user.value) {
    profileForm.value = {
      login: user.value.login || '',
      first_name: user.value.first_name || '',
      last_name: user.value.last_name || '',
      phone_number: user.value.phone_number || ''
    }
  }
})

function validateProfileForm() {
  profileErrors.value = {}

  if (!profileForm.value.login) {
    profileErrors.value.login = 'Логин обязателен'
  }

  if (!profileForm.value.first_name) {
    profileErrors.value.first_name = 'Имя обязательно'
  }

  if (!profileForm.value.last_name) {
    profileErrors.value.last_name = 'Фамилия обязательна'
  }

  // Phone number validation: optional, but if provided must be digits (7-15) with optional leading +
  if (profileForm.value.phone_number) {
    const cleaned = String(profileForm.value.phone_number).replace(/[^0-9+]/g, '')
    const phoneRegex = /^\+?\d{7,15}$/
    if (!phoneRegex.test(cleaned)) {
      profileErrors.value.phone_number = 'Неверный формат номера телефона'
    }
  }

  return Object.keys(profileErrors.value).length === 0
}

function validatePasswordForm() {
  passwordErrors.value = {}
  
  if (!passwordForm.value.current_password) {
    passwordErrors.value.current_password = 'Текущий пароль обязателен'
  }
  
  if (!passwordForm.value.new_password) {
    passwordErrors.value.new_password = 'Новый пароль обязателен'
  }
  
  if (passwordForm.value.new_password !== passwordForm.value.confirm_password) {
    passwordErrors.value.confirm_password = 'Пароли не совпадают'
  }
  
  return Object.keys(passwordErrors.value).length === 0
}

async function handleProfileSubmit() {
  if (!validateProfileForm()) return
  
  loading.value = true
  successMessage.value = ''
  errorMessage.value = ''
  
  try {
    await usersStore.updateProfile(currentUserId.value, profileForm.value)
    await authStore.updateCurrentUser()
    successMessage.value = 'Профиль успешно обновлён!'
  } catch (error) {
    // prefer store-provided field errors
    if (usersStore.fieldErrors && Object.keys(usersStore.fieldErrors).length) {
      serverProfileErrors.value = usersStore.fieldErrors
      // map server errors into profileErrors so they show next to inputs
      profileErrors.value = { ...profileErrors.value, ...serverProfileErrors.value }
        errorMessage.value = usersStore.error || 'Не удалось обновить профиль'
    } else {
        errorMessage.value = error.response?.data?.message || 'Не удалось обновить профиль'
    }
  } finally {
    loading.value = false
  }
}

async function handlePasswordSubmit() {
  if (!validatePasswordForm()) return
  
  loading.value = true
  successMessage.value = ''
  errorMessage.value = ''
  
  try {
    await usersStore.changePassword(
      currentUserId.value,
      passwordForm.value.current_password,
      passwordForm.value.new_password
    )
    passwordForm.value = {
      current_password: '',
      new_password: '',
      confirm_password: ''
    }
    successMessage.value = 'Пароль успешно изменён!'
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Не удалось изменить пароль'
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.back()
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function roleLabel(role) {
  if (!role) return ''
  if (role === 'admin') return 'Админ'
  if (role === 'client' || role === 'user') return 'Пользователь'
  // запасной вариант: капитализировать
  return role.charAt(0).toUpperCase() + role.slice(1)
}
</script>

<template>
  <div class="profile-page">
    <div class="page-header">
      <BackButton>{{ 'Назад' }}</BackButton>
      <h1 class="page-title">Мой профиль</h1>
    </div>

    <div class="profile-container">
      <div class="profile-sidebar">
        <div class="profile-card">
          <div class="profile-avatar">👤</div>
          <h2 class="profile-name" v-if="user">
            {{ user.first_name }} {{ user.last_name }}
          </h2>
          <p class="profile-login" v-if="user">{{ user.login }}</p>
          <div class="profile-meta" v-if="user">
            <span :class="['role-badge', `role-${user.role}`]">
              {{ roleLabel(user.role) }}
            </span>
            <p class="joined-date">Зарегистрирован: {{ formatDate(user.created_at) }}</p>
          </div>
        </div>

        <nav class="profile-nav">
          <button 
            :class="['nav-item', { active: activeTab === 'profile' }]"
            @click="activeTab = 'profile'"
          >
            Редактировать профиль
          </button>
          <button 
            :class="['nav-item', { active: activeTab === 'password' }]"
            @click="activeTab = 'password'"
          >
            Изменить пароль
          </button>
        </nav>
      </div>

      <div class="profile-content">
        <AlertMessage
          v-if="successMessage"
          type="success"
          :message="successMessage"
          @dismiss="successMessage = ''"
        />

        <AlertMessage
          v-if="errorMessage"
          type="error"
          :message="errorMessage"
          @dismiss="errorMessage = ''"
        />

  <LoadingSpinner v-if="loading" message="Сохранение..." />

        <div v-else class="tab-content">
          <template v-if="activeTab === 'profile'">
            <div class="content-card">
              <h3 class="content-title">Редактировать профиль</h3>
              
              <form @submit.prevent="handleProfileSubmit" class="profile-form">
                <div class="form-row">
                  <div class="form-group">
                    <label for="first_name" class="form-label">Имя</label>
                    <input
                      id="first_name"
                      v-model="profileForm.first_name"
                      type="text"
                      class="form-input"
                      :class="{ 'input-error': profileErrors.first_name }"
                    />
                    <span v-if="profileErrors.first_name" class="error-text">
                      {{ profileErrors.first_name }}
                    </span>
                  </div>

                  <div class="form-group">
                    <label for="last_name" class="form-label">Фамилия</label>
                    <input
                      id="last_name"
                      v-model="profileForm.last_name"
                      type="text"
                      class="form-input"
                      :class="{ 'input-error': profileErrors.last_name }"
                    />
                    <span v-if="profileErrors.last_name" class="error-text">
                      {{ profileErrors.last_name }}
                    </span>
                  </div>
                </div>

                <div class="form-group">
                  <label for="login" class="form-label">Логин</label>
                  <input
                    id="login"
                    v-model="profileForm.login"
                    type="text"
                    class="form-input"
                    :class="{ 'input-error': profileErrors.login }"
                  />
                  <span v-if="profileErrors.login" class="error-text">
                    {{ profileErrors.login }}
                  </span>
                </div>

                <div class="form-group">
                  <label for="phone_number" class="form-label">Телефон</label>
                  <input
                    id="phone_number"
                    v-model="profileForm.phone_number"
                    type="tel"
                    class="form-input"
                    :class="{ 'input-error': profileErrors.phone_number }"
                    placeholder="+71234567890"
                  />
                  <span v-if="profileErrors.phone_number" class="error-text">
                    {{ profileErrors.phone_number }}
                  </span>
                </div>

                <button type="submit" class="btn btn-primary">
                  Сохранить
                </button>
              </form>
            </div>
          </template>

          <template v-if="activeTab === 'password'">
            <div class="content-card">
              <h3 class="content-title">Изменить пароль</h3>
              
              <form @submit.prevent="handlePasswordSubmit" class="profile-form">
                <div class="form-group">
                  <label for="current_password" class="form-label">Текущий пароль</label>
                  <input
                    id="current_password"
                    v-model="passwordForm.current_password"
                    type="password"
                    class="form-input"
                    :class="{ 'input-error': passwordErrors.current_password }"
                  />
                  <span v-if="passwordErrors.current_password" class="error-text">
                    {{ passwordErrors.current_password }}
                  </span>
                </div>

                <div class="form-group">
                  <label for="new_password" class="form-label">Новый пароль</label>
                  <input
                    id="new_password"
                    v-model="passwordForm.new_password"
                    type="password"
                    class="form-input"
                    :class="{ 'input-error': passwordErrors.new_password }"
                  />
                  <span v-if="passwordErrors.new_password" class="error-text">
                    {{ passwordErrors.new_password }}
                  </span>
                </div>

                <div class="form-group">
                  <label for="confirm_password" class="form-label">Подтвердите новый пароль</label>
                  <input
                    id="confirm_password"
                    v-model="passwordForm.confirm_password"
                    type="password"
                    class="form-input"
                    :class="{ 'input-error': passwordErrors.confirm_password }"
                  />
                  <span v-if="passwordErrors.confirm_password" class="error-text">
                    {{ passwordErrors.confirm_password }}
                  </span>
                </div>

                <button type="submit" class="btn btn-primary">
                  Изменить пароль
                </button>
              </form>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.page-header {
  margin-bottom: 2rem;
}

.back-link {
  background: none;
  border: none;
  color: #2563eb;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
  margin-bottom: 1rem;
  display: inline-block;
}

.back-link:hover {
  text-decoration: underline;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
}

.profile-container {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 2rem;
}

.profile-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.profile-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.profile-avatar {
  font-size: 4rem;
  width: 100px;
  height: 100px;
  background: #f3f4f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}

.profile-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.25rem;
}

.profile-login {
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.profile-meta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.role-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
}

.role-admin {
  background: #dbeafe;
  color: #1e40af;
}

.role-client {
  background: #f3f4f6;
  color: #374151;
}

.joined-date {
  color: #9ca3af;
  font-size: 0.75rem;
}

.profile-nav {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.nav-item {
  display: block;
  width: 100%;
  padding: 1rem 1.5rem;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 500;
  color: #4b5563;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}

.nav-item:hover {
  background: #f9fafb;
}

.nav-item.active {
  background: #eff6ff;
  color: #2563eb;
  border-left-color: #2563eb;
}

.profile-content {
  min-width: 0;
}

.content-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.content-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-weight: 500;
  color: #374151;
}

.form-input {
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.input-error {
  border-color: #dc2626;
}

.error-text {
  color: #dc2626;
  font-size: 0.875rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  align-self: flex-start;
}

.btn-primary {
  background: #2563eb;
  color: white;
}

.btn-primary:hover {
  background: #1d4ed8;
}

@media (max-width: 768px) {
  .profile-container {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
