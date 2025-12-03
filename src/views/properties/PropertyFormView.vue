<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePropertiesStore } from '../../stores/properties'
import { usePropertyTypesStore } from '../../stores/propertyTypes'
import LoadingSpinner from '../../components/common/LoadingSpinner.vue'
import AlertMessage from '../../components/common/AlertMessage.vue'
import paginationConfig from '../../config/pagination'

const route = useRoute()
const router = useRouter()
const propertiesStore = usePropertiesStore()
const propertyTypesStore = usePropertyTypesStore()

const isEditMode = computed(() => route.name === 'property-edit')
const pageTitle = computed(() => isEditMode.value ? 'Edit Property' : 'Add Property')

const form = ref({
  title: '',
  property_description: '',
  type_id: '',
  transaction_type: 'sale',
  price: '',
  area: '',
  property_address: '',
  city: '',
  property_status: 'active'
})

const errors = ref({})
const loading = ref(false)
const success = ref(false)
const imageFiles = ref([])

const transactionTypes = ['sale', 'rent']
const propertyStatuses = ['active', 'sold', 'rented', 'inactive']

onMounted(async () => {
  await propertyTypesStore.fetchPropertyTypes({ limit: paginationConfig.lookup })
  
  if (isEditMode.value) {
    const id = parseInt(route.params.id)
    await propertiesStore.fetchProperty(id)
    if (propertiesStore.currentProperty) {
      const p = propertiesStore.currentProperty
      form.value = {
        title: p.title || '',
        property_description: p.property_description || '',
        type_id: p.type_id || '',
        transaction_type: p.transaction_type || 'sale',
        price: p.price || '',
        area: p.area || '',
        property_address: p.property_address || '',
        city: p.city || '',
        property_status: p.property_status || 'active'
      }
    }
  }
})

function validateForm() {
  errors.value = {}
  
  if (!form.value.title) {
    errors.value.title = 'Title is required'
  }
  
  if (!form.value.property_description) {
    errors.value.property_description = 'Description is required'
  }
  
  if (!form.value.type_id) {
    errors.value.type_id = 'Property type is required'
  }
  
  if (!form.value.price || form.value.price <= 0) {
    errors.value.price = 'Valid price is required'
  }
  
  if (!form.value.area || form.value.area <= 0) {
    errors.value.area = 'Valid area is required'
  }
  
  if (!form.value.property_address) {
    errors.value.property_address = 'Address is required'
  }
  
  if (!form.value.city) {
    errors.value.city = 'City is required'
  }
  
  return Object.keys(errors.value).length === 0
}

async function handleSubmit() {
  if (!validateForm()) return
  
  loading.value = true
  success.value = false
  
    try {
      // clear previous server-side field errors
      propertiesStore.clearFieldErrors()
      propertiesStore.clearError()
    const data = {
      ...form.value,
      type_id: parseInt(form.value.type_id),
      price: parseFloat(form.value.price),
      area: parseFloat(form.value.area)
    }
    
    if (isEditMode.value) {
      const id = parseInt(route.params.id)
      await propertiesStore.updateProperty(id, data)
      
      if (imageFiles.value.length > 0) {
        await propertiesStore.uploadImages(id, imageFiles.value)
      }
      
      router.push(`/properties/${id}`)
    } else {
      const newProperty = await propertiesStore.createProperty(data)
      
      if (imageFiles.value.length > 0 && newProperty?.id) {
        await propertiesStore.uploadImages(newProperty.id, imageFiles.value)
      }
      
      router.push('/properties')
    }
    
    success.value = true
  } catch (error) {
    console.error('Failed to save property:', error)
    // merge server-side field errors into local errors so they show next to inputs
    if (propertiesStore.fieldErrors && Object.keys(propertiesStore.fieldErrors).length) {
      for (const [k, v] of Object.entries(propertiesStore.fieldErrors)) {
        errors.value[k] = Array.isArray(v) ? v.join(', ') : v
      }
    }
  } finally {
    loading.value = false
  }
}

