<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { usePropertiesStore } from '../../stores/properties'
import { usePropertyTypesStore } from '../../stores/propertyTypes'
import { useAuthStore } from '../../stores/auth'
import LoadingSpinner from '../../components/common/LoadingSpinner.vue'
import AlertMessage from '../../components/common/AlertMessage.vue'
import ConfirmDialog from '../../components/common/ConfirmDialog.vue'

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

onMounted(async () => {
  const id = parseInt(route.params.id)
  await propertiesStore.fetchProperty(id)
  await propertyTypesStore.fetchPropertyTypes({ limit: 100 })
})

function formatPrice(price) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(price)
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function getPropertyTypeName(typeId) {
  const type = propertyTypesStore.propertyTypes.find(t => t.id === typeId)
  return type ? type.name : 'Unknown'
}

function getStatusClass(status) {
  switch (status) {
    case 'available': return 'status-available'
    case 'sold': return 'status-sold'
    case 'rented': return 'status-rented'
    case 'reserved': return 'status-reserved'
    default: return ''
  }
}

async function toggleFavorite() {
  if (!property.value) return
  favoriteLoading.value = true
  try {
    const response = await propertiesStore.toggleFavorite(property.value.id)
    isFavorite.value = response.status === 201
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
    <LoadingSpinner v-if="propertiesStore.loading" message="Loading property..." />

    <AlertMessage
      v-if="propertiesStore.error"
      type="error"
      :message="propertiesStore.error"
      @dismiss="propertiesStore.clearError"
    />

    <template v-if="property && !propertiesStore.loading">
      <div class="page-header">
        <RouterLink to="/properties" class="back-link">
          ← Back to Properties
        </RouterLink>
        <div v-if="isAdmin" class="page-actions">
          <RouterLink :to="`/properties/${property.id}/edit`" class="btn btn-outline">
            Edit
          </RouterLink>
          <button @click="showDeleteDialog = true" class="btn btn-danger">
            Delete
          </button>
        </div>
      </div>

      <div class="property-layout">
        <div class="property-main">
          <div class="property-gallery">
            <div class="gallery-main">
              <span class="property-type-badge">
                {{ getPropertyTypeName(property.type_id) }}
              </span>
              <span :class="['property-status-badge', getStatusClass(property.property_status)]">
                {{ property.property_status }}
              </span>
            </div>
          </div>

          <div class="property-info-card">
            <h1 class="property-title">{{ property.title }}</h1>
            <p class="property-address">📍 {{ property.property_address }}, {{ property.city }}</p>

            <div class="property-price-section">
              <span class="property-price">{{ formatPrice(property.price) }}</span>
              <span v-if="property.transaction_type === 'rent'" class="price-period">/month</span>
              <span class="transaction-badge">{{ property.transaction_type }}</span>
            </div>

            <div class="property-meta">
              <div class="meta-item">
                <span class="meta-label">Area</span>
                <span class="meta-value">{{ property.area }} m²</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Type</span>
                <span class="meta-value">{{ getPropertyTypeName(property.type_id) }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Status</span>
                <span class="meta-value capitalize">{{ property.property_status }}</span>
              </div>
            </div>

            <div class="property-description">
              <h3>Description</h3>
              <p>{{ property.property_description }}</p>
            </div>

            <div class="property-dates">
              <p><strong>Listed:</strong> {{ formatDate(property.created_at) }}</p>
              <p><strong>Updated:</strong> {{ formatDate(property.updated_at) }}</p>
            </div>
          </div>
        </div>

        <div class="property-sidebar">
          <div class="sidebar-card">
            <h3>Actions</h3>
            <button 
              @click="toggleFavorite" 
              :class="['btn btn-block', isFavorite ? 'btn-danger' : 'btn-outline']"
              :disabled="favoriteLoading"
            >
              {{ isFavorite ? '❤️ Remove from Favorites' : '🤍 Add to Favorites' }}
            </button>
          </div>

          <div class="sidebar-card">
            <h3>Location</h3>
            <div class="location-info">
              <p><strong>Address:</strong> {{ property.property_address }}</p>
              <p><strong>City:</strong> {{ property.city }}</p>
              <p v-if="property.latitude && property.longitude">
                <strong>Coordinates:</strong><br>
                {{ property.latitude.toFixed(6) }}, {{ property.longitude.toFixed(6) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </template>

    <ConfirmDialog
      :show="showDeleteDialog"
      title="Delete Property"
      message="Are you sure you want to delete this property? This action cannot be undone."
      confirm-text="Delete"
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
