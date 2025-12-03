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

  // Helper: map backend responses to safe, user-friendly messages
  function handleResponseError(resp, opts = { context: 'request' }) {
    // log full response for debugging (not shown to user)
    try { console.error('[properties] API error', opts.context, resp?.status, resp?.data) } catch (e) {}

    // default network error
    if (!resp) return 'Сетевой или транспортный сбой. Проверьте подключение.'

    // extract structured field errors if present (Swagger: ErrorResponse.details)
    const details = resp.data?.details || resp.data?.fieldErrors || resp.data?.errors || {}
    fieldErrors.value = details || {}

    const status = resp.status
    // map status codes to user-friendly, non-sensitive messages
    switch (status) {
      case 400:
        return 'Некорректный запрос. Проверьте введённые данные.'
      case 401:
        return 'Требуется авторизация. Пожалуйста, войдите в систему.'
      case 403:
        return 'Недостаточно прав для выполнения операции.'
      case 404:
        return 'Запрошенный ресурс не найден.'
      case 409:
        return 'Конфликт данных. Возможно, запись уже существует.'
      case 422:
        // Geocoding specific errors — show a friendly explanation
        if (resp.data?.error || resp.data?.details) {
          return 'Не удалось определить координаты по указанному адресу. Проверьте адрес и попробуйте снова.'
        }
        return 'Невозможно обработать запрос. Проверьте входные данные.'
      case 502:
        return 'Внешний сервис геокодирования временно недоступен. Повторите попытку позже.'
      case 500:
      default:
        return 'Внутренняя ошибка сервера. Попробуйте позже.'
    }
  }

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
      const resp = err.response
      error.value = handleResponseError(resp, { context: 'fetchProperties' })
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
      const resp = err.response
      error.value = handleResponseError(resp, { context: 'fetchProperty' })
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
      const resp = err.response
      error.value = handleResponseError(resp, { context: 'createProperty' })
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
      const resp = err.response
      error.value = handleResponseError(resp, { context: 'updateProperty' })
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
      const resp = err.response
      error.value = handleResponseError(resp, { context: 'deleteProperty' })
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
      const resp = err.response
      error.value = handleResponseError(resp, { context: 'toggleFavorite' })
      throw err
    }
  }

  async function uploadImages(id, files) {
    loading.value = true
    error.value = null

    try {
      await propertiesApi.uploadImages(id, files)
    } catch (err) {
      const resp = err.response
      error.value = handleResponseError(resp, { context: 'uploadImages' })
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
      const resp = err.response
      error.value = handleResponseError(resp, { context: 'getImages' })
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
