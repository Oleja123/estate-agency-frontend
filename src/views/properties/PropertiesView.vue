<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { usePropertiesStore } from '../../stores/properties'
import { usePropertyTypesStore } from '../../stores/propertyTypes'
import { useAuthStore } from '../../stores/auth'
import LoadingSpinner from '../../components/common/LoadingSpinner.vue'
import AlertMessage from '../../components/common/AlertMessage.vue'
import PaginationControl from '../../components/common/PaginationControl.vue'
import paginationConfig from '../../config/pagination'

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
  max_area: ''
})

const transactionTypes = ['sale', 'rent']
const propertyStatuses = ['active', 'sold', 'rented', 'inactive']

onMounted(async () => {
  await propertyTypesStore.fetchPropertyTypes({ limit: paginationConfig.lookup })
  await propertiesStore.fetchProperties()
})

watch(() => propertiesStore.filters, () => {
  propertiesStore.fetchProperties()
}, { deep: true })

function applyFilters() {
  const filters = {}
  Object.entries(localFilters.value).forEach(([key, value]) => {
    if (value !== '' && value !== null) {
      filters[key] = value
    }
  })
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
    max_area: ''
  }
  propertiesStore.resetFilters()
}

function handlePageChange(page) {
  propertiesStore.setPage(page)
  propertiesStore.fetchProperties()
}

function formatPrice(price) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(price)
}

function getPropertyTypeName(typeId) {
  const type = propertyTypesStore.propertyTypes.find(t => t.id === typeId)
  return type ? type.name : 'Unknown'
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
</script>

<template>
  <div class="properties-page">
    <div class="page-header">
      <div class="page-header-content">
        <h1 class="page-title">Properties</h1>
        <p class="page-subtitle">Browse our collection of properties</p>
      </div>
      <div class="page-header-actions">
        <button @click="showFilters = !showFilters" class="btn btn-outline">
          {{ showFilters ? 'Hide Filters' : 'Show Filters' }}
        </button>
        <RouterLink v-if="isAdmin" to="/properties/create" class="btn btn-primary">
          Add Property
        </RouterLink>
      </div>
    </div>

    <Transition name="slide">
      <div v-if="showFilters" class="filters-panel">
        <div class="filters-grid">
          <div class="filter-group">
            <label class="filter-label">Search</label>
            <input
              v-model="localFilters.search"
              type="text"
              class="filter-input"
              placeholder="Search properties..."
            />
          </div>

          <div class="filter-group">
            <label class="filter-label">Property Type</label>
            <select v-model="localFilters.type_id" class="filter-input">
              <option value="">All Types</option>
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
            <label class="filter-label">Transaction Type</label>
            <select v-model="localFilters.transaction_type" class="filter-input">
              <option value="">All</option>
              <option v-for="type in transactionTypes" :key="type" :value="type">
                {{ type.charAt(0).toUpperCase() + type.slice(1) }}
              </option>
            </select>
          </div>

          <div class="filter-group">
            <label class="filter-label">City</label>
            <input
              v-model="localFilters.city"
              type="text"
              class="filter-input"
              placeholder="Enter city..."
            />
          </div>

          <div class="filter-group">
            <label class="filter-label">Status</label>
            <select v-model="localFilters.property_status" class="filter-input">
              <option value="">All</option>
              <option v-for="status in propertyStatuses" :key="status" :value="status">
                {{ status.charAt(0).toUpperCase() + status.slice(1) }}
              </option>
            </select>
          </div>

          <div class="filter-group">
            <label class="filter-label">Min Price</label>
            <input
              v-model="localFilters.min_price"
              type="number"
              class="filter-input"
              placeholder="Min price..."
            />
          </div>

          <div class="filter-group">
            <label class="filter-label">Max Price</label>
            <input
              v-model="localFilters.max_price"
              type="number"
              class="filter-input"
              placeholder="Max price..."
            />
          </div>

          <div class="filter-group">
            <label class="filter-label">Min Area (m²)</label>
            <input
              v-model="localFilters.min_area"
              type="number"
              class="filter-input"
              placeholder="Min area..."
            />
          </div>

          <div class="filter-group">
            <label class="filter-label">Max Area (m²)</label>
            <input
              v-model="localFilters.max_area"
              type="number"
              class="filter-input"
              placeholder="Max area..."
            />
          </div>
        </div>

        <div class="filters-actions">
          <button @click="resetFilters" class="btn btn-outline">Reset</button>
          <button @click="applyFilters" class="btn btn-primary">Apply Filters</button>
        </div>
      </div>
    </Transition>

    <AlertMessage
      v-if="propertiesStore.error"
      type="error"
      :message="propertiesStore.error"
      @dismiss="propertiesStore.clearError"
    />

    <LoadingSpinner v-if="propertiesStore.loading" message="Loading properties..." />

    <template v-else>
      <div v-if="propertiesStore.properties.length === 0" class="empty-state">
        <div class="empty-icon">🏠</div>
        <h3>No Properties Found</h3>
        <p>Try adjusting your filters or check back later.</p>
      </div>

      <div v-else class="properties-grid">
        <RouterLink
          v-for="property in propertiesStore.properties"
          :key="property.id"
          :to="`/properties/${property.id}`"
          class="property-card"
        >
          <div class="property-image">
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
              <span v-if="property.transaction_type === 'rent'" class="price-period">/month</span>
            </div>
          </div>
        </RouterLink>
      </div>

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
