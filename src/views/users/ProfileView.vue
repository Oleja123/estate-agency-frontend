<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useUsersStore } from '../../stores/users'
import LoadingSpinner from '../../components/common/LoadingSpinner.vue'
import AlertMessage from '../../components/common/AlertMessage.vue'

const router = useRouter()
const authStore = useAuthStore()
const usersStore = useUsersStore()

const activeTab = ref('profile')
const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const profileForm = ref({
  email: '',
  first_name: '',
  last_name: '',
  phone_number: ''
})

const passwordForm = ref({
  current_password: '',
  new_password: '',
  confirm_password: ''
})

const profileErrors = ref({})
const passwordErrors = ref({})

const user = computed(() => authStore.user)
const currentUserId = computed(() => authStore.currentUserId)

onMounted(() => {
  if (user.value) {
    profileForm.value = {
      email: user.value.email || '',
      first_name: user.value.first_name || '',
      last_name: user.value.last_name || '',
      phone_number: user.value.phone_number || ''
    }
  }
})

function validateProfileForm() {
  profileErrors.value = {}
  
  if (!profileForm.value.email) {
    profileErrors.value.email = 'Email is required'
  } else if (!/\S+@\S+\.\S+/.test(profileForm.value.email)) {
    profileErrors.value.email = 'Invalid email format'
  }
  
  if (!profileForm.value.first_name) {
    profileErrors.value.first_name = 'First name is required'
  }
  
  if (!profileForm.value.last_name) {
    profileErrors.value.last_name = 'Last name is required'
  }
  
  return Object.keys(profileErrors.value).length === 0
}

function validatePasswordForm() {
  passwordErrors.value = {}
  
  if (!passwordForm.value.current_password) {
    passwordErrors.value.current_password = 'Current password is required'
  }
  
  if (!passwordForm.value.new_password) {
    passwordErrors.value.new_password = 'New password is required'
  } else if (passwordForm.value.new_password.length < 6) {
    passwordErrors.value.new_password = 'Password must be at least 6 characters'
  }
  
  if (passwordForm.value.new_password !== passwordForm.value.confirm_password) {
    passwordErrors.value.confirm_password = 'Passwords do not match'
  }
  
  return Object.keys(passwordErrors.value).length === 0
}

async function handleProfileSubmit() {
  if (!validateProfileForm()) return
  
  loading.value = true
  successMessage.value = ''
  errorMessage.value = ''
  
  try {
    await usersStore.updateProfile(currentUserId.value, profileForm.value)
    await authStore.updateCurrentUser()
    successMessage.value = 'Profile updated successfully!'
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Failed to update profile'
  } finally {
    loading.value = false
  }
}

