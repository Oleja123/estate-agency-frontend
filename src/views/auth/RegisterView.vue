<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import AlertMessage from '../../components/common/AlertMessage.vue'

const router = useRouter()
const authStore = useAuthStore()

const form = ref({
  login: '',
  password: '',
  confirmPassword: '',
  first_name: '',
  last_name: '',
  phone_number: ''
})

const errors = ref({})
const showError = ref(false)
const showSuccess = ref(false)
// if backend returns field errors, authStore.fieldErrors will be used

function validateForm() {
  errors.value = {}
  
  if (!form.value.login) {
    errors.value.login = 'Login is required'
  }
  
    if (!form.value.password) {
      errors.value.password = 'Password is required'
    }
  
  if (form.value.password !== form.value.confirmPassword) {
    errors.value.confirmPassword = 'Passwords do not match'
  }
  
  if (!form.value.first_name) {
    errors.value.first_name = 'First name is required'
  }
  
  if (!form.value.last_name) {
    errors.value.last_name = 'Last name is required'
  }

  // Phone number is optional, but if provided must be valid
  if (form.value.phone_number) {
    const cleaned = String(form.value.phone_number).replace(/[^0-9+]/g, '')
    const phoneRegex = /^\+?\d{7,15}$/
    if (!phoneRegex.test(cleaned)) {
      errors.value.phone_number = 'Invalid phone number format'
    }
  }
  
  return Object.keys(errors.value).length === 0
}

async function handleSubmit() {
  if (!validateForm()) return
  
  showError.value = false
  showSuccess.value = false
  
  try {
    const { confirmPassword, ...userData } = form.value
    await authStore.register(userData)
    showSuccess.value = true
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  } catch (error) {
    // populate per-field errors if provided by backend
    if (authStore.fieldErrors && Object.keys(authStore.fieldErrors).length) {
      errors.value = { ...errors.value, ...authStore.fieldErrors }
    }

    // show global error only when API provided a top-level message
    showError.value = !!authStore.error
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
        <h1 class="auth-title">Create Account</h1>
        <p class="auth-subtitle">Register for a new account</p>
      </div>

      <AlertMessage
        v-if="showSuccess"
        type="success"
        message="Registration successful! Redirecting to login..."
        :dismissible="false"
      />

      <AlertMessage
        v-if="showError && authStore.error"
        type="error"
        :message="authStore.error"
        @dismiss="dismissError"
      />

      <form @submit.prevent="handleSubmit" class="auth-form">
        <div class="form-group">
          <label for="first_name" class="form-label">First Name</label>
          <input
            id="first_name"
            v-model="form.first_name"
            type="text"
            class="form-input"
            :class="{ 'input-error': errors.first_name }"
            placeholder="John"
          />
          <span v-if="errors.first_name" class="error-text">{{ errors.first_name }}</span>
        </div>

        <div class="form-group">
          <label for="last_name" class="form-label">Last Name</label>
          <input
            id="last_name"
            v-model="form.last_name"
            type="text"
            class="form-input"
            :class="{ 'input-error': errors.last_name }"
            placeholder="Doe"
          />
          <span v-if="errors.last_name" class="error-text">{{ errors.last_name }}</span>
        </div>

        <div class="form-group">
          <label for="login" class="form-label">Login</label>
          <input
            id="login"
            v-model="form.login"
            type="text"
            class="form-input"
            :class="{ 'input-error': errors.login }"
            placeholder="your login"
          />
          <span v-if="errors.login" class="error-text">{{ errors.login }}</span>
        </div>

        <div class="form-group">
          <label for="phone_number" class="form-label">Phone Number (Optional)</label>
          <input
            id="phone_number"
            v-model="form.phone_number"
            type="tel"
            class="form-input"
            :class="{ 'input-error': errors.phone_number }"
            placeholder="+1234567890"
          />
          <span v-if="errors.phone_number" class="error-text">{{ errors.phone_number }}</span>
        </div>

        <div class="form-group">
          <label for="password" class="form-label">Password</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            class="form-input"
            :class="{ 'input-error': errors.password }"
              placeholder="Enter password"
          />
          <span v-if="errors.password" class="error-text">{{ errors.password }}</span>
        </div>

        <div class="form-group">
          <label for="confirmPassword" class="form-label">Confirm Password</label>
          <input
            id="confirmPassword"
            v-model="form.confirmPassword"
            type="password"
            class="form-input"
            :class="{ 'input-error': errors.confirmPassword }"
            placeholder="Confirm your password"
          />
          <span v-if="errors.confirmPassword" class="error-text">{{ errors.confirmPassword }}</span>
        </div>

        <button
          type="submit"
          class="btn btn-primary btn-block"
          :disabled="authStore.loading"
        >
          {{ authStore.loading ? 'Creating account...' : 'Register' }}
        </button>
      </form>

      <div class="auth-footer">
        <p>
          Already have an account?
          <RouterLink to="/login" class="auth-link">Sign In</RouterLink>
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
  max-width: 500px;
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

@media (max-width: 500px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
