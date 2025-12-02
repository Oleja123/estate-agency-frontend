<script setup>
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const isAuthenticated = computed(() => authStore.isAuthenticated)
const isAdmin = computed(() => authStore.isAdmin)
const userName = computed(() => {
  if (authStore.user) {
    return `${authStore.user.first_name} ${authStore.user.last_name}`
  }
  return ''
})

function handleLogout() {
  authStore.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <header class="navbar">
    <div class="navbar-container">
      <RouterLink to="/" class="navbar-brand">
        <span class="brand-icon">🏠</span>
        Estate Agency
      </RouterLink>

      <nav class="navbar-nav" v-if="isAuthenticated">
        <RouterLink to="/properties" class="nav-link">Properties</RouterLink>
        <RouterLink to="/favorites" class="nav-link">Favorites</RouterLink>
        <RouterLink v-if="isAdmin" to="/users" class="nav-link">Users</RouterLink>
        <RouterLink v-if="isAdmin" to="/property-types" class="nav-link">Property Types</RouterLink>
      </nav>

      <div class="navbar-actions">
        <template v-if="isAuthenticated">
          <RouterLink to="/profile" class="user-info">
            <span class="user-avatar">👤</span>
            <span class="user-name">{{ userName }}</span>
            <span v-if="isAdmin" class="admin-badge">Admin</span>
          </RouterLink>
          <button @click="handleLogout" class="btn btn-outline">Logout</button>
        </template>
        <template v-else>
          <RouterLink to="/login" class="btn btn-outline">Login</RouterLink>
          <RouterLink to="/register" class="btn btn-primary">Register</RouterLink>
        </template>
      </div>
    </div>
  </header>
</template>

<style scoped>
.navbar {
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.navbar-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: #2563eb;
  text-decoration: none;
}

.brand-icon {
  font-size: 1.5rem;
}

.navbar-nav {
  display: flex;
  gap: 1.5rem;
}

.nav-link {
  color: #4b5563;
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 0;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: #2563eb;
  border-bottom-color: #2563eb;
}

.navbar-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  background: #f3f4f6;
  text-decoration: none;
  color: #374151;
  transition: background 0.2s;
}

.user-info:hover {
  background: #e5e7eb;
}

.user-avatar {
  font-size: 1.25rem;
}

.user-name {
  font-weight: 500;
}

.admin-badge {
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  background: #2563eb;
  color: white;
  border-radius: 4px;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-size: 0.875rem;
}

.btn-outline {
  background: transparent;
  border: 1px solid #d1d5db;
  color: #374151;
}

.btn-outline:hover {
  background: #f3f4f6;
}

.btn-primary {
  background: #2563eb;
  color: white;
}

.btn-primary:hover {
  background: #1d4ed8;
}

@media (max-width: 768px) {
  .navbar-nav {
    display: none;
  }

  .user-name {
    display: none;
  }
}
</style>
