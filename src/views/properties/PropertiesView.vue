<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { usePropertiesStore } from '../../stores/properties'
import { usePropertyTypesStore } from '../../stores/propertyTypes'
import { useAuthStore } from '../../stores/auth'
import paginationConfig from '../../config/pagination'
import PaginationControl from '../../components/common/PaginationControl.vue'
import ImageLightbox from '../../components/common/ImageLightbox.vue'

const propertiesStore = usePropertiesStore()
const propertyTypesStore = usePropertyTypesStore()
const authStore = useAuthStore()

const isAdmin = computed(() => authStore.isAdmin)
const showFilters = ref(false)

const localFilters = ref({
  search: '',
  type_id: '',
  transaction_type: '',
  city: '',
  property_status: '',
  min_price: '',
  max_price: '',
  min_area: '',
  max_area: '',
  // location filters (empty string => not used)
  latitude: '',
  longitude: '',
  radius_km: ''
})

const transactionTypes = ['sale', 'rent']
const propertyStatuses = ['active', 'sold', 'rented', 'inactive']

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

onMounted(async () => {
  await propertyTypesStore.fetchPropertyTypes({ limit: paginationConfig.lookup })
  await propertiesStore.fetchProperties()
})

watch(() => propertiesStore.filters, () => {
  propertiesStore.fetchProperties()
}, { deep: true })

function applyFilters() {
  // clear previous error
  propertiesStore.clearError()

  // validate numeric ranges: price and area
  const minPrice = localFilters.value.min_price === '' || localFilters.value.min_price === null
    ? null
    : Number(localFilters.value.min_price)
  const maxPrice = localFilters.value.max_price === '' || localFilters.value.max_price === null
    ? null
    : Number(localFilters.value.max_price)

  const minArea = localFilters.value.min_area === '' || localFilters.value.min_area === null
    ? null
    : Number(localFilters.value.min_area)
  const maxArea = localFilters.value.max_area === '' || localFilters.value.max_area === null
    ? null
    : Number(localFilters.value.max_area)

  // negative value checks
  if (minPrice !== null && Number.isFinite(minPrice) && minPrice < 0) {
    propertiesStore.error = 'Минимальная цена не может быть отрицательной.'
    return
  }

  if (maxPrice !== null && Number.isFinite(maxPrice) && maxPrice < 0) {
    propertiesStore.error = 'Максимальная цена не может быть отрицательной.'
    return
  }

  if (minArea !== null && Number.isFinite(minArea) && minArea < 0) {
    propertiesStore.error = 'Минимальная площадь не может быть отрицательной.'
    return
  }

  if (maxArea !== null && Number.isFinite(maxArea) && maxArea < 0) {
    propertiesStore.error = 'Максимальная площадь не может быть отрицательной.'
    return
  }

  // range consistency checks
  if (minPrice !== null && maxPrice !== null && Number.isFinite(minPrice) && Number.isFinite(maxPrice) && maxPrice < minPrice) {
    propertiesStore.error = 'Максимальная цена не может быть меньше минимальной.'
    return
  }

  if (minArea !== null && maxArea !== null && Number.isFinite(minArea) && Number.isFinite(maxArea) && maxArea < minArea) {
    propertiesStore.error = 'Максимальная площадь не может быть меньше минимальной.'
    return
  }

  // location / radius validation
  const latRaw = localFilters.value.latitude === '' || localFilters.value.latitude === null ? null : localFilters.value.latitude
  const lngRaw = localFilters.value.longitude === '' || localFilters.value.longitude === null ? null : localFilters.value.longitude
  const radRaw = localFilters.value.radius_km === '' || localFilters.value.radius_km === null ? null : localFilters.value.radius_km

  const latNum = latRaw === null ? null : Number(latRaw)
  const lngNum = lngRaw === null ? null : Number(lngRaw)
  const radNum = radRaw === null ? null : Number(radRaw)

  if (radNum !== null && (!Number.isFinite(radNum) || radNum < 0)) {
    propertiesStore.error = 'Радиус должен быть положительным числом.'
    return
  }

    // Проверка корректности координат
    if ((latNum !== null && (!Number.isFinite(latNum) || latNum < -90 || latNum > 90)) || (lngNum !== null && (!Number.isFinite(lngNum) || lngNum < -180 || lngNum > 180))) {
      propertiesStore.error = 'Координаты некорректны.'
      return
    }

  // if user provided radius but not coords -> error
  if (radNum !== null && (latNum === null || lngNum === null)) {
    propertiesStore.error = 'Укажите координаты (нажмите "Use my location" или введите вручную), чтобы фильтровать по расстоянию.'
    return
  }

  const filters = {}
  Object.entries(localFilters.value).forEach(([key, value]) => {
    // include empty-string values so selecting "All" clears the filter
    if (value !== null && value !== undefined) {
      // skip raw location strings -- we'll add parsed numeric values below
      if (['latitude', 'longitude', 'radius_km'].includes(key)) return
      filters[key] = value
    }
  })

  // attach numeric location filters when present
  if (latNum !== null && lngNum !== null) {
    filters.latitude = latNum
    filters.longitude = lngNum
    filters.radius_km = radNum !== null ? radNum : 5 // default 5 km if not provided
  }

  propertiesStore.setFilters({ ...filters, offset: 0 })
}

