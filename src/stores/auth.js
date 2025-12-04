import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi, usersApi } from '../api'
import router from '../router'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('user')) || null)
  const accessToken = ref(localStorage.getItem('access_token') || null)
  const refreshToken = ref(localStorage.getItem('refresh_token') || null)
  const loading = ref(false)
  const error = ref(null)
  const fieldErrors = ref({})

  const isAuthenticated = computed(() => !!accessToken.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const currentUserId = computed(() => user.value?.id)

  async function login(login, password) {
    loading.value = true
    error.value = null
    fieldErrors.value = {}

    try {
      const response = await authApi.login(login, password)
      const data = response.data

      user.value = data.user
      accessToken.value = data.access_token
      refreshToken.value = data.refresh_token

      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('refresh_token', data.refresh_token)

      return data
    } catch (err) {
      // parse backend error into user-friendly message and field-specific errors
      const parsed = parseApiError(err)
      error.value = parsed.message || 'Login failed'
      fieldErrors.value = parsed.fields || {}
      throw err
    } finally {
      loading.value = false
    }
  }

  async function register(userData) {
    loading.value = true
    error.value = null
    fieldErrors.value = {}

    try {
      const response = await authApi.register(userData)
      return response.data
    } catch (err) {
      const parsed = parseApiError(err)
      error.value = parsed.message || 'Registration failed'
      fieldErrors.value = parsed.fields || {}
      throw err
    } finally {
      loading.value = false
    }
  }

  async function refreshTokens() {
    if (!refreshToken.value) {
      throw new Error('No refresh token available')
    }

    try {
      const response = await authApi.refreshToken(refreshToken.value)
      const data = response.data

      user.value = data.user
      accessToken.value = data.access_token
      refreshToken.value = data.refresh_token

      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('refresh_token', data.refresh_token)

      return data
    } catch (err) {
      await logout()
      throw err
    }
  }

  async function updateCurrentUser() {
    if (!user.value?.id) return

    try {
      const response = await usersApi.getById(user.value.id)
      user.value = response.data
      localStorage.setItem('user', JSON.stringify(response.data))
    } catch (err) {
      console.error('Failed to update current user:', err)
    }
  }

  async function logout() {
    loading.value = true
    try {
      // attempt to inform backend to revoke refresh token; ignore network errors
      if (refreshToken.value) {
        try {
          await authApi.logout(refreshToken.value)
        } catch (e) {
          // Log but don't block logout flow; server may already have invalidated token
          console.warn('logout API call failed:', e)
        }
      }
    } finally {
      // clear local auth state regardless of API result
      user.value = null
      accessToken.value = null
      refreshToken.value = null
      error.value = null
      fieldErrors.value = {}

      localStorage.removeItem('user')
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')

      loading.value = false
      // navigate to login page after logout
      try {
        router.push({ name: 'login' })
      } catch (e) {
        console.warn('Router navigation to login failed:', e)
      }
    }
  }

  function clearError() {
    error.value = null
    fieldErrors.value = {}
  }

  function parseApiError(err) {
    const data = err.response?.data
    const status = err.response?.status
    let message = err.message || null
    const fields = {}

    // Map status codes to user-friendly messages
    if (status === 401) {
      // Unauthorized — typically bad credentials
      message = data?.message || 'Incorrect login or password'
      if (!data?.errors && !data?.login && !data?.password) {
        // provide a helpful field error hint
        fields.password = 'Incorrect password or login'
      }
    } else if (status === 404) {
      // Not found — user/resource missing
      message = data?.message || 'User not found'
      if (!data?.errors) {
        fields.login = 'User with this login not found'
      }
    } else if (status === 500) {
      message = data?.message || 'Server error, please try again later'
    } else if (status === 409) {
      // Conflict — typically resource already exists (e.g. login taken)
      message = data?.message || 'User with this login already exists'
      // If API didn't provide structured errors, provide a helpful hint for the login field
      if (!data?.errors) {
        fields.login = data?.field || 'User with this login already exists'
      }
    } else if (status === 400) {
      // Bad request — likely validation errors
      message = data?.message || 'Validation failed'
    } else {
      // Fallback: prefer API-provided message or detail
      if (!data) return { message: message || null, fields: null }
      if (typeof data === 'string') {
        message = data
      } else if (data.message) {
        message = data.message
      } else if (data.detail) {
        message = data.detail
      }
    }

    // Extract field errors when present (API patterns: { errors: {...} } or { field: [...] })
    const errorsObj = data?.errors || data
    if (errorsObj && typeof errorsObj === 'object') {
      for (const [k, v] of Object.entries(errorsObj)) {
        const outKey = k === 'email' ? 'login' : k
        if (Array.isArray(v)) {
          fields[outKey] = v.join(', ')
        } else if (typeof v === 'string') {
          fields[outKey] = v
        }
      }
    }

    return { message, fields: Object.keys(fields).length ? fields : null }
  }

  return {
    user,
    accessToken,
    refreshToken,
    loading,
    error,
    fieldErrors,
    isAuthenticated,
    isAdmin,
    currentUserId,
    login,
    register,
    refreshTokens,
    updateCurrentUser,
    logout,
    clearError
  }
})
