<script setup>
import { ref, onMounted } from 'vue'
import { usePropertyTypesStore } from '../../stores/propertyTypes'
import PaginationControl from '../../components/common/PaginationControl.vue'
import LoadingSpinner from '../../components/common/LoadingSpinner.vue'
import AlertMessage from '../../components/common/AlertMessage.vue'
import ModalDialog from '../../components/common/ModalDialog.vue'
import ConfirmDialog from '../../components/common/ConfirmDialog.vue'
import paginationConfig from '../../config/pagination'

const propertyTypesStore = usePropertyTypesStore()

const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteDialog = ref(false)
const selectedType = ref(null)
const newTypeName = ref('')
const editTypeName = ref('')
const formError = ref('')
const limit = ref(paginationConfig.propertyTypes)
const offset = ref(0)

onMounted(() => {
  loadTypes()
})

async function loadTypes() {
  const params = {
    limit: limit.value,
    offset: offset.value
  }

  console.log('[PropertyTypesView] loadTypes -> built params:', params)
  try {
    await propertyTypesStore.fetchPropertyTypes(params)
  } catch (err) {
    console.error('[PropertyTypesView] loadTypes -> fetchPropertyTypes failed:', err)
    throw err
  }
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function openCreateModal() {
  newTypeName.value = ''
  formError.value = ''
  showCreateModal.value = true
}

function openEditModal(type) {
  selectedType.value = type
  editTypeName.value = type.name
  formError.value = ''
  showEditModal.value = true
}

function openDeleteDialog(type) {
  selectedType.value = type
  showDeleteDialog.value = true
}

async function handleCreate() {
  if (!newTypeName.value.trim()) {
    formError.value = 'Name is required'
    return
  }
  
  try {
    await propertyTypesStore.createPropertyType(newTypeName.value.trim())
    showCreateModal.value = false
    newTypeName.value = ''
    // reload current page
    await loadTypes()
  } catch (error) {
    formError.value = error.response?.data?.message || 'Failed to create property type'
  }
}

async function handleUpdate() {
  if (!editTypeName.value.trim()) {
    formError.value = 'Name is required'
    return
  }
  
  if (!selectedType.value) return
  
  try {
    await propertyTypesStore.updatePropertyType(selectedType.value.id, editTypeName.value.trim())
    showEditModal.value = false
    selectedType.value = null
    // reload current page
    await loadTypes()
  } catch (error) {
    formError.value = error.response?.data?.message || 'Failed to update property type'
  }
}

async function handleDelete() {
  if (!selectedType.value) return
  
  try {
    await propertyTypesStore.deletePropertyType(selectedType.value.id)
    showDeleteDialog.value = false
    selectedType.value = null
    // ensure current page is still valid
    const pages = Math.ceil(propertyTypesStore.total / limit.value)
    if (Math.floor(offset.value / limit.value) + 1 > pages && pages > 0) {
      offset.value = (pages - 1) * limit.value
    }
    await loadTypes()
  } catch (error) {
    console.error('Failed to delete property type:', error)
  }
}

function handlePageChange(page) {
  offset.value = (page - 1) * limit.value
  loadTypes()
}

const currentPage = () => Math.floor(offset.value / limit.value) + 1
const totalPages = () => Math.ceil(Number(propertyTypesStore.total || 0) / Number(limit.value || 3))
</script>

<template>
  <div class="property-types-page">
    <div class="page-header">
      <div class="page-header-content">
        <h1 class="page-title">Типы недвижимости</h1>
        <p class="page-subtitle">Управление категориями типов недвижимости</p>
      </div>
      <button @click="openCreateModal" class="btn btn-primary">
        Добавить тип недвижимости
      </button>
    </div>

    <AlertMessage
      v-if="propertyTypesStore.error"
      type="error"
      :message="propertyTypesStore.error"
      @dismiss="propertyTypesStore.clearError"
    />

  <LoadingSpinner v-if="propertyTypesStore.loading" message="Загрузка типов недвижимости..." />

    <template v-else>
      <div v-if="propertyTypesStore.propertyTypes.length === 0" class="empty-state">
        <div class="empty-icon">🏷️</div>
        <h3>Типы не найдены</h3>
        <p>Создайте первый тип недвижимости, чтобы начать.</p>
        <button @click="openCreateModal" class="btn btn-primary">
          Добавить тип
        </button>
      </div>

      <div v-else class="types-grid">
        <div
          v-for="type in propertyTypesStore.propertyTypes"
          :key="type.id"
          class="type-card"
        >
          <div class="type-info">
            <h3 class="type-name">{{ type.name }}</h3>
            <p class="type-meta">Создано {{ formatDate(type.created_at) }}</p>
          </div>
          <div class="type-actions">
            <button @click="openEditModal(type)" class="action-btn">
              Редактировать
            </button>
            <button @click="openDeleteDialog(type)" class="action-btn action-btn-danger">
              Удалить
            </button>
          </div>
        </div>
      </div>
    </template>

    <ModalDialog
      :show="showCreateModal"
      title="Add Property Type"
      size="small"
      @close="showCreateModal = false"
    >
      <div class="type-form">
        <AlertMessage
          v-if="propertyTypesStore.error || formError"
          type="error"
          :message="propertyTypesStore.error || formError"
          @dismiss="propertyTypesStore.clearError"
        />
        <div class="form-group">
          <label for="new-type-name" class="form-label">Название</label>
          <input
            id="new-type-name"
            v-model="newTypeName"
            type="text"
            class="form-input"
            placeholder="Напр., Квартира, Дом, Коммерческая"
            @keyup.enter="handleCreate"
          />
          <span v-if="propertyTypesStore.fieldErrors && propertyTypesStore.fieldErrors.name" class="error-text">{{ propertyTypesStore.fieldErrors.name }}</span>
        </div>
      </div>
      <template #footer>
        <button @click="showCreateModal = false" class="btn btn-outline">Отмена</button>
        <button @click="handleCreate" class="btn btn-primary">Создать</button>
      </template>
    </ModalDialog>

    <ModalDialog
      :show="showEditModal"
      title="Редактировать тип недвижимости"
      size="small"
      @close="showEditModal = false"
    >
      <div class="type-form">
        <AlertMessage
          v-if="propertyTypesStore.error || formError"
          type="error"
          :message="propertyTypesStore.error || formError"
          @dismiss="propertyTypesStore.clearError"
        />
        <div class="form-group">
          <label for="edit-type-name" class="form-label">Название</label>
          <input
            id="edit-type-name"
            v-model="editTypeName"
            type="text"
            class="form-input"
            @keyup.enter="handleUpdate"
          />
          <span v-if="propertyTypesStore.fieldErrors && propertyTypesStore.fieldErrors.name" class="error-text">{{ propertyTypesStore.fieldErrors.name }}</span>
        </div>
      </div>
      <template #footer>
        <button @click="showEditModal = false" class="btn btn-outline">Отмена</button>
        <button @click="handleUpdate" class="btn btn-primary">Сохранить</button>
      </template>
    </ModalDialog>

    <PaginationControl
      :current-page="currentPage()"
      :total-pages="totalPages()"
      @page-change="handlePageChange"
    />

    <ConfirmDialog
      :show="showDeleteDialog"
      title="Delete Property Type"
      :message="`Are you sure you want to delete '${selectedType?.name}'? This may affect properties using this type.`"
      confirm-text="Delete"
      @confirm="handleDelete"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>

<style scoped>
.property-types-page {
  max-width: 800px;
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

.types-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.type-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.type-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.25rem;
}

.type-meta {
  color: #6b7280;
  font-size: 0.875rem;
}

.type-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.2s;
}

.action-btn:hover {
  background: #e5e7eb;
}

.action-btn-danger {
  background: #fee2e2;
  color: #991b1b;
}

.action-btn-danger:hover {
  background: #fecaca;
}

.btn {
  padding: 0.625rem 1rem;
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

.type-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
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
}

.form-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

@media (max-width: 600px) {
  .type-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .type-actions {
    width: 100%;
  }

  .action-btn {
    flex: 1;
  }
}
</style>
