import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi, usersApi } from '../api'
import formatApiErrorResponse from '../utils/apiErrors'
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
      const parsed = formatApiErrorResponse(err.response, { context: 'login' })
      // For authentication failures prefer a clear credential error
      if (err.response?.status === 401) {
        parsed.message = err.response?.data?.message || 'Неверный логин или пароль'
      }
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
      const parsed = formatApiErrorResponse(err.response, { context: 'register' })
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

  // parseApiError removed in favor of shared formatApiErrorResponse

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
