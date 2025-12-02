import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { propertiesApi } from '../api'
import paginationConfig from '../config/pagination'

export const usePropertiesStore = defineStore('properties', () => {
  const properties = ref([])
  const currentProperty = ref(null)
  const total = ref(0)
  const loading = ref(false)
  const error = ref(null)
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
      error.value = err.response?.data?.message || 'Failed to fetch properties'
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
      error.value = err.response?.data?.message || 'Failed to fetch property'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createProperty(data) {
    loading.value = true
    error.value = null

    try {
      const response = await propertiesApi.create(data)
      await fetchProperties()
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to create property'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateProperty(id, data) {
    loading.value = true
    error.value = null

    try {
      await propertiesApi.update(id, data)
      await fetchProperties()
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to update property'
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
      error.value = err.response?.data?.message || 'Failed to delete property'
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
      error.value = err.response?.data?.message || 'Failed to toggle favorite'
      throw err
    }
  }

  async function uploadImages(id, files) {
    loading.value = true
    error.value = null

    try {
      await propertiesApi.uploadImages(id, files)
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to upload images'
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
      error.value = err.response?.data?.message || 'Failed to get images'
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
  }

  return {
    properties,
    currentProperty,
    total,
    loading,
    error,
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
    clearError
  }
})
