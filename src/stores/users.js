import { defineStore } from 'pinia'
import { ref } from 'vue'
import { usersApi } from '../api'

export const useUsersStore = defineStore('users', () => {
  const users = ref([])
  const currentUser = ref(null)
  const favorites = ref([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref(null)

  async function fetchUsers(params = {}) {
    loading.value = true
    error.value = null

    try {
      const response = await usersApi.getAll(params)
      users.value = response.data.users || []
      total.value = response.data.total || 0
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch users'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchUser(id) {
    loading.value = true
    error.value = null

    try {
      const response = await usersApi.getById(id)
      currentUser.value = response.data
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch user'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateProfile(id, data) {
    loading.value = true
    error.value = null

    try {
      await usersApi.updateProfile(id, data)
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to update profile'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function changePassword(id, currentPassword, newPassword) {
    loading.value = true
    error.value = null

    try {
      await usersApi.changePassword(id, currentPassword, newPassword)
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to change password'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function changeRole(id, role) {
    loading.value = true
    error.value = null

    try {
      await usersApi.changeRole(id, role)
      await fetchUsers()
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to change role'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function toggleActive(id) {
    loading.value = true
    error.value = null

    try {
      await usersApi.toggleActive(id)
      await fetchUsers()
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to toggle user status'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteUser(id) {
    loading.value = true
    error.value = null

    try {
      await usersApi.delete(id)
      await fetchUsers()
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to delete user'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchFavorites(userId) {
    loading.value = true
    error.value = null

    try {
      const response = await usersApi.getFavorites(userId)
      favorites.value = response.data || []
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch favorites'
      throw err
    } finally {
      loading.value = false
    }
  }

  function clearError() {
    error.value = null
  }

  return {
    users,
    currentUser,
    favorites,
    total,
    loading,
    error,
    fetchUsers,
    fetchUser,
    updateProfile,
    changePassword,
    changeRole,
    toggleActive,
    deleteUser,
    fetchFavorites,
    clearError
  }
})
