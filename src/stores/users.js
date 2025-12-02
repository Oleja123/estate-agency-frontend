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
  const fieldErrors = ref({})
  // remember last used params so calls without params keep pagination
  const lastParams = ref({ limit: 3, offset: 0 })

  function resetLastParams(newParams = { limit: 3, offset: 0 }) {
    lastParams.value = { ...newParams }
  }

  async function fetchUsers(params = {}) {
    loading.value = true
    error.value = null

    // merge with last params so callers that don't pass pagination keep it
    const merged = { ...lastParams.value, ...params }
    // clean merged params: remove empty-string / null / undefined so cleared filters are removed
    const cleaned = { ...merged }
    Object.keys(cleaned).forEach((k) => {
      if (cleaned[k] === '' || cleaned[k] === null || cleaned[k] === undefined) {
        delete cleaned[k]
      }
    })
    lastParams.value = { ...cleaned }
    console.log('[UsersStore] fetchUsers called with params:', params, ' merged ->', merged, ' cleaned ->', cleaned)

    try {
      const response = await usersApi.getAll(cleaned)
      console.log('[UsersStore] fetchUsers response:', response?.data)
      users.value = response.data.users || []
      total.value = response.data.total || 0
      console.log('[UsersStore] users.length =', users.value.length, ' total =', total.value)
      return response.data
    } catch (err) {
      try {
        console.error('[UsersStore] fetchUsers error:', {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
          config: err.config
        })
      } catch (logErr) {
        console.error('[UsersStore] fetchUsers error (logging failed):', logErr)
      }

      const status = err.response?.status
      const apiMessage = err.response?.data?.message || err.response?.data || null
      error.value = apiMessage || (status ? `Failed to fetch users (${status})` : 'Failed to fetch users')
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
    fieldErrors.value = {}
    try {
      await usersApi.updateProfile(id, data)
    } catch (err) {
      // parse field errors if present
      const data = err.response?.data
      if (data && typeof data === 'object') {
        const errorsObj = data.errors || data
        const fields = {}
        for (const [k, v] of Object.entries(errorsObj)) {
          fields[k] = Array.isArray(v) ? v.join(', ') : v
        }
        fieldErrors.value = Object.keys(fields).length ? fields : {}
      }
      error.value = err.response?.data?.message || 'Failed to update profile'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function changePassword(id, currentPassword, newPassword) {
    loading.value = true
    error.value = null
    fieldErrors.value = {}

    try {
      await usersApi.changePassword(id, currentPassword, newPassword)
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') {
        const errorsObj = data.errors || data
        const fields = {}
        for (const [k, v] of Object.entries(errorsObj)) {
          fields[k] = Array.isArray(v) ? v.join(', ') : v
        }
        fieldErrors.value = Object.keys(fields).length ? fields : {}
      }
      error.value = err.response?.data?.message || 'Failed to change password'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function changeUserPasswordAdmin(id, newPassword) {
    loading.value = true
    error.value = null
    fieldErrors.value = {}

    try {
      const response = await usersApi.changeUserPasswordAdmin(id, newPassword)
      const updated = response?.data
      if (updated) {
        const idx = users.value.findIndex(u => u.id === updated.id)
        if (idx !== -1) users.value.splice(idx, 1, updated)
        else users.value.unshift(updated)
      }
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') {
        const errorsObj = data.errors || data
        const fields = {}
        for (const [k, v] of Object.entries(errorsObj)) {
          fields[k] = Array.isArray(v) ? v.join(', ') : v
        }
        fieldErrors.value = Object.keys(fields).length ? fields : {}
      }
      error.value = err.response?.data?.message || 'Failed to change user password'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function changeRole(id, role) {
    loading.value = true
    error.value = null

    try {
      const response = await usersApi.changeRole(id, role)
      // API returns the updated entity — update it locally instead of refetching
      const updated = response?.data
      if (updated) {
        const idx = users.value.findIndex(u => u.id === updated.id)
        if (idx !== -1) users.value.splice(idx, 1, updated)
        else users.value.unshift(updated)
      }
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
      const response = await usersApi.toggleActive(id)
      const updated = response?.data
      if (updated) {
        const idx = users.value.findIndex(u => u.id === updated.id)
        if (idx !== -1) users.value.splice(idx, 1, updated)
        else users.value.unshift(updated)
      }
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
      const response = await usersApi.delete(id)
      // If API returns deleted entity, remove it; otherwise remove by id
      const returned = response?.data
      if (returned && returned.id) {
        const idx = users.value.findIndex(u => u.id === returned.id)
        if (idx !== -1) users.value.splice(idx, 1)
      } else {
        const idx = users.value.findIndex(u => u.id === id)
        if (idx !== -1) users.value.splice(idx, 1)
      }
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
    fieldErrors.value = {}
  }

  return {
    users,
    currentUser,
    favorites,
    total,
    loading,
    error,
    fieldErrors,
    fetchUsers,
    resetLastParams,
    changeUserPasswordAdmin,
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