function resetFilters() {
  localFilters.value = {
    search: '',
    type_id: '',
    transaction_type: '',
    city: '',
    property_status: '',
    min_price: '',
    max_price: '',
    min_area: '',
    max_area: '',
    latitude: '',
    longitude: '',
    radius_km: ''
  }
  propertiesStore.resetFilters()
}

function requestLocation() {
  propertiesStore.clearError()
  if (!navigator.geolocation) {
    propertiesStore.error = 'Geolocation is not supported by your browser.'
    return
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords
      // store as strings to keep binding with inputs
      localFilters.value.latitude = String(Number(latitude).toFixed(6))
      localFilters.value.longitude = String(Number(longitude).toFixed(6))
    },
    (err) => {
      propertiesStore.error = err.message || 'Failed to get current location.'
    },
    { enableHighAccuracy: true, timeout: 10000 }
  )
}

function clearLocation() {
  localFilters.value.latitude = ''
  localFilters.value.longitude = ''
  localFilters.value.radius_km = ''
}

function handlePageChange(page) {
  propertiesStore.setPage(page)
  propertiesStore.fetchProperties()
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
  // Use `property.image` for list cards (per swagger)
  const img = property?.image || null
  if (!img) return null
  // Если бэкенд предоставил поле url, использовать его
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
  // prefer property.images if present
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
  <div class="properties-page">
    <div class="page-header">
      <div class="page-header-content">
  <h1 class="page-title">Объекты недвижимости</h1>
  <p class="page-subtitle">Просмотр доступных объектов</p>
      </div>
      <div class="page-header-actions">
        <button @click="showFilters = !showFilters" class="btn btn-outline">
          {{ showFilters ? 'Скрыть фильтры' : 'Показать фильтры' }}
        </button>
        <RouterLink v-if="isAdmin" to="/properties/create" class="btn btn-primary">
          Добавить объект
        </RouterLink>
      </div>
    </div>

    <Transition name="slide">
      <div v-if="showFilters" class="filters-panel">
        <div class="filters-grid">
          <div class="filter-group">
            <label class="filter-label">Поиск</label>
            <input
              v-model="localFilters.search"
              type="text"
              class="filter-input"
              placeholder="Поиск объектов..."
            />
          </div>

          <div class="filter-group">
            <label class="filter-label">Тип недвижимости</label>
            <select v-model="localFilters.type_id" class="filter-input">
              <option value="">Все типы</option>
              <option
                v-for="type in propertyTypesStore.propertyTypes"
                :key="type.id"
                :value="type.id"
              >
                {{ type.name }}
              </option>
            </select>
          </div>

          <div class="filter-group">
            <label class="filter-label">Тип сделки</label>
            <select v-model="localFilters.transaction_type" class="filter-input">
              <option value="">Все</option>
              <option v-for="type in transactionTypes" :key="type" :value="type">
                {{ txLabel(type) }}
              </option>
            </select>
          </div>

          <div class="filter-group">
            <label class="filter-label">Город</label>
            <input
              v-model="localFilters.city"
              type="text"
              class="filter-input"
              placeholder="Введите город..."
            />
          </div>

          <!-- location filter moved below grid -->

          <div class="filter-group">
            <label class="filter-label">Статус</label>
            <select v-model="localFilters.property_status" class="filter-input">
              <option value="">Все</option>
              <option v-for="status in propertyStatuses" :key="status" :value="status">
                {{ statusLabel(status) }}
              </option>
            </select>
          </div>

          <div class="filter-group">
            <label class="filter-label">Мин. цена</label>
            <input
              v-model="localFilters.min_price"
              type="number"
              class="filter-input"
              placeholder="Мин. цена..."
            />
          </div>

          <div class="filter-group">
            <label class="filter-label">Макс. цена</label>
            <input
              v-model="localFilters.max_price"
              type="number"
              class="filter-input"
              placeholder="Макс. цена..."
            />
          </div>

          <div class="filter-group">
            <label class="filter-label">Мин. площадь (м²)</label>
            <input
              v-model="localFilters.min_area"
              type="number"
              class="filter-input"
              placeholder="Мин. площадь..."
            />
          </div>

          <div class="filter-group">
            <label class="filter-label">Макс. площадь (м²)</label>
            <input
              v-model="localFilters.max_area"
              type="number"
              class="filter-input"
              placeholder="Макс. площадь..."
            />
          </div>
        </div>

        <!-- separate full-width location filter row -->
        <div class="filters-location-row">
          <div class="filter-group full-width">
            <label class="filter-label">Использовать моё местоположение</label>
            <div style="display:flex;gap:.5rem;align-items:center;">
              <button type="button" class="btn btn-outline" @click="requestLocation">Определить местоположение</button>
              <button type="button" class="btn btn-outline" @click="clearLocation">Очистить</button>
            </div>
            <div style="margin-top:.5rem;display:flex;gap:.5rem;">
              <input v-model="localFilters.latitude" type="text" class="filter-input" placeholder="Широта" />
              <input v-model="localFilters.longitude" type="text" class="filter-input" placeholder="Долгота" />
            </div>
            <div style="margin-top:.5rem;display:flex;gap:.5rem;align-items:center;">
              <input v-model="localFilters.radius_km" type="number" min="0" step="1" class="filter-input" placeholder="Радиус (км)" />
              <small style="color:#6b7280">Укажите радиус для фильтрации объектов по расстоянию</small>
            </div>
          </div>
        </div>

        <div class="filters-actions">
          <button @click="resetFilters" class="btn btn-outline">Сбросить</button>
          <button @click="applyFilters" class="btn btn-primary">Применить</button>
        </div>
      </div>
    </Transition>

    <AlertMessage
      v-if="propertiesStore.error"
      type="error"
      :message="propertiesStore.error"
      @dismiss="propertiesStore.clearError"
    />

  <LoadingSpinner v-if="propertiesStore.loading" message="Загрузка объектов..." />

    <template v-else>
      <div v-if="propertiesStore.properties.length === 0" class="empty-state">
        <div class="empty-icon">🏠</div>
        <h3>Объекты не найдены</h3>
        <p>Попробуйте изменить фильтры или зайти позже.</p>
      </div>

      <div v-else class="properties-grid">
        <RouterLink
          v-for="property in propertiesStore.properties"
          :key="property.id"
          :to="`/properties/${property.id}`"
          class="property-card"
        >
          <div :class="['property-image', { 'has-image': getImageSrc(property) }]">
            <img v-if="getImageSrc(property)" :src="getImageSrc(property)" :alt="property.title" class="property-img" @click.stop.prevent="openPropertyLightbox(property, 0)" />
            <span class="property-type-badge">
              {{ getPropertyTypeName(property.type_id) }}
            </span>
            <span :class="['property-status-badge', getStatusClass(property.property_status)]">
              {{ statusLabel(property.property_status) }}
            </span>
          </div>
          <div class="property-content">
            <h3 class="property-title">{{ property.title }}</h3>
            <p class="property-address">📍 {{ property.property_address }}, {{ property.city }}</p>
            <div class="property-details">
              <span class="property-area">📐 {{ property.area }} m²</span>
              <span class="property-transaction">{{ txLabel(property.transaction_type) }}</span>
            </div>
              <div class="property-price">
              {{ formatPrice(property.price) }}
              <span v-if="property.transaction_type === 'rent'" class="price-period">/сутки</span>
            </div>
          </div>
        </RouterLink>
      </div>

      <ImageLightbox :images="lightboxImages" :startIndex="lightboxStartIndex" v-model="lightboxVisible" @close="lightboxVisible = false" />

      <PaginationControl
        :current-page="propertiesStore.currentPage"
        :total-pages="propertiesStore.totalPages"
        @page-change="handlePageChange"
      />
    </template>
  </div>
</template>

<style scoped>
.properties-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 1rem;
  flex-wrap: wrap;
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

.page-header-actions {
  display: flex;
  gap: 0.75rem;
}

.filters-panel {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-label {
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.filter-input {
  padding: 0.625rem 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
}

.filter-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.filters-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.filters-location-row {
  margin: 1rem 0;
}

.filter-group.full-width {
  width: 100%;
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
}

.properties-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.property-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  text-decoration: none;
  transition: transform 0.2s, box-shadow 0.2s;
}

.property-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
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
  display: none;
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

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 640px) {
  .page-header {
    flex-direction: column;
  }

  .page-header-actions {
    width: 100%;
  }

  .page-header-actions .btn {
    flex: 1;
  }
}
</style>
