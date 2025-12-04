import { defineStore } from 'pinia'
import { ref } from 'vue'
import { usersApi } from '../api'
import formatApiErrorResponse from '../utils/apiErrors'
import paginationConfig from '../config/pagination'

export const useUsersStore = defineStore('users', () => {
  const users = ref([])
  const currentUser = ref(null)
  const favorites = ref([])
  const favoritesTotal = ref(0)
  // remember last used params for favorites pagination
  const favoritesLastParams = ref({ limit: 6, offset: 0 })
  const total = ref(0)
  const loading = ref(false)
  const error = ref(null)
  const fieldErrors = ref({})
  // remember last used params so calls without params keep pagination
  const lastParams = ref({ limit: paginationConfig.users, offset: 0 })

  // use shared utils.formatApiErrorResponse to parse API errors

  function resetLastParams(newParams = { limit: paginationConfig.users, offset: 0 }) {
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

      const parsed = formatApiErrorResponse(err.response, { context: 'fetchUsers' })
      fieldErrors.value = parsed.fields || {}
      error.value = parsed.message
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
      const parsed = formatApiErrorResponse(err.response, { context: 'fetchUser' })
      fieldErrors.value = parsed.fields || {}
      error.value = parsed.message
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
      const parsed = formatApiErrorResponse(err.response, { context: 'updateProfile' })
      fieldErrors.value = parsed.fields || {}
      error.value = parsed.message
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
      const parsed = formatApiErrorResponse(err.response, { context: 'changePassword' })
      fieldErrors.value = parsed.fields || {}
      error.value = parsed.message
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
      const parsed = formatApiErrorResponse(err.response, { context: 'changeUserPasswordAdmin' })
      fieldErrors.value = parsed.fields || {}
      error.value = parsed.message
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
      const parsed = formatApiErrorResponse(err.response, { context: 'changeRole' })
      fieldErrors.value = parsed.fields || {}
      error.value = parsed.message
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
      const parsed = formatApiErrorResponse(err.response, { context: 'toggleActive' })
      fieldErrors.value = parsed.fields || {}
      error.value = parsed.message
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
      const parsed = formatApiErrorResponse(err.response, { context: 'deleteUser' })
      fieldErrors.value = parsed.fields || {}
      error.value = parsed.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchFavorites(userId, params = {}) {
    // separate loading/error for favorites would be cleaner, but reuse general flags
    loading.value = true
    error.value = null

    // merge with last params so callers that don't pass pagination keep it
    const merged = { ...favoritesLastParams.value, ...params }
    const cleaned = { ...merged }
    Object.keys(cleaned).forEach((k) => {
      if (cleaned[k] === '' || cleaned[k] === null || cleaned[k] === undefined) {
        delete cleaned[k]
      }
    })
    favoritesLastParams.value = { ...cleaned }

    try {
      const response = await usersApi.getFavorites(userId, cleaned)
      // normalize response shapes: items + total
      const d = response.data
      let items = []
      if (Array.isArray(d)) {
        items = d
      } else if (Array.isArray(d.favorites)) {
        items = d.favorites
      } else if (Array.isArray(d.data)) {
        items = d.data
      } else if (Array.isArray(d.items)) {
        items = d.items
      } else if (Array.isArray(d.results)) {
        items = d.results
      }

      // total from body or headers
      let tot = d?.total ?? d?.count ?? d?.meta?.total ?? response.headers?.['x-total-count'] ?? items.length
      tot = Number(tot) || 0

      favorites.value = items
      favoritesTotal.value = tot
      return { items, total: tot }
    } catch (err) {
      const parsed = formatApiErrorResponse(err.response, { context: 'fetchFavorites' })
      fieldErrors.value = parsed.fields || {}
      error.value = parsed.message
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
