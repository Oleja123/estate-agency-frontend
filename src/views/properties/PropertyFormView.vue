<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
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
const pageTitle = computed(() => isEditMode.value ? 'Редактировать объект' : 'Добавить объект')

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
// imageFiles holds mixed items: { isNew: true, file: File } or { isNew: false, filename, data }
const imageFiles = ref([])
const fileInput = ref(null)
const dragIndex = ref(null)

function base64ToFile(base64Data, filename) {
  // base64Data is raw base64 string (no data:... prefix)
  const ext = (filename || '').split('.').pop()?.toLowerCase() || 'jpg'
  let mime = 'image/jpeg'
  if (ext === 'png') mime = 'image/png'
  else if (ext === 'webp') mime = 'image/webp'
  else if (ext === 'gif') mime = 'image/gif'
  else if (ext === 'svg') mime = 'image/svg+xml'

  try {
    const binary = atob(base64Data)
    const arr = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      arr[i] = binary.charCodeAt(i)
    }
    return new File([arr], filename || `image.${ext}`, { type: mime })
  } catch (e) {
    // fallback: return a Blob wrapped as File without type
    const blob = new Blob([], { type: mime })
    return new File([blob], filename || `image.${ext}`)
  }
}

function getPreviewUrl(file) {
  if (!file) return ''
  // if this is a new File wrapper
  if (file.isNew && file.file) {
    if (!file.__preview) {
      try { file.__preview = URL.createObjectURL(file.file) } catch (e) { file.__preview = '' }
    }
    return file.__preview
  }
  // existing image with base64 data
  if (!file.isNew && file.data) {
    return `data:image/*;base64,${file.data}`
  }
  // fallback for raw File objects
  if (file instanceof File) {
    if (!file.__preview) {
      try { file.__preview = URL.createObjectURL(file) } catch (e) { file.__preview = '' }
    }
    return file.__preview
  }
  return ''
}

function revokePreview(file) {
  if (!file) return
  if (file.isNew && file.__preview) {
    try { URL.revokeObjectURL(file.__preview) } catch (e) {}
    delete file.__preview
  }
}

const transactionTypes = ['sale', 'rent']

function txLabel(t) {
  if (t === 'sale') return 'Продажа'
  if (t === 'rent') return 'Аренда'
  return t
}
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
      // load existing images preserving order
      if (Array.isArray(p.images) && p.images.length > 0) {
        imageFiles.value = p.images.map(img => ({ isNew: false, filename: img.filename || '', data: img.data || '' }))
      }
    }
  }
})

function clearImages() {
  // confirm destructive action
  const ok = typeof window !== 'undefined' ? window.confirm('Очистить все изображения для этого объекта? Изображения будут удалены на сервере при сохранении.') : true
  if (!ok) return
  // clear local list immediately; on save we'll sync to server
  imageFiles.value = []
}

