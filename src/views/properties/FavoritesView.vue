<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useUsersStore } from '../../stores/users'
import { useAuthStore } from '../../stores/auth'
import { usePropertiesStore } from '../../stores/properties'
import { usePropertyTypesStore } from '../../stores/propertyTypes'
import LoadingSpinner from '../../components/common/LoadingSpinner.vue'
import AlertMessage from '../../components/common/AlertMessage.vue'
import PaginationControl from '../../components/common/PaginationControl.vue'
import paginationConfig from '../../config/pagination'
import ImageLightbox from '../../components/common/ImageLightbox.vue'

const usersStore = useUsersStore()
const authStore = useAuthStore()
const propertiesStore = usePropertiesStore()
const propertyTypesStore = usePropertyTypesStore()

const favoriteIds = ref([])
const favoriteProperties = ref([])
const loading = ref(true)
const error = ref(null)

const limit = ref(paginationConfig.favorites)
const offset = ref(0)

const currentUserId = computed(() => authStore.currentUserId)

onMounted(async () => {
  try {
    await propertyTypesStore.fetchPropertyTypes({ limit: paginationConfig.lookup })
    await loadFavorites()
  } catch (err) {
    error.value = 'Не удалось загрузить избранное'
  } finally {
    loading.value = false
  }
})

async function loadFavorites() {
  if (!currentUserId.value) return

  try {
    const res = await usersStore.fetchFavorites(currentUserId.value, { limit: limit.value, offset: offset.value })
    if (res && Array.isArray(res.items)) {
      favoriteProperties.value = res.items
    } else if (Array.isArray(usersStore.favorites)) {
  // запасной вариант: использовать заполненный стор избранного
      favoriteProperties.value = usersStore.favorites
    } else {
      favoriteProperties.value = []
    }
  } catch (err) {
    error.value = 'Не удалось загрузить избранное'
  }
}

function handlePageChange(page) {
  offset.value = (page - 1) * limit.value
  loadFavorites()
}

const currentPage = () => Math.floor(offset.value / limit.value) + 1
const totalPages = () => Math.ceil((usersStore.favoritesTotal || 0) / limit.value)

async function removeFavorite(propertyId) {
  try {
    await propertiesStore.toggleFavorite(propertyId)
    favoriteProperties.value = favoriteProperties.value.filter(p => p.id !== propertyId)
    favoriteIds.value = favoriteIds.value.filter(id => id !== propertyId)
  } catch (err) {
    error.value = 'Не удалось удалить из избранного'
  }
}

function formatPrice(price) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0
  }).format(price)
}

