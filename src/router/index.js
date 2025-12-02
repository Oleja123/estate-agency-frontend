import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue')
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/auth/LoginView.vue'),
    meta: { guest: true }
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('../views/auth/RegisterView.vue'),
    meta: { guest: true }
  },
  {
    path: '/properties',
    name: 'properties',
    component: () => import('../views/properties/PropertiesView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/properties/:id',
    name: 'property-detail',
    component: () => import('../views/properties/PropertyDetailView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/properties/create',
    name: 'property-create',
    component: () => import('../views/properties/PropertyFormView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/properties/:id/edit',
    name: 'property-edit',
    component: () => import('../views/properties/PropertyFormView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/favorites',
    name: 'favorites',
    component: () => import('../views/properties/FavoritesView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/users',
    name: 'users',
    component: () => import('../views/users/UsersView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/users/:id',
    name: 'user-detail',
    component: () => import('../views/users/UserDetailView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('../views/users/ProfileView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/property-types',
    name: 'property-types',
    component: () => import('../views/property-types/PropertyTypesView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFoundView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else if (to.meta.requiresAdmin && !authStore.isAdmin) {
    next({ name: 'home' })
  } else if (to.meta.guest && authStore.isAuthenticated) {
    next({ name: 'home' })
  } else {
    next()
  }
})

export default router
