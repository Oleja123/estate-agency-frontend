import { defineStore } from 'pinia'
import { ref } from 'vue'
import { propertyTypesApi } from '../api'
import paginationConfig from '../config/pagination'
import formatApiErrorResponse from '../utils/apiErrors'

export const usePropertyTypesStore = defineStore('propertyTypes', () => {
  const propertyTypes = ref([])
  const currentType = ref(null)
  const total = ref(0)
  const loading = ref(false)
  const error = ref(null)
  const fieldErrors = ref({})

  // Use shared error formatter

  async function fetchPropertyTypes(params = {}) {
    loading.value = true
    error.value = null

    try {
      // prepare effective params and ensure default limit
      const effective = { ...params }
      if (effective.limit === undefined || effective.limit === null) {
        effective.limit = paginationConfig.propertyTypes
      }
      // clean params: remove empty-string / null / undefined so cleared filters are removed
      const cleaned = { ...effective }
      Object.keys(cleaned).forEach((k) => {
        if (cleaned[k] === '' || cleaned[k] === null || cleaned[k] === undefined) {
          delete cleaned[k]
        }
      })

      const response = await propertyTypesApi.getAll(cleaned)
        propertyTypes.value = response.data.types || []
        let tot = response.data.total || 0
        // total can be in different places
        tot = tot ?? response.data.count ?? response.data.meta?.total ?? response.data.meta?.pagination?.total ?? response.data._meta?.total ?? propertyTypes.value.length

        // sometimes backend sends total in headers (e.g. x-total-count)
        try {
          const hdr = response.headers?.['x-total-count'] || response.headers?.['X-Total-Count']
          if ((!tot || Number.isNaN(Number(tot))) && hdr) {
            const parsed = parseInt(hdr, 10)
            if (!Number.isNaN(parsed)) tot = parsed
          }
        } catch (e) {
          // ignore header parsing errors
        }

        // ensure total is a number
        tot = Number(tot) || 0

        total.value = tot
      return response.data
    } catch (err) {
      const parsed = formatApiErrorResponse(err.response, { context: 'fetchPropertyTypes' })
      fieldErrors.value = parsed.fields || {}
      error.value = parsed.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchPropertyType(id) {
    loading.value = true
    error.value = null

    try {
      const response = await propertyTypesApi.getById(id)
      currentType.value = response.data
      return response.data
    } catch (err) {
      const parsed = formatApiErrorResponse(err.response, { context: 'fetchPropertyType' })
      fieldErrors.value = parsed.fields || {}
      error.value = parsed.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createPropertyType(name) {
    loading.value = true
    error.value = null
    fieldErrors.value = {}

    try {
      const response = await propertyTypesApi.create(name)
      // successful creation (201) — clear field errors and reload current list
      fieldErrors.value = {}
      await fetchPropertyTypes()
      return response.data
    } catch (err) {
      const parsed = formatApiErrorResponse(err.response, { context: 'createPropertyType' })
      fieldErrors.value = parsed.fields || {}
      error.value = parsed.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updatePropertyType(id, name) {
    loading.value = true
    error.value = null
    fieldErrors.value = {}

    try {
      const response = await propertyTypesApi.update(id, name)
      // success — clear field errors and reload
      fieldErrors.value = {}
      await fetchPropertyTypes()
      return response.data
    } catch (err) {
      const parsed = formatApiErrorResponse(err.response, { context: 'updatePropertyType' })
      fieldErrors.value = parsed.fields || {}
      error.value = parsed.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deletePropertyType(id) {
    loading.value = true
    error.value = null
    fieldErrors.value = {}

    try {
      const response = await propertyTypesApi.delete(id)
      // success — reload list
      await fetchPropertyTypes()
      return response.data
    } catch (err) {
      const parsed = formatApiErrorResponse(err.response, { context: 'deletePropertyType' })
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

  function clearFieldErrors() {
    fieldErrors.value = {}
  }
  return {
    propertyTypes,
    currentType,
    total,
    loading,
    error,
    fetchPropertyTypes,
    fetchPropertyType,
    createPropertyType,
    updatePropertyType,
    deletePropertyType,
    fieldErrors,
    clearError,
    clearFieldErrors
  }
})
