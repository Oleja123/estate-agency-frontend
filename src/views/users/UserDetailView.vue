<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useUsersStore } from '../../stores/users'
import { useAuthStore } from '../../stores/auth'
import LoadingSpinner from '../../components/common/LoadingSpinner.vue'
import AlertMessage from '../../components/common/AlertMessage.vue'
import ConfirmDialog from '../../components/common/ConfirmDialog.vue'

const route = useRoute()
const router = useRouter()
const usersStore = useUsersStore()
const authStore = useAuthStore()

const user = computed(() => usersStore.currentUser)
const isAdmin = computed(() => authStore.isAdmin)
const isOwnProfile = computed(() => authStore.currentUserId === parseInt(route.params.id))
const showDeleteDialog = ref(false)

onMounted(async () => {
  const id = parseInt(route.params.id)
  await usersStore.fetchUser(id)
})

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

async function handleDelete() {
  if (!user.value) return
  
  try {
    await usersStore.deleteUser(user.value.id)
    router.push('/users')
  } catch (error) {
    console.error('Failed to delete user:', error)
  }
  showDeleteDialog.value = false
}

async function toggleActive() {
  if (!user.value) return
  
  try {
    await usersStore.toggleActive(user.value.id)
    await usersStore.fetchUser(user.value.id)
  } catch (error) {
    console.error('Failed to toggle active status:', error)
  }
}
</script>

<template>
  <div class="user-detail-page">
    <LoadingSpinner v-if="usersStore.loading" message="Loading user..." />

    <AlertMessage
      v-if="usersStore.error"
      type="error"
      :message="usersStore.error"
      @dismiss="usersStore.clearError"
    />

    <template v-if="user && !usersStore.loading">
      <div class="page-header">
        <RouterLink v-if="isAdmin" to="/users" class="back-link">
          ← Back to Users
        </RouterLink>
        <RouterLink v-else to="/" class="back-link">
          ← Back to Home
        </RouterLink>
        <div v-if="isAdmin && !isOwnProfile" class="page-actions">
          <button @click="toggleActive" class="btn btn-outline">
            {{ user.is_active ? 'Deactivate' : 'Activate' }}
          </button>
          <button @click="showDeleteDialog = true" class="btn btn-danger">
            Delete
          </button>
        </div>
      </div>

      <div class="user-profile">
        <div class="profile-header">
          <div class="profile-avatar">👤</div>
          <div class="profile-info">
            <h1 class="profile-name">{{ user.first_name }} {{ user.last_name }}</h1>
            <p class="profile-email">{{ user.email }}</p>
            <div class="profile-badges">
              <span :class="['role-badge', `role-${user.role}`]">
                {{ user.role }}
              </span>
              <span :class="['status-badge', user.is_active ? 'status-active' : 'status-inactive']">
                {{ user.is_active ? 'Active' : 'Inactive' }}
              </span>
            </div>
          </div>
        </div>

        <div class="profile-details">
          <div class="detail-card">
            <h3>Contact Information</h3>
            <div class="detail-row">
              <span class="detail-label">Email</span>
              <span class="detail-value">{{ user.email }}</span>
            </div>
            <div v-if="user.phone_number" class="detail-row">
              <span class="detail-label">Phone</span>
              <span class="detail-value">{{ user.phone_number }}</span>
            </div>
          </div>

          <div class="detail-card">
            <h3>Account Details</h3>
            <div class="detail-row">
              <span class="detail-label">User ID</span>
              <span class="detail-value">#{{ user.id }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Role</span>
              <span class="detail-value capitalize">{{ user.role }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Status</span>
              <span class="detail-value">{{ user.is_active ? 'Active' : 'Inactive' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Joined</span>
              <span class="detail-value">{{ formatDate(user.created_at) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Last Updated</span>
              <span class="detail-value">{{ formatDate(user.updated_at) }}</span>
            </div>
          </div>
        </div>

        <div v-if="isOwnProfile" class="profile-actions">
          <RouterLink to="/profile" class="btn btn-primary">
            Edit Profile
          </RouterLink>
        </div>
      </div>
    </template>

    <ConfirmDialog
      :show="showDeleteDialog"
      title="Delete User"
      :message="`Are you sure you want to delete ${user?.first_name} ${user?.last_name}? This action cannot be undone.`"
      confirm-text="Delete"
      @confirm="handleDelete"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>

<style scoped>
.user-detail-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
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

.user-profile {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.profile-avatar {
  font-size: 4rem;
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-name {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.profile-email {
  opacity: 0.9;
  margin-bottom: 0.75rem;
}

.profile-badges {
  display: flex;
  gap: 0.5rem;
}

.role-badge,
.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
}

.role-admin {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.role-client {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.status-active {
  background: #d1fae5;
  color: #065f46;
}

.status-inactive {
  background: #fee2e2;
  color: #991b1b;
}

.profile-details {
  padding: 2rem;
  display: grid;
  gap: 1.5rem;
}

.detail-card {
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 8px;
}

.detail-card h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
}

.detail-label {
  color: #6b7280;
}

.detail-value {
  font-weight: 500;
  color: #111827;
}

.capitalize {
  text-transform: capitalize;
}

.profile-actions {
  padding: 1.5rem 2rem;
  border-top: 1px solid #e5e7eb;
}

.btn {
  padding: 0.625rem 1rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  text-decoration: none;
  display: inline-block;
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

@media (max-width: 600px) {
  .profile-header {
    flex-direction: column;
    text-align: center;
  }
}
</style>
