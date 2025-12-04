<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { usePropertiesStore } from '../../stores/properties'
import { usePropertyTypesStore } from '../../stores/propertyTypes'
import { useAuthStore } from '../../stores/auth'
import LoadingSpinner from '../../components/common/LoadingSpinner.vue'
import AlertMessage from '../../components/common/AlertMessage.vue'
import ConfirmDialog from '../../components/common/ConfirmDialog.vue'
import ImageLightbox from '../../components/common/ImageLightbox.vue'
import paginationConfig from '../../config/pagination'

const route = useRoute()
const router = useRouter()
const propertiesStore = usePropertiesStore()
const propertyTypesStore = usePropertyTypesStore()
const authStore = useAuthStore()

const property = computed(() => propertiesStore.currentProperty)
const isAdmin = computed(() => authStore.isAdmin)
const showDeleteDialog = ref(false)
const isFavorite = ref(false)
const favoriteLoading = ref(false)
const selectedImageIndex = ref(0)
const lightboxVisible = ref(false)
const lightboxImages = ref([])
const lightboxStartIndex = ref(0)
// responsive thumbnails
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1200)

function updateWindowWidth() {
  if (typeof window === 'undefined') return
  windowWidth.value = window.innerWidth
}

const visibleThumbCount = computed(() => {
  const total = (property.value && Array.isArray(property.value.images)) ? property.value.images.length : 0
  if (windowWidth.value <= 420) return Math.min(2, total)
  if (windowWidth.value <= 640) return Math.min(3, total)
  if (windowWidth.value <= 900) return Math.min(4, total)
  return total
})

const visibleImages = computed(() => {
  if (!property.value || !Array.isArray(property.value.images)) return []
  return property.value.images.slice(0, visibleThumbCount.value)
})

const hiddenCount = computed(() => {
  const total = (property.value && Array.isArray(property.value.images)) ? property.value.images.length : 0
  return Math.max(0, total - visibleImages.value.length)
})

onMounted(async () => {
  const id = parseInt(route.params.id)
  await propertiesStore.fetchProperty(id)
  // initialize favorite state from backend field when available
  isFavorite.value = !!propertiesStore.currentProperty?.is_favorited
  await propertyTypesStore.fetchPropertyTypes({ limit: paginationConfig.lookup })
  // setup responsive thumbnail listener
  updateWindowWidth()
  window.addEventListener('resize', updateWindowWidth)
})

onUnmounted(() => {
  try { window.removeEventListener('resize', updateWindowWidth) } catch (e) {}
})

// keep local isFavorite in sync when store updates currentProperty
watch(() => propertiesStore.currentProperty, (newVal) => {
  if (newVal && typeof newVal.is_favorited !== 'undefined') {
    isFavorite.value = !!newVal.is_favorited
  }
  // reset selected image when property changes
  selectedImageIndex.value = 0
})

function getImageSrcFromItem(img) {
  if (!img) return null
  if (img.url) return img.url
  const data = img.data
  const filename = img.filename || ''
  if (data) {
    const ext = filename.split('.').pop()?.toLowerCase() || ''
    let mime = 'image/jpeg'
    if (ext === 'png') mime = 'image/png'
    else if (ext === 'webp') mime = 'image/webp'
    else if (ext === 'gif') mime = 'image/gif'
    else if (ext === 'svg') mime = 'image/svg+xml'
    return `data:${mime};base64,${data}`
  }
  return null
}

function getMainImageSrc() {
  const p = property.value
  if (!p) return null
  if (Array.isArray(p.images) && p.images.length > 0) {
    return getImageSrcFromItem(p.images[selectedImageIndex.value])
  }
  return getImageSrcFromItem(p.image)
}

function buildImageSrcList() {
  const p = property.value
  if (!p) return []
  const list = []
  if (Array.isArray(p.images) && p.images.length > 0) {
    for (const img of p.images) {
      const src = getImageSrcFromItem(img)
      if (src) list.push(src)
    }
  } else {
    const s = getImageSrcFromItem(p.image)
    if (s) list.push(s)
  }
  return list
}

function openLightbox(index = 0) {
  lightboxImages.value = buildImageSrcList()
  lightboxStartIndex.value = index
  if (lightboxImages.value.length === 0) return
  lightboxVisible.value = true
}

function onThumbClick(idx) {
  selectedImageIndex.value = idx
  openLightbox(idx)
}

function formatPrice(price) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(price)
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function getPropertyTypeName(typeId) {
  const type = propertyTypesStore.propertyTypes.find(t => t.id === typeId)
  return type ? type.name : 'Неизвестно'
}

function txLabel(t) {
  if (t === 'sale') return 'Продажа'
  if (t === 'rent') return 'Аренда'
  return t
}

function statusLabel(s) {
  switch (s) {
    case 'active': return 'Активен'
    case 'sold': return 'Продано'
    case 'rented': return 'Арендовано'
    case 'inactive': return 'Неактивен'
    default: return s
  }
}

