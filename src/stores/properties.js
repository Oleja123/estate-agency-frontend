import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { propertiesApi } from '../api'
import paginationConfig from '../config/pagination'
import formatApiErrorResponse from '../utils/apiErrors'

export const usePropertiesStore = defineStore('properties', () => {
  const properties = ref([])
  const currentProperty = ref(null)
  const total = ref(0)
  const loading = ref(false)
  const error = ref(null)
  const fieldErrors = ref({})
  const filters = ref({
    limit: paginationConfig.properties,
    offset: 0,
    type_id: null,
    transaction_type: null,
    city: null,
    property_status: null,
    min_price: null,
    max_price: null,
    min_area: null,
    max_area: null,
    search: null
    ,
    // location-based filtering
    latitude: null,
    longitude: null,
    radius_km: null
  })

  const currentPage = computed(() => Math.floor(filters.value.offset / filters.value.limit) + 1)
  const totalPages = computed(() => Math.ceil(total.value / filters.value.limit))

  // Use shared error formatter

  async function fetchProperties(customParams = {}) {
    loading.value = true
    error.value = null

    try {
      const params = { ...filters.value, ...customParams }
      // Remove null/undefined values
      Object.keys(params).forEach(key => {
        if (params[key] === null || params[key] === undefined || params[key] === '') {
          delete params[key]
        }
      })

      const response = await propertiesApi.getAll(params)
      properties.value = response.data.properties || []
      total.value = response.data.total || 0
      return response.data
    } catch (err) {
      const parsed = formatApiErrorResponse(err.response, { context: 'fetchProperties' })
      fieldErrors.value = parsed.fields || {}
      error.value = parsed.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchProperty(id) {
    loading.value = true
    error.value = null

    try {
      const response = await propertiesApi.getById(id)
      currentProperty.value = response.data
      return response.data
    } catch (err) {
      const parsed = formatApiErrorResponse(err.response, { context: 'fetchProperty' })
      fieldErrors.value = parsed.fields || {}
      error.value = parsed.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createProperty(data) {
    loading.value = true
    error.value = null

    try {
      // clear previous field errors
      fieldErrors.value = {}
      const response = await propertiesApi.create(data)
      // Success (201)
      if (response && response.status === 201) {
        // optionally refresh list
        await fetchProperties()
        return response.data
      }
      // Unexpected but return data
      return response.data
    } catch (err) {
      const parsed = formatApiErrorResponse(err.response, { context: 'createProperty' })
      fieldErrors.value = parsed.fields || {}
      error.value = parsed.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateProperty(id, data) {
    loading.value = true
    error.value = null

    try {
      fieldErrors.value = {}
      const response = await propertiesApi.update(id, data)
      // Success (200) — update currentProperty if backend returned it
      if (response && response.status === 200) {
        if (response.data) {
          currentProperty.value = response.data
        }
        // refresh list to reflect changes in listing
        await fetchProperties()
        return response.data
      }
      return response.data
    } catch (err) {
      const parsed = formatApiErrorResponse(err.response, { context: 'updateProperty' })
      fieldErrors.value = parsed.fields || {}
      error.value = parsed.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteProperty(id) {
    loading.value = true
    error.value = null

    try {
      await propertiesApi.delete(id)
      await fetchProperties()
    } catch (err) {
      const parsed = formatApiErrorResponse(err.response, { context: 'deleteProperty' })
      fieldErrors.value = parsed.fields || {}
      error.value = parsed.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function toggleFavorite(id) {
    try {
      const response = await propertiesApi.toggleFavorite(id)
      return response
    } catch (err) {
      const parsed = formatApiErrorResponse(err.response, { context: 'toggleFavorite' })
      fieldErrors.value = parsed.fields || {}
      error.value = parsed.message
      throw err
    }
  }

  async function uploadImages(id, files) {
    loading.value = true
    error.value = null

    try {
      await propertiesApi.uploadImages(id, files)
    } catch (err) {
      const parsed = formatApiErrorResponse(err.response, { context: 'uploadImages' })
      fieldErrors.value = parsed.fields || {}
      error.value = parsed.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function getImages(id) {
    try {
      const response = await propertiesApi.getImages(id)
      return response.data
    } catch (err) {
      const parsed = formatApiErrorResponse(err.response, { context: 'getImages' })
      fieldErrors.value = parsed.fields || {}
      error.value = parsed.message
      throw err
    }
  }

  function setFilters(newFilters) {
    filters.value = { ...filters.value, ...newFilters }
  }

  function resetFilters() {
    filters.value = {
      limit: paginationConfig.properties,
      offset: 0,
      type_id: null,
      transaction_type: null,
      city: null,
      property_status: null,
      min_price: null,
      max_price: null,
      min_area: null,
      max_area: null,
      search: null
      ,
      latitude: null,
      longitude: null,
      radius_km: null
    }
  }

  function setPage(page) {
    filters.value.offset = (page - 1) * filters.value.limit
  }

  function clearError() {
    error.value = null
    fieldErrors.value = {}
  }

  function clearFieldErrors() {
    fieldErrors.value = {}
  }

  return {
    properties,
    currentProperty,
    total,
    loading,
    error,
    fieldErrors,
    filters,
    currentPage,
    totalPages,
    fetchProperties,
    fetchProperty,
    createProperty,
    updateProperty,
    deleteProperty,
    toggleFavorite,
    uploadImages,
    getImages,
    setFilters,
    resetFilters,
    setPage,
    clearError,
    clearFieldErrors
  }
})