async function handlePasswordSubmit() {
  if (!validatePasswordForm()) return
  
  loading.value = true
  successMessage.value = ''
  errorMessage.value = ''
  
  try {
    await usersStore.changePassword(
      currentUserId.value,
      passwordForm.value.current_password,
      passwordForm.value.new_password
    )
    passwordForm.value = {
      current_password: '',
      new_password: '',
      confirm_password: ''
    }
    successMessage.value = 'Password changed successfully!'
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Failed to change password'
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.back()
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>

<template>
  <div class="profile-page">
    <div class="page-header">
      <button @click="goBack" class="back-link">
        ← Back
      </button>
      <h1 class="page-title">My Profile</h1>
    </div>

    <div class="profile-container">
      <div class="profile-sidebar">
        <div class="profile-card">
          <div class="profile-avatar">👤</div>
          <h2 class="profile-name" v-if="user">
            {{ user.first_name }} {{ user.last_name }}
          </h2>
          <p class="profile-email" v-if="user">{{ user.email }}</p>
          <div class="profile-meta" v-if="user">
            <span :class="['role-badge', `role-${user.role}`]">
              {{ user.role }}
            </span>
            <p class="joined-date">Joined {{ formatDate(user.created_at) }}</p>
          </div>
        </div>

        <nav class="profile-nav">
          <button 
            :class="['nav-item', { active: activeTab === 'profile' }]"
            @click="activeTab = 'profile'"
          >
            Edit Profile
          </button>
          <button 
            :class="['nav-item', { active: activeTab === 'password' }]"
            @click="activeTab = 'password'"
          >
            Change Password
          </button>
        </nav>
      </div>

      <div class="profile-content">
        <AlertMessage
          v-if="successMessage"
          type="success"
          :message="successMessage"
          @dismiss="successMessage = ''"
        />

        <AlertMessage
          v-if="errorMessage"
          type="error"
          :message="errorMessage"
          @dismiss="errorMessage = ''"
        />

        <LoadingSpinner v-if="loading" message="Saving..." />

        <div v-else class="tab-content">
          <template v-if="activeTab === 'profile'">
            <div class="content-card">
              <h3 class="content-title">Edit Profile</h3>
              
              <form @submit.prevent="handleProfileSubmit" class="profile-form">
                <div class="form-row">
                  <div class="form-group">
                    <label for="first_name" class="form-label">First Name</label>
                    <input
                      id="first_name"
                      v-model="profileForm.first_name"
                      type="text"
                      class="form-input"
                      :class="{ 'input-error': profileErrors.first_name }"
                    />
                    <span v-if="profileErrors.first_name" class="error-text">
                      {{ profileErrors.first_name }}
                    </span>
                  </div>

                  <div class="form-group">
                    <label for="last_name" class="form-label">Last Name</label>
                    <input
                      id="last_name"
                      v-model="profileForm.last_name"
                      type="text"
                      class="form-input"
                      :class="{ 'input-error': profileErrors.last_name }"
                    />
                    <span v-if="profileErrors.last_name" class="error-text">
                      {{ profileErrors.last_name }}
                    </span>
                  </div>
                </div>

                <div class="form-group">
                  <label for="email" class="form-label">Email</label>
                  <input
                    id="email"
                    v-model="profileForm.email"
                    type="email"
                    class="form-input"
                    :class="{ 'input-error': profileErrors.email }"
                  />
                  <span v-if="profileErrors.email" class="error-text">
                    {{ profileErrors.email }}
                  </span>
                </div>

                <div class="form-group">
                  <label for="phone_number" class="form-label">Phone Number</label>
                  <input
                    id="phone_number"
                    v-model="profileForm.phone_number"
                    type="tel"
                    class="form-input"
                    placeholder="+1234567890"
                  />
                </div>

                <button type="submit" class="btn btn-primary">
                  Save Changes
                </button>
              </form>
            </div>
          </template>

          <template v-if="activeTab === 'password'">
            <div class="content-card">
              <h3 class="content-title">Change Password</h3>
              
              <form @submit.prevent="handlePasswordSubmit" class="profile-form">
                <div class="form-group">
                  <label for="current_password" class="form-label">Current Password</label>
                  <input
                    id="current_password"
                    v-model="passwordForm.current_password"
                    type="password"
                    class="form-input"
                    :class="{ 'input-error': passwordErrors.current_password }"
                  />
                  <span v-if="passwordErrors.current_password" class="error-text">
                    {{ passwordErrors.current_password }}
                  </span>
                </div>

                <div class="form-group">
                  <label for="new_password" class="form-label">New Password</label>
                  <input
                    id="new_password"
                    v-model="passwordForm.new_password"
                    type="password"
                    class="form-input"
                    :class="{ 'input-error': passwordErrors.new_password }"
                  />
                  <span v-if="passwordErrors.new_password" class="error-text">
                    {{ passwordErrors.new_password }}
                  </span>
                </div>

                <div class="form-group">
                  <label for="confirm_password" class="form-label">Confirm New Password</label>
                  <input
                    id="confirm_password"
                    v-model="passwordForm.confirm_password"
                    type="password"
                    class="form-input"
                    :class="{ 'input-error': passwordErrors.confirm_password }"
                  />
                  <span v-if="passwordErrors.confirm_password" class="error-text">
                    {{ passwordErrors.confirm_password }}
                  </span>
                </div>

                <button type="submit" class="btn btn-primary">
                  Change Password
                </button>
              </form>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  max-width: 1000px;
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

.profile-container {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 2rem;
}

.profile-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.profile-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.profile-avatar {
  font-size: 4rem;
  width: 100px;
  height: 100px;
  background: #f3f4f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}

.profile-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.25rem;
}

.profile-email {
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.profile-meta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
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

.joined-date {
  color: #9ca3af;
  font-size: 0.75rem;
}

.profile-nav {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.nav-item {
  display: block;
  width: 100%;
  padding: 1rem 1.5rem;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 500;
  color: #4b5563;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}

.nav-item:hover {
  background: #f9fafb;
}

.nav-item.active {
  background: #eff6ff;
  color: #2563eb;
  border-left-color: #2563eb;
}

.profile-content {
  min-width: 0;
}

.content-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.content-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
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

.input-error {
  border-color: #dc2626;
}

.error-text {
  color: #dc2626;
  font-size: 0.875rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  align-self: flex-start;
}

.btn-primary {
  background: #2563eb;
  color: white;
}

.btn-primary:hover {
  background: #1d4ed8;
}

@media (max-width: 768px) {
  .profile-container {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
