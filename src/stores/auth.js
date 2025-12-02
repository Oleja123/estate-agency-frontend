import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi, usersApi } from '../api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('user')) || null)
  const accessToken = ref(localStorage.getItem('access_token') || null)
  const refreshToken = ref(localStorage.getItem('refresh_token') || null)
  const loading = ref(false)
  const error = ref(null)

  const isAuthenticated = computed(() => !!accessToken.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const currentUserId = computed(() => user.value?.id)

  async function login(email, password) {
    loading.value = true
    error.value = null

    try {
      const response = await authApi.login(email, password)
      const data = response.data

      user.value = data.user
      accessToken.value = data.access_token
      refreshToken.value = data.refresh_token

      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('refresh_token', data.refresh_token)

      return data
    } catch (err) {
      error.value = err.response?.data?.message || 'Login failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function register(userData) {
    loading.value = true
    error.value = null

    try {
      const response = await authApi.register(userData)
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Registration failed'
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
      logout()
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

  function logout() {
    user.value = null
    accessToken.value = null
    refreshToken.value = null
    error.value = null

    localStorage.removeItem('user')
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }

  function clearError() {
    error.value = null
  }

  return {
    user,
    accessToken,
    refreshToken,
    loading,
    error,
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