function getStatusClass(status) {
  switch (status) {
    case 'active': return 'status-available'
    case 'sold': return 'status-sold'
    case 'rented': return 'status-rented'
    case 'inactive': return 'status-reserved'
    default: return ''
  }
}

async function toggleFavorite() {
  if (!property.value) return
  favoriteLoading.value = true
  try {
    const response = await propertiesStore.toggleFavorite(property.value.id)
    // Prefer server-returned `is_favorited` flag if present
    if (response && response.data && typeof response.data.is_favorited !== 'undefined') {
      isFavorite.value = !!response.data.is_favorited
      // also update store's currentProperty if present
      if (propertiesStore.currentProperty) {
        propertiesStore.currentProperty.is_favorited = !!response.data.is_favorited
      }
    } else if (property.value && typeof property.value.is_favorited !== 'undefined') {
      // переключать локально, если бэкенд не вернул явное состояние
      isFavorite.value = !property.value.is_favorited
      propertiesStore.currentProperty.is_favorited = isFavorite.value
    } else {
      // запасной вариант на основе кодов статуса (создан/удален)
      isFavorite.value = response && response.status === 201
    }
  } catch (error) {
    console.error('Failed to toggle favorite:', error)
  } finally {
    favoriteLoading.value = false
  }
}

async function handleDelete() {
  if (!property.value) return
  try {
    await propertiesStore.deleteProperty(property.value.id)
    router.push('/properties')
  } catch (error) {
    console.error('Failed to delete property:', error)
  }
  showDeleteDialog.value = false
}
</script>

