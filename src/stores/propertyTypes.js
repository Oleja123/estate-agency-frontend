import { defineStore } from 'pinia'
import { ref } from 'vue'
import { propertyTypesApi } from '../api'
import paginationConfig from '../config/pagination'

export const usePropertyTypesStore = defineStore('propertyTypes', () => {
  const propertyTypes = ref([])
  const currentType = ref(null)
  const total = ref(0)
  const loading = ref(false)
  const error = ref(null)
  const fieldErrors = ref({})

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
      error.value = err.response?.data?.message || 'Failed to fetch property types'
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
      error.value = err.response?.data?.message || 'Failed to fetch property type'
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
      const status = err.response?.status
      const data = err.response?.data

      // parse field errors if present
      if (data && typeof data === 'object') {
        const errorsObj = data.errors || data
        const fields = {}
        for (const [k, v] of Object.entries(errorsObj)) {
          fields[k] = Array.isArray(v) ? v.join(', ') : v
        }
        fieldErrors.value = Object.keys(fields).length ? fields : {}
      }

      if (status === 400) {
        error.value = data?.message || 'Validation failed. Check the form fields.'
      } else if (status === 401) {
        error.value = 'Authentication required. Please log in.'
      } else if (status === 403) {
        error.value = 'Access denied. You do not have permission.'
      } else if (status === 409) {
        error.value = data?.message || 'Property type with this name already exists.'
      } else if (status === 500) {
        error.value = 'Server error. Please try again later.'
      } else {
        error.value = data?.message || 'Failed to create property type'
      }

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
      const status = err.response?.status
      const data = err.response?.data

      if (data && typeof data === 'object') {
        const errorsObj = data.errors || data
        const fields = {}
        for (const [k, v] of Object.entries(errorsObj)) {
          fields[k] = Array.isArray(v) ? v.join(', ') : v
        }
        fieldErrors.value = Object.keys(fields).length ? fields : {}
      }

      if (status === 400) {
        error.value = data?.message || 'Validation failed. Check the form fields.'
      } else if (status === 401) {
        error.value = 'Authentication required. Please log in.'
      } else if (status === 403) {
        error.value = 'Access denied. You do not have permission.'
      } else if (status === 409) {
        error.value = data?.message || 'Conflict: property type already exists.'
      } else if (status === 500) {
        error.value = 'Server error. Please try again later.'
      } else {
        error.value = data?.message || 'Failed to update property type'
      }

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
      const status = err.response?.status

      if (status === 401) {
        error.value = 'Authentication required. Please log in.'
      } else if (status === 403) {
        error.value = 'You do not have permission to delete this type.'
      } else if (status === 409) {
        error.value = 'Cannot delete this type because it is in use.'
      } else if (status === 500) {
        error.value = 'An unexpected error occurred. Please try again later.'
      } else {
        error.value = 'Failed to delete property type. Please try again.'
      }

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
    clearError
  }
})