function getPropertyTypeName(typeId) {
  const type = propertyTypesStore.propertyTypes.find(t => t.id === typeId)
  return type ? type.name : 'Неизвестно'
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

function getImageSrc(property) {
  // Prefer property.image (single) like list view
  const img = property?.image || null
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

const lightboxVisible = ref(false)
const lightboxImages = ref([])
const lightboxStartIndex = ref(0)

function buildListImageSrcList(property) {
  const list = []
  if (Array.isArray(property?.images) && property.images.length > 0) {
    for (const img of property.images) {
      if (!img) continue
      if (img.url) list.push(img.url)
      else if (img.data) {
        const filename = img.filename || ''
        const ext = filename.split('.').pop()?.toLowerCase() || ''
        let mime = 'image/jpeg'
        if (ext === 'png') mime = 'image/png'
        else if (ext === 'webp') mime = 'image/webp'
        else if (ext === 'gif') mime = 'image/gif'
        else if (ext === 'svg') mime = 'image/svg+xml'
        list.push(`data:${mime};base64,${img.data}`)
      }
    }
  } else if (property?.image) {
    const img = property.image
    if (img.url) list.push(img.url)
    else if (img.data) {
      const filename = img.filename || ''
      const ext = filename.split('.').pop()?.toLowerCase() || ''
      let mime = 'image/jpeg'
      if (ext === 'png') mime = 'image/png'
      else if (ext === 'webp') mime = 'image/webp'
      else if (ext === 'gif') mime = 'image/gif'
      else if (ext === 'svg') mime = 'image/svg+xml'
      list.push(`data:${mime};base64,${img.data}`)
    }
  }
  return list
}

function openPropertyLightbox(property, start = 0) {
  lightboxImages.value = buildListImageSrcList(property)
  lightboxStartIndex.value = start
  if (lightboxImages.value.length === 0) return
  lightboxVisible.value = true
}
</script>

<template>
  <div class="favorites-page">
    <div class="page-header">
      <h1 class="page-title">Избранное</h1>
      <p class="page-subtitle">Объекты, сохранённые вами</p>
    </div>

    <AlertMessage
      v-if="error"
      type="error"
      :message="error"
      @dismiss="error = null"
    />

  <LoadingSpinner v-if="loading" message="Загрузка избранного..." />

    <template v-else>
      <div v-if="favoriteProperties.length === 0" class="empty-state">
        <div class="empty-icon">❤️</div>
        <h3>Пока нет избранного</h3>
        <p>Начните просматривать объекты и добавьте их в избранное!</p>
        <RouterLink to="/properties" class="btn btn-primary">
          Просмотреть объекты
        </RouterLink>
      </div>

      <div v-else class="favorites-grid">
        <div
          v-for="property in favoriteProperties"
          :key="property.id"
          class="favorite-card"
        >
          <RouterLink :to="`/properties/${property.id}`" class="property-link">
            <div :class="['property-image', { 'has-image': getImageSrc(property) }]">
              <img v-if="getImageSrc(property)" :src="getImageSrc(property)" :alt="property.title" class="property-img" @click.stop.prevent="openPropertyLightbox(property, 0)" />
              <span class="property-type-badge">
                {{ getPropertyTypeName(property.type_id) }}
              </span>
              <span :class="['property-status-badge', getStatusClass(property.property_status)]">
                {{ property.property_status }}
              </span>
            </div>
            <div class="property-content">
              <h3 class="property-title">{{ property.title }}</h3>
              <p class="property-address">📍 {{ property.property_address }}, {{ property.city }}</p>
              <div class="property-details">
                <span class="property-area">📐 {{ property.area }} m²</span>
                <span class="property-transaction">{{ property.transaction_type }}</span>
              </div>
              <div class="property-price">
                {{ formatPrice(property.price) }}
                <span v-if="property.transaction_type === 'rent'" class="price-period">/сутки</span>
              </div>
            </div>
          </RouterLink>
          <button @click="removeFavorite(property.id)" class="remove-favorite-btn">
            Удалить из избранного
          </button>
        </div>
      </div>
      <ImageLightbox :images="lightboxImages" :startIndex="lightboxStartIndex" v-model="lightboxVisible" @close="lightboxVisible = false" />
      <PaginationControl
        :current-page="currentPage()"
        :total-pages="totalPages()"
        @page-change="handlePageChange"
      />
    </template>
  </div>
</template>

<style scoped>
.favorites-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.page-header {
  margin-bottom: 2rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.25rem;
}

.page-subtitle {
  color: #6b7280;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  font-size: 1.25rem;
  color: #111827;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: #6b7280;
  margin-bottom: 1.5rem;
}

.favorites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.favorite-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.favorite-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.property-link {
  text-decoration: none;
  display: block;
}

.property-image {
  height: 180px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.property-image::after {
  content: '🏠';
  font-size: 4rem;
  opacity: 0.5;
}

.property-image.has-image::after {
  content: '';
  opacity: 0;
}

.property-image .property-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.property-image .property-type-badge,
.property-image .property-status-badge {
  z-index: 2;
}

.property-type-badge {
  position: absolute;
  top: 1rem;
  left: 1rem;
  background: white;
  color: #374151;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.property-status-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.75rem;
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

.property-content {
  padding: 1.25rem;
}

.property-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.5rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.property-address {
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 0.75rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.property-details {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.property-transaction {
  text-transform: capitalize;
  padding: 0.125rem 0.5rem;
  background: #f3f4f6;
  border-radius: 4px;
}

.property-price {
  font-size: 1.25rem;
  font-weight: 700;
  color: #2563eb;
}

.price-period {
  font-size: 0.875rem;
  font-weight: 400;
  color: #6b7280;
}

.remove-favorite-btn {
  width: 100%;
  padding: 0.75rem;
  background: #fee2e2;
  color: #991b1b;
  border: none;
  border-top: 1px solid #fecaca;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.remove-favorite-btn:hover {
  background: #fecaca;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  display: inline-block;
}

.btn-primary {
  background: #2563eb;
  color: white;
}

.btn-primary:hover {
  background: #1d4ed8;
}
</style>
