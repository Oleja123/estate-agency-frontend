import { defineStore } from 'pinia'
import { ref } from 'vue'
import { propertyTypesApi } from '../api'

export const usePropertyTypesStore = defineStore('propertyTypes', () => {
  const propertyTypes = ref([])
  const currentType = ref(null)
  const total = ref(0)
  const loading = ref(false)
  const error = ref(null)

  async function fetchPropertyTypes(params = {}) {
    loading.value = true
    error.value = null

    try {
      const response = await propertyTypesApi.getAll(params)
      propertyTypes.value = response.data.types || []
      total.value = response.data.total || 0
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

    try {
      const response = await propertyTypesApi.create(name)
      await fetchPropertyTypes()
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to create property type'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updatePropertyType(id, name) {
    loading.value = true
    error.value = null

    try {
      await propertyTypesApi.update(id, name)
      await fetchPropertyTypes()
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to update property type'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deletePropertyType(id) {
    loading.value = true
    error.value = null

    try {
      await propertyTypesApi.delete(id)
      await fetchPropertyTypes()
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to delete property type'
      throw err
    } finally {
      loading.value = false
    }
  }

  function clearError() {
    error.value = null
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
    clearError
  }
})
