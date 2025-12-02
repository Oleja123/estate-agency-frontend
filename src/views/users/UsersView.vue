<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useUsersStore } from '../../stores/users'
import LoadingSpinner from '../../components/common/LoadingSpinner.vue'
import AlertMessage from '../../components/common/AlertMessage.vue'
import PaginationControl from '../../components/common/PaginationControl.vue'
import ConfirmDialog from '../../components/common/ConfirmDialog.vue'
import ModalDialog from '../../components/common/ModalDialog.vue'

const usersStore = useUsersStore()

const limit = ref(10)
const offset = ref(0)
const search = ref('')
const roleFilter = ref('')
const activeFilter = ref('')

const showDeleteDialog = ref(false)
const showRoleDialog = ref(false)
const selectedUser = ref(null)
const newRole = ref('')

const roles = ['client', 'admin']

onMounted(() => {
  loadUsers()
})

async function loadUsers() {
  const params = {
    limit: limit.value,
    offset: offset.value
  }
  
  if (search.value) {
    params.search = search.value
  }
  
  if (roleFilter.value) {
    params.role = roleFilter.value
  }
  
  if (activeFilter.value !== '') {
    params.is_active = activeFilter.value === 'true'
  }
  
  await usersStore.fetchUsers(params)
}

function handleSearch() {
  offset.value = 0
  loadUsers()
}

function handlePageChange(page) {
  offset.value = (page - 1) * limit.value
  loadUsers()
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function openRoleDialog(user) {
  selectedUser.value = user
  newRole.value = user.role
  showRoleDialog.value = true
}

async function handleChangeRole() {
  if (!selectedUser.value) return
  
  try {
    await usersStore.changeRole(selectedUser.value.id, newRole.value)
    showRoleDialog.value = false
    selectedUser.value = null
  } catch (error) {
    console.error('Failed to change role:', error)
  }
}

function openDeleteDialog(user) {
  selectedUser.value = user
  showDeleteDialog.value = true
}

async function handleDelete() {
  if (!selectedUser.value) return
  
  try {
    await usersStore.deleteUser(selectedUser.value.id)
    showDeleteDialog.value = false
    selectedUser.value = null
  } catch (error) {
    console.error('Failed to delete user:', error)
  }
}

async function toggleActive(user) {
  try {
    await usersStore.toggleActive(user.id)
  } catch (error) {
    console.error('Failed to toggle active status:', error)
  }
}

const currentPage = () => Math.floor(offset.value / limit.value) + 1
const totalPages = () => Math.ceil(usersStore.total / limit.value)
</script>

<template>
  <div class="users-page">
    <div class="page-header">
      <h1 class="page-title">User Management</h1>
      <p class="page-subtitle">Manage registered users</p>
    </div>

    <div class="filters-panel">
      <div class="filters-row">
        <div class="search-group">
          <input
            v-model="search"
            type="text"
            class="search-input"
            placeholder="Search users..."
            @keyup.enter="handleSearch"
          />
          <button @click="handleSearch" class="btn btn-primary">Search</button>
        </div>
        
        <div class="filter-group">
          <select v-model="roleFilter" class="filter-select" @change="handleSearch">
            <option value="">All Roles</option>
            <option v-for="role in roles" :key="role" :value="role">
              {{ role.charAt(0).toUpperCase() + role.slice(1) }}
            </option>
          </select>
        </div>
        
        <div class="filter-group">
          <select v-model="activeFilter" class="filter-select" @change="handleSearch">
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>
    </div>

    <AlertMessage
      v-if="usersStore.error"
      type="error"
      :message="usersStore.error"
      @dismiss="usersStore.clearError"
    />

    <LoadingSpinner v-if="usersStore.loading" message="Loading users..." />

    <template v-else>
      <div v-if="usersStore.users.length === 0" class="empty-state">
        <div class="empty-icon">👥</div>
        <h3>No Users Found</h3>
        <p>Try adjusting your search criteria.</p>
      </div>

      <div v-else class="users-table-container">
        <table class="users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in usersStore.users" :key="user.id">
              <td>
                <div class="user-info">
                  <div class="user-avatar">👤</div>
                  <div class="user-name">
                    {{ user.first_name }} {{ user.last_name }}
                  </div>
                </div>
              </td>
              <td>{{ user.email }}</td>
              <td>
                <span :class="['role-badge', `role-${user.role}`]">
                  {{ user.role }}
                </span>
              </td>
              <td>
                <span :class="['status-badge', user.is_active ? 'status-active' : 'status-inactive']">
                  {{ user.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td>{{ formatDate(user.created_at) }}</td>
              <td>
                <div class="actions-group">
                  <RouterLink :to="`/users/${user.id}`" class="action-btn">
                    View
                  </RouterLink>
                  <button @click="openRoleDialog(user)" class="action-btn">
                    Role
                  </button>
                  <button @click="toggleActive(user)" class="action-btn">
                    {{ user.is_active ? 'Deactivate' : 'Activate' }}
                  </button>
                  <button @click="openDeleteDialog(user)" class="action-btn action-btn-danger">
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <PaginationControl
        :current-page="currentPage()"
        :total-pages="totalPages()"
        @page-change="handlePageChange"
      />
    </template>

    <ConfirmDialog
      :show="showDeleteDialog"
      title="Delete User"
      :message="`Are you sure you want to delete ${selectedUser?.first_name} ${selectedUser?.last_name}?`"
      confirm-text="Delete"
      @confirm="handleDelete"
      @cancel="showDeleteDialog = false"
    />

    <ModalDialog
      :show="showRoleDialog"
      title="Change User Role"
      size="small"
      @close="showRoleDialog = false"
    >
      <div class="role-form">
        <p>Change role for <strong>{{ selectedUser?.first_name }} {{ selectedUser?.last_name }}</strong></p>
        <div class="form-group">
          <label for="role" class="form-label">Role</label>
          <select id="role" v-model="newRole" class="form-input">
            <option v-for="role in roles" :key="role" :value="role">
              {{ role.charAt(0).toUpperCase() + role.slice(1) }}
            </option>
          </select>
        </div>
      </div>
      <template #footer>
        <button @click="showRoleDialog = false" class="btn btn-outline">Cancel</button>
        <button @click="handleChangeRole" class="btn btn-primary">Save</button>
      </template>
    </ModalDialog>
  </div>
</template>

<style scoped>
.users-page {
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

.filters-panel {
  background: white;
  border-radius: 12px;
  padding: 1rem 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.filters-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.search-group {
  display: flex;
  gap: 0.5rem;
  flex: 1;
  min-width: 250px;
}

.search-input {
  flex: 1;
  padding: 0.625rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
}

.search-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.filter-select {
  padding: 0.625rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  min-width: 140px;
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

.users-table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th,
.users-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.users-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  font-size: 1.5rem;
}

.user-name {
  font-weight: 500;
  color: #111827;
}

.role-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
}

.role-admin {
  background: #dbeafe;
  color: #1e40af;
}

.role-client {
  background: #f3f4f6;
  color: #374151;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-active {
  background: #d1fae5;
  color: #065f46;
}

.status-inactive {
  background: #fee2e2;
  color: #991b1b;
}

.actions-group {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.action-btn {
  padding: 0.375rem 0.75rem;
  background: #f3f4f6;
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  text-decoration: none;
  color: #374151;
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

.role-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.role-form p {
  color: #4b5563;
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
  padding: 0.625rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
}

@media (max-width: 768px) {
  .users-table-container {
    overflow-x: auto;
  }
  
  .users-table {
    min-width: 800px;
  }
}
</style>
