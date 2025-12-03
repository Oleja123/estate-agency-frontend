<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import AlertMessage from '../../components/common/AlertMessage.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const form = ref({
  login: '',
  password: ''
})

const errors = ref({})
const showError = ref(false)

function validateForm() {
  errors.value = {}

  if (!form.value.login) {
    errors.value.login = 'Login is required'
  }

  if (!form.value.password) {
    errors.value.password = 'Password is required'
  }

  return Object.keys(errors.value).length === 0
}

async function handleSubmit() {
  if (!validateForm()) return
  
  showError.value = false
  // clear previous server-side errors
  authStore.clearError()
  
  try {
    await authStore.login(form.value.login, form.value.password)
    const redirect = route.query.redirect || '/'
    router.push(redirect)
  } catch (error) {
    // populate per-field errors from store if available
    if (authStore.fieldErrors && Object.keys(authStore.fieldErrors).length) {
      errors.value = { ...errors.value, ...authStore.fieldErrors }
    }
    // always show global error if available
    showError.value = !!authStore.error || Object.keys(errors.value).length === 0
  }
}

function dismissError() {
  showError.value = false
  authStore.clearError()
}
</script>

<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <h1 class="auth-title">Welcome Back</h1>
        <p class="auth-subtitle">Sign in to your account</p>
      </div>

      <AlertMessage
        v-if="showError && authStore.error"
        type="error"
        :message="authStore.error"
        @dismiss="dismissError"
      />

      <form @submit.prevent="handleSubmit" class="auth-form">
        <div class="form-group">
          <label for="login" class="form-label">Login</label>
          <input
            id="login"
            v-model="form.login"
            type="text"
            class="form-input"
            :class="{ 'input-error': errors.login || authStore.fieldErrors?.login }"
            placeholder="Enter your login"
          />
          <span v-if="errors.login" class="error-text">{{ errors.login }}</span>
          <span v-else-if="authStore.fieldErrors && authStore.fieldErrors.login" class="error-text">{{ authStore.fieldErrors.login }}</span>
        </div>

        <div class="form-group">
          <label for="password" class="form-label">Password</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            class="form-input"
            :class="{ 'input-error': errors.password || authStore.fieldErrors?.password }"
            placeholder="Enter your password"
          />
          <span v-if="errors.password" class="error-text">{{ errors.password }}</span>
          <span v-else-if="authStore.fieldErrors && authStore.fieldErrors.password" class="error-text">{{ authStore.fieldErrors.password }}</span>
        </div>

        <button
          type="submit"
          class="btn btn-primary btn-block"
          :disabled="authStore.loading"
        >
          {{ authStore.loading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>

      <div class="auth-footer">
        <p>
          Don't have an account?
          <RouterLink to="/register" class="auth-link">Register</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-container {
  min-height: calc(100vh - 200px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.auth-card {
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  padding: 2rem;
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.5rem;
}

.auth-subtitle {
  color: #6b7280;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
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
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background: #2563eb;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1d4ed8;
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-block {
  width: 100%;
}

.auth-footer {
  text-align: center;
  margin-top: 1.5rem;
  color: #6b7280;
}

.auth-link {
  color: #2563eb;
  font-weight: 500;
  text-decoration: none;
}

.auth-link:hover {
  text-decoration: underline;
}
</style>