function validateForm() {
  errors.value = {}
  
  if (!form.value.title) {
    errors.value.title = 'Требуется заголовок'
  }

  if (!form.value.property_description) {
    errors.value.property_description = 'Требуется описание'
  }

  if (!form.value.type_id) {
    errors.value.type_id = 'Требуется выбрать тип недвижимости'
  }

  if (!form.value.price || form.value.price <= 0) {
    errors.value.price = 'Требуется корректная цена'
  }

  if (!form.value.area || form.value.area <= 0) {
    errors.value.area = 'Требуется корректная площадь'
  }

  if (!form.value.property_address) {
    errors.value.property_address = 'Требуется адрес'
  }

  if (!form.value.city) {
    errors.value.city = 'Требуется город'
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
    
    // Create or update property first. Image files (if any) are uploaded
    // separately via multipart/form-data to the images endpoint so the
    // backend receives them under the `files` field as expected.
    let savedId = null
    if (isEditMode.value) {
      const id = parseInt(route.params.id)
      const resp = await propertiesStore.updateProperty(id, data)
      // updateProperty may return updated property; fall back to route param
      savedId = resp?.id || id
    } else {
      const resp = await propertiesStore.createProperty(data)
      // createProperty should return created resource (containing id)
      savedId = resp?.id
    }

    // Build File objects array in order: convert existing base64 items to File
    const filesToUpload = imageFiles.value.map(item => {
      if (item.isNew && item.file) return item.file
      if (!item.isNew && item.data) return base64ToFile(item.data, item.filename)
      return null
    }).filter(Boolean)

    // If editing, always attempt to sync images (even empty list) so server can clear them.
    // If creating, only upload when there are files.
    if (savedId && (isEditMode.value || filesToUpload.length > 0)) {
      try {
        await propertiesStore.uploadImages(savedId, filesToUpload)
      } catch (err) {
        // If uploadImages fails (e.g. backend rejects empty multipart), surface error but continue navigation
        console.error('Failed to upload/replace images:', err)
      }
    }

    // Navigate after successful save and optional image upload
    if (savedId) {
      router.push(isEditMode.value ? `/properties/${savedId}` : '/properties')
    } else {
      // Fallback navigation
      router.push(isEditMode.value ? `/properties/${route.params.id}` : '/properties')
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
  const files = Array.from(event.target.files || [])
  const goodFiles = []
  const maxFiles = 10
  // Append new files to existing selection, up to maxFiles total.
  // Only accept PNG and JPEG (jpg) images.
  const allowed = new Set(['image/png', 'image/jpeg'])
  const slots = Math.max(0, maxFiles - imageFiles.value.length)
  const rejected = []
  for (const f of files) {
    if (!f.type || !allowed.has(f.type)) {
      rejected.push(f.name)
      continue
    }
    if (goodFiles.length >= slots) break
    goodFiles.push(f)
  }

  // Warn if user tried to add more files than available slots
  if (files.length > slots && slots <= 0) {
    errors.value.images = `Достигнут лимит: допускается максимум ${maxFiles} файлов.`
  } else if (files.length > slots) {
    errors.value.images = `Можно добавить только ${slots} файлов; остальные будут проигнорированы.`
  } else if (rejected.length > 0) {
    errors.value.images = `Допускаются только PNG и JPG/JPEG: ${rejected.join(', ')}`
  } else {
    delete errors.value.images
  }

  // append to existing array as new wrappers
  const wrapped = goodFiles.map(f => ({ isNew: true, file: f }))
  imageFiles.value = [...imageFiles.value, ...wrapped]
  // clear native file input so the same file(s) can be selected again
  if (fileInput.value) fileInput.value.value = ''
}

function removeImage(index) {
  const [removed] = imageFiles.value.splice(index, 1)
  revokePreview(removed)
  // keep native input cleared to reflect current selection
  if (fileInput.value) fileInput.value.value = ''
}

onBeforeUnmount(() => {
  for (const f of imageFiles.value) revokePreview(f)
})

function moveImageUp(index) {
  if (index <= 0) return
  const files = [...imageFiles.value]
  const [moved] = files.splice(index, 1)
  files.splice(index - 1, 0, moved)
  imageFiles.value = files
}

function moveImageDown(index) {
  if (index >= imageFiles.value.length - 1) return
  const files = [...imageFiles.value]
  const [moved] = files.splice(index, 1)
  files.splice(index + 1, 0, moved)
  imageFiles.value = files
}

function onDragStart(e, index) {
  dragIndex.value = index
  try { e.dataTransfer.setData('text/plain', String(index)) } catch (err) {}
}

function onDragOver(e) {
  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'
}

function onDrop(e, index) {
  e.preventDefault()
  const srcStr = e.dataTransfer.getData('text/plain')
  const src = srcStr !== '' ? parseInt(srcStr, 10) : dragIndex.value
  if (isNaN(src) || src === index) return
  const files = [...imageFiles.value]
  const [moved] = files.splice(src, 1)
  files.splice(index, 0, moved)
  imageFiles.value = files
  dragIndex.value = null
}

function goBack() {
  router.back()
}
</script>

<template>
  <div class="property-form-page">
    <div class="page-header">
      <button @click="goBack" class="back-link">
        ← Назад
      </button>
      <h1 class="page-title">{{ pageTitle }}</h1>
    </div>

  <LoadingSpinner v-if="propertiesStore.loading && isEditMode" message="Загрузка объекта..." />

    <AlertMessage
      v-if="propertiesStore.error"
      type="error"
      :message="propertiesStore.error"
      @dismiss="propertiesStore.clearError"
    />

    <AlertMessage
      v-if="success"
      type="success"
      :message="isEditMode ? 'Объект успешно обновлён!' : 'Объект успешно создан!'"
    />

    <form @submit.prevent="handleSubmit" class="property-form">
      <div class="form-card">
  <h2 class="form-section-title">Основная информация</h2>

        <div class="form-group">
          <label for="title" class="form-label">Заголовок *</label>
          <input
            id="title"
            v-model="form.title"
            type="text"
            class="form-input"
            :class="{ 'input-error': errors.title || propertiesStore.fieldErrors?.title }"
            placeholder="Напр., Квартира повышенной комфортности в центре"
          />
          <span v-if="errors.title" class="error-text">{{ errors.title }}</span>
          <span v-else-if="propertiesStore.fieldErrors && propertiesStore.fieldErrors.title" class="error-text">{{ propertiesStore.fieldErrors.title }}</span>
        </div>

        <div class="form-group">
          <label for="description" class="form-label">Описание *</label>
          <textarea
            id="description"
            v-model="form.property_description"
            class="form-input form-textarea"
            :class="{ 'input-error': errors.property_description || propertiesStore.fieldErrors?.property_description }"
            placeholder="Опишите объект..."
            rows="4"
          ></textarea>
          <span v-if="errors.property_description" class="error-text">{{ errors.property_description }}</span>
          <span v-else-if="propertiesStore.fieldErrors && propertiesStore.fieldErrors.property_description" class="error-text">{{ propertiesStore.fieldErrors.property_description }}</span>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="type_id" class="form-label">Тип недвижимости *</label>
            <select
              id="type_id"
              v-model="form.type_id"
              class="form-input"
              :class="{ 'input-error': errors.type_id || propertiesStore.fieldErrors?.type_id }"
            >
              <option value="">Выберите тип...</option>
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
            <label for="transaction_type" class="form-label">Тип сделки *</label>
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
            <label for="price" class="form-label">Цена (USD) *</label>
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
            <label for="area" class="form-label">Площадь (м²) *</label>
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
          <label for="property_status" class="form-label">Статус</label>
          <select
            id="property_status"
            v-model="form.property_status"
            class="form-input"
          >
            <option v-for="status in propertyStatuses" :key="status" :value="status">
              {{ status === 'active' ? 'Активен' : status === 'sold' ? 'Продано' : status === 'rented' ? 'Арендовано' : 'Неактивен' }}
            </option>
          </select>
        </div>
      </div>

      <div class="form-card">
  <h2 class="form-section-title">Расположение</h2>
        
        <div class="form-group">
          <label for="address" class="form-label">Адрес *</label>
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
          <span class="form-hint">Адрес будет геокодирован для получения координат.</span>
        </div>

        <div class="form-group">
          <label for="city" class="form-label">Город *</label>
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
  <h2 class="form-section-title">Изображения</h2>
        
        <div class="form-group">
          <label for="images" class="form-label">Изображения объекта</label>
          <input
            id="images"
            type="file"
            accept="image/png, image/jpeg"
            multiple
            class="form-input"
            ref="fileInput"
            @change="handleFileChange"
          />
          <div style="margin-top:0.5rem;">
            <button v-if="isEditMode && imageFiles.length > 0" type="button" class="btn btn-outline" @click="clearImages">Очистить изображения</button>
          </div>
          <span class="form-hint">Загрузите изображения объекта (необязательно)</span>
          <span v-if="errors.images" class="error-text">{{ errors.images }}</span>
        </div>

        <div v-if="imageFiles.length > 0" class="image-preview-list">
          <div
            v-for="(file, index) in imageFiles"
            :key="index"
            class="image-preview"
            draggable="true"
            @dragstart="onDragStart($event, index)"
            @dragover="onDragOver"
            @drop="onDrop($event, index)"
          >
            <div class="image-preview-left">
              <img v-if="getPreviewUrl(file)" :src="getPreviewUrl(file)" class="image-thumb" alt="preview" />
              <span class="image-name">{{ file.isNew ? (file.file && file.file.name) : file.filename }}</span>
            </div>
            <div class="image-preview-actions">
              <button type="button" class="btn-move" @click="moveImageUp(index)" :disabled="index === 0" title="Переместить вверх">▲</button>
              <button type="button" class="btn-move" @click="moveImageDown(index)" :disabled="index === imageFiles.length - 1" title="Переместить вниз">▼</button>
              <button type="button" @click="removeImage(index)" class="remove-image" title="Удалить">×</button>
            </div>
          </div>
        </div>
      </div>

        <div class="form-actions">
        <button type="button" @click="goBack" class="btn btn-outline">
          Отмена
        </button>
        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Сохранение...' : (isEditMode ? 'Обновить объект' : 'Создать объект') }}
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

.image-preview-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.image-thumb {
  width: 56px;
  height: 40px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.image-name {
  max-width: 420px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.image-preview-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-move {
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
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