function handleFileChange(event) {
  const files = Array.from(event.target.files)
  imageFiles.value = files
}

function removeImage(index) {
  imageFiles.value.splice(index, 1)
}

function goBack() {
  router.back()
}
</script>

<template>
  <div class="property-form-page">
    <div class="page-header">
      <button @click="goBack" class="back-link">
        ← Back
      </button>
      <h1 class="page-title">{{ pageTitle }}</h1>
    </div>

    <LoadingSpinner v-if="propertiesStore.loading && isEditMode" message="Loading property..." />

    <AlertMessage
      v-if="propertiesStore.error"
      type="error"
      :message="propertiesStore.error"
      @dismiss="propertiesStore.clearError"
    />

    <AlertMessage
      v-if="success"
      type="success"
      :message="isEditMode ? 'Property updated successfully!' : 'Property created successfully!'"
    />

    <form @submit.prevent="handleSubmit" class="property-form">
      <div class="form-card">
        <h2 class="form-section-title">Basic Information</h2>

        <div class="form-group">
          <label for="title" class="form-label">Title *</label>
          <input
            id="title"
            v-model="form.title"
            type="text"
            class="form-input"
            :class="{ 'input-error': errors.title || propertiesStore.fieldErrors?.title }"
            placeholder="e.g. Luxury Apartment in Downtown"
          />
          <span v-if="errors.title" class="error-text">{{ errors.title }}</span>
          <span v-else-if="propertiesStore.fieldErrors && propertiesStore.fieldErrors.title" class="error-text">{{ propertiesStore.fieldErrors.title }}</span>
        </div>

        <div class="form-group">
          <label for="description" class="form-label">Description *</label>
          <textarea
            id="description"
            v-model="form.property_description"
            class="form-input form-textarea"
            :class="{ 'input-error': errors.property_description || propertiesStore.fieldErrors?.property_description }"
            placeholder="Describe the property..."
            rows="4"
          ></textarea>
          <span v-if="errors.property_description" class="error-text">{{ errors.property_description }}</span>
          <span v-else-if="propertiesStore.fieldErrors && propertiesStore.fieldErrors.property_description" class="error-text">{{ propertiesStore.fieldErrors.property_description }}</span>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="type_id" class="form-label">Property Type *</label>
            <select
              id="type_id"
              v-model="form.type_id"
              class="form-input"
              :class="{ 'input-error': errors.type_id || propertiesStore.fieldErrors?.type_id }"
            >
              <option value="">Select type...</option>
              <option
                v-for="type in propertyTypesStore.propertyTypes"
                :key="type.id"
                :value="type.id"
              >
                {{ type.name }}
              </option>
            </select>
            <span v-if="errors.type_id" class="error-text">{{ errors.type_id }}</span>
            <span v-else-if="propertiesStore.fieldErrors && propertiesStore.fieldErrors.type_id" class="error-text">{{ propertiesStore.fieldErrors.type_id }}</span>
          </div>

          <div class="form-group">
            <label for="transaction_type" class="form-label">Transaction Type *</label>
            <select
              id="transaction_type"
              v-model="form.transaction_type"
              class="form-input"
            >
              <option v-for="type in transactionTypes" :key="type" :value="type">
                {{ type.charAt(0).toUpperCase() + type.slice(1) }}
              </option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="price" class="form-label">Price (USD) *</label>
            <input
              id="price"
              v-model.number="form.price"
              type="number"
              min="0"
              step="0.01"
              class="form-input"
              :class="{ 'input-error': errors.price || propertiesStore.fieldErrors?.price }"
              placeholder="350000"
            />
            <span v-if="errors.price" class="error-text">{{ errors.price }}</span>
            <span v-else-if="propertiesStore.fieldErrors && propertiesStore.fieldErrors.price" class="error-text">{{ propertiesStore.fieldErrors.price }}</span>
          </div>

          <div class="form-group">
            <label for="area" class="form-label">Area (m²) *</label>
            <input
              id="area"
              v-model.number="form.area"
              type="number"
              min="0"
              step="0.01"
              class="form-input"
              :class="{ 'input-error': errors.area || propertiesStore.fieldErrors?.area }"
              placeholder="120"
            />
            <span v-if="errors.area" class="error-text">{{ errors.area }}</span>
            <span v-else-if="propertiesStore.fieldErrors && propertiesStore.fieldErrors.area" class="error-text">{{ propertiesStore.fieldErrors.area }}</span>
          </div>
        </div>

        <div v-if="isEditMode" class="form-group">
          <label for="property_status" class="form-label">Status</label>
          <select
            id="property_status"
            v-model="form.property_status"
            class="form-input"
          >
            <option v-for="status in propertyStatuses" :key="status" :value="status">
              {{ status.charAt(0).toUpperCase() + status.slice(1) }}
            </option>
          </select>
        </div>
      </div>

      <div class="form-card">
        <h2 class="form-section-title">Location</h2>
        
        <div class="form-group">
          <label for="address" class="form-label">Address *</label>
          <input
            id="address"
            v-model="form.property_address"
            type="text"
            class="form-input"
            :class="{ 'input-error': errors.property_address || propertiesStore.fieldErrors?.property_address }"
            placeholder="123 Main Street"
          />
          <span v-if="errors.property_address" class="error-text">{{ errors.property_address }}</span>
          <span v-else-if="propertiesStore.fieldErrors && propertiesStore.fieldErrors.property_address" class="error-text">{{ propertiesStore.fieldErrors.property_address }}</span>
          <span class="form-hint">The address will be geocoded to get coordinates.</span>
        </div>

        <div class="form-group">
          <label for="city" class="form-label">City *</label>
          <input
            id="city"
            v-model="form.city"
            type="text"
            class="form-input"
            :class="{ 'input-error': errors.city || propertiesStore.fieldErrors?.city }"
            placeholder="New York"
          />
          <span v-if="errors.city" class="error-text">{{ errors.city }}</span>
          <span v-else-if="propertiesStore.fieldErrors && propertiesStore.fieldErrors.city" class="error-text">{{ propertiesStore.fieldErrors.city }}</span>
        </div>
      </div>

      <div class="form-card">
        <h2 class="form-section-title">Images</h2>
        
        <div class="form-group">
          <label for="images" class="form-label">Property Images</label>
          <input
            id="images"
            type="file"
            accept="image/*"
            multiple
            class="form-input"
            @change="handleFileChange"
          />
          <span class="form-hint">Upload images of the property (optional)</span>
        </div>

        <div v-if="imageFiles.length > 0" class="image-preview-list">
          <div v-for="(file, index) in imageFiles" :key="index" class="image-preview">
            <span>{{ file.name }}</span>
            <button type="button" @click="removeImage(index)" class="remove-image">×</button>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button type="button" @click="goBack" class="btn btn-outline">
          Cancel
        </button>
        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Saving...' : (isEditMode ? 'Update Property' : 'Create Property') }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.property-form-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.page-header {
  margin-bottom: 2rem;
}

.back-link {
  background: none;
  border: none;
  color: #2563eb;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
  margin-bottom: 1rem;
  display: inline-block;
}

.back-link:hover {
  text-decoration: underline;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
}

.property-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.form-section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.form-label {
  font-weight: 500;
  color: #374151;
}

.form-input {
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.input-error {
  border-color: #dc2626;
}

.error-text {
  color: #dc2626;
  font-size: 0.875rem;
}

.form-hint {
  color: #6b7280;
  font-size: 0.875rem;
}

.image-preview-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
}

.image-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  border-radius: 6px;
}

.remove-image {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #dc2626;
  cursor: pointer;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background: #2563eb;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1d4ed8;
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-outline {
  background: transparent;
  border: 1px solid #d1d5db;
  color: #374151;
}

.btn-outline:hover {
  background: #f3f4f6;
}

@media (max-width: 640px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