<template>
  <div class="property-detail-page">
    <LoadingSpinner v-if="propertiesStore.loading" message="Загрузка объекта недвижимости..." />

    <AlertMessage
      v-if="propertiesStore.error"
      type="error"
      :message="propertiesStore.error"
      @dismiss="propertiesStore.clearError"
    />

    <template v-if="property && !propertiesStore.loading">
      <div class="page-header">
        <RouterLink to="/properties" class="back-link">
          ← К списку объектов
        </RouterLink>
        <div v-if="isAdmin" class="page-actions">
          <RouterLink :to="`/properties/${property.id}/edit`" class="btn btn-outline">
            Редактировать
          </RouterLink>
          <button @click="showDeleteDialog = true" class="btn btn-danger">
            Удалить
          </button>
        </div>
      </div>

      <div class="property-layout">
        <div class="property-main">
          <div class="property-gallery">
            <div :class="['gallery-main', { 'has-image': getMainImageSrc() }]">
              <img v-if="getMainImageSrc()" :src="getMainImageSrc()" :alt="property.title" class="gallery-img" @click.stop="openLightbox(selectedImageIndex)" />
              <span class="property-type-badge">
                {{ getPropertyTypeName(property.type_id) }}
              </span>
              <span :class="['property-status-badge', getStatusClass(property.property_status)]">
                {{ statusLabel(property.property_status) }}
              </span>
            </div>

            <div v-if="property.images && property.images.length" class="gallery-thumbs">
              <button
                v-for="(img, idx) in visibleImages"
                :key="idx"
                type="button"
                class="thumb-button"
                :class="{ active: selectedImageIndex === idx }"
                @click.stop="onThumbClick(idx)"
              >
                <img v-if="getImageSrcFromItem(img)" :src="getImageSrcFromItem(img)" class="thumb-img" />
                <span v-else class="thumb-placeholder">📷</span>
              </button>

              <button
                v-if="hiddenCount > 0"
                type="button"
                class="thumb-button thumb-more"
                @click.stop="openLightbox(visibleImages.length)"
                :aria-label="`Показать ещё ${hiddenCount} изображений`"
              >
                <!-- show the first hidden image as background if available -->
                <img v-if="getImageSrcFromItem(property.images[visibleImages.length])" :src="getImageSrcFromItem(property.images[visibleImages.length])" class="thumb-img" />
                <span v-else class="thumb-placeholder">📷</span>
                <span class="more-count">+{{ hiddenCount }}</span>
              </button>
            </div>

            <ImageLightbox :images="lightboxImages" :startIndex="lightboxStartIndex" v-model="lightboxVisible" @close="lightboxVisible = false" />
          </div>

          <div class="property-info-card">
            <h1 class="property-title">{{ property.title }}</h1>
            <p class="property-address">📍 {{ property.property_address }}, {{ property.city }}</p>

            <div class="property-price-section">
              <span class="property-price">{{ formatPrice(property.price) }}</span>
              <span v-if="property.transaction_type === 'rent'" class="price-period">/мес</span>
              <span class="transaction-badge">{{ txLabel(property.transaction_type) }}</span>
            </div>

            <div class="property-meta">
              <div class="meta-item">
                <span class="meta-label">Площадь</span>
                <span class="meta-value">{{ property.area }} m²</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Тип</span>
                <span class="meta-value">{{ getPropertyTypeName(property.type_id) }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Статус</span>
                <span class="meta-value">{{ statusLabel(property.property_status) }}</span>
              </div>
            </div>

            <div class="property-description">
              <h3>Описание</h3>
              <p>{{ property.property_description }}</p>
            </div>

            <div class="property-dates">
              <p><strong>Добавлено:</strong> {{ formatDate(property.created_at) }}</p>
              <p><strong>Обновлено:</strong> {{ formatDate(property.updated_at) }}</p>
            </div>
          </div>
        </div>

        <div class="property-sidebar">
          <div class="sidebar-card">
            <h3>Действия</h3>
            <button 
              @click="toggleFavorite" 
              :class="['btn btn-block', isFavorite ? 'btn-danger' : 'btn-outline']"
              :disabled="favoriteLoading"
            >
              {{ isFavorite ? '❤️ Удалить из избранного' : '🤍 Добавить в избранное' }}
            </button>
          </div>

          <div class="sidebar-card">
            <h3>Расположение</h3>
            <div class="location-info">
              <p><strong>Адрес:</strong> {{ property.property_address }}</p>
              <p><strong>Город:</strong> {{ property.city }}</p>
              <p v-if="property.latitude && property.longitude">
                <strong>Координаты:</strong><br>
                {{ property.latitude.toFixed(6) }}, {{ property.longitude.toFixed(6) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </template>

    <ConfirmDialog
      :show="showDeleteDialog"
      title="Удалить объект"
      message="Вы уверены, что хотите удалить этот объект? Это действие необратимо."
      confirm-text="Удалить"
      @confirm="handleDelete"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>

<style scoped>
.property-detail-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.back-link {
  color: #2563eb;
  text-decoration: none;
  font-weight: 500;
}

.back-link:hover {
  text-decoration: underline;
}

.page-actions {
  display: flex;
  gap: 0.75rem;
}

.property-layout {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 2rem;
}

.property-gallery {
  margin-bottom: 1.5rem;
}

.gallery-main {
  height: 400px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gallery-main::after {
  content: '🏠';
  font-size: 8rem;
  opacity: 0.5;
}

.gallery-main.has-image::after {
  display: none;
}

.gallery-main .gallery-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 12px;
}

.gallery-main .property-type-badge,
.gallery-main .property-status-badge {
  z-index: 2;
}

.gallery-thumbs {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.thumb-button {
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  width: 72px;
  height: 56px;
  overflow: hidden;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
}

.thumb-button.active {
  box-shadow: 0 0 0 2px rgba(37,99,235,0.2);
}

.thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-placeholder {
  font-size: 1.25rem;
  opacity: 0.6;
}

.thumb-more {
  position: relative;
  background: #e5e7eb;
}

.thumb-more .more-count {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 1rem;
  background: rgba(0,0,0,0.45);
  border-radius: 6px;
}

.property-type-badge {
  position: absolute;
  top: 1rem;
  left: 1rem;
  background: white;
  color: #374151;
  padding: 0.375rem 1rem;
  border-radius: 6px;
  font-weight: 600;
}

.property-status-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 0.375rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  text-transform: capitalize;
}

.status-available {
  background: #d1fae5;
  color: #065f46;
}

.status-sold {
  background: #fee2e2;
  color: #991b1b;
}

.status-rented {
  background: #dbeafe;
  color: #1e40af;
}

.status-reserved {
  background: #fef3c7;
  color: #92400e;
}

.property-info-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.property-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.5rem;
}

.property-address {
  color: #6b7280;
  margin-bottom: 1.5rem;
}

.property-price-section {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.property-price {
  font-size: 2rem;
  font-weight: 700;
  color: #2563eb;
}

.price-period {
  color: #6b7280;
}

.transaction-badge {
  margin-left: auto;
  padding: 0.25rem 0.75rem;
  background: #f3f4f6;
  border-radius: 4px;
  text-transform: capitalize;
  font-weight: 500;
}

.property-meta {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.meta-item {
  text-align: center;
}

.meta-label {
  display: block;
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.meta-value {
  font-weight: 600;
  color: #111827;
}

.capitalize {
  text-transform: capitalize;
}

.property-description {
  margin-bottom: 1.5rem;
}

.property-description h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.75rem;
}

.property-description p {
  color: #4b5563;
  line-height: 1.6;
}

.property-dates {
  color: #6b7280;
  font-size: 0.875rem;
}

.property-dates p {
  margin-bottom: 0.25rem;
}

.sidebar-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
}

.sidebar-card h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 1rem;
}

.location-info p {
  color: #4b5563;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.btn {
  padding: 0.625rem 1rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  text-decoration: none;
  font-size: 0.875rem;
  display: inline-block;
}

.btn-block {
  width: 100%;
}

.btn-primary {
  background: #2563eb;
  color: white;
}

.btn-primary:hover {
  background: #1d4ed8;
}

.btn-outline {
  background: transparent;
  border: 1px solid #d1d5db;
  color: #374151;
}

.btn-outline:hover {
  background: #f3f4f6;
}

.btn-danger {
  background: #dc2626;
  color: white;
}

.btn-danger:hover {
  background: #b91c1c;
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@media (max-width: 900px) {
  .property-layout {
    grid-template-columns: 1fr;
  }

  .property-sidebar {
    order: -1;
  }

  .gallery-main {
    height: 300px;
  }
}
</style>
