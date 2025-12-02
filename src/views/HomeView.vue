<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const isAuthenticated = computed(() => authStore.isAuthenticated)
</script>

<template>
  <div class="home">
    <section class="hero">
      <div class="hero-content">
        <h1 class="hero-title">
          Find Your Dream
          <span class="highlight">Property</span>
        </h1>
        <p class="hero-subtitle">
          Discover the perfect place to call home. Browse through our extensive 
          collection of properties for sale and rent.
        </p>
        <div class="hero-actions">
          <template v-if="isAuthenticated">
            <RouterLink to="/properties" class="btn btn-primary btn-lg">
              Browse Properties
            </RouterLink>
            <RouterLink to="/favorites" class="btn btn-outline btn-lg">
              My Favorites
            </RouterLink>
          </template>
          <template v-else>
            <RouterLink to="/register" class="btn btn-primary btn-lg">
              Get Started
            </RouterLink>
            <RouterLink to="/login" class="btn btn-outline btn-lg">
              Sign In
            </RouterLink>
          </template>
        </div>
      </div>
    </section>

    <section class="features">
      <h2 class="section-title">Why Choose Us?</h2>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">🏠</div>
          <h3 class="feature-title">Wide Selection</h3>
          <p class="feature-description">
            Browse through hundreds of properties including apartments, houses, 
            and commercial spaces.
          </p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🔍</div>
          <h3 class="feature-title">Advanced Search</h3>
          <p class="feature-description">
            Find exactly what you're looking for with our powerful search 
            and filter options.
          </p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">❤️</div>
          <h3 class="feature-title">Save Favorites</h3>
          <p class="feature-description">
            Save properties you love and easily access them later from 
            your favorites list.
          </p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">📍</div>
          <h3 class="feature-title">Location Based</h3>
          <p class="feature-description">
            Search properties by location and find the perfect spot 
            in your preferred area.
          </p>
        </div>
      </div>
    </section>

    <section v-if="!isAuthenticated" class="cta">
      <h2 class="cta-title">Ready to Find Your Perfect Property?</h2>
      <p class="cta-subtitle">
        Join thousands of satisfied customers who found their dream homes with us.
      </p>
      <RouterLink to="/register" class="btn btn-primary btn-lg">
        Create Free Account
      </RouterLink>
    </section>
  </div>
</template>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.hero {
  padding: 4rem 0;
  text-align: center;
}

.hero-title {
  font-size: 3rem;
  font-weight: 800;
  color: #111827;
  line-height: 1.2;
  margin-bottom: 1.5rem;
}

.highlight {
  color: #2563eb;
}

.hero-subtitle {
  font-size: 1.25rem;
  color: #6b7280;
  max-width: 600px;
  margin: 0 auto 2rem;
}

.hero-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  display: inline-block;
}

.btn-lg {
  padding: 1rem 2rem;
  font-size: 1.125rem;
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
  border: 2px solid #d1d5db;
  color: #374151;
}

.btn-outline:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.features {
  padding: 4rem 0;
}

.section-title {
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  text-align: center;
  margin-bottom: 3rem;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.feature-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  text-align: center;
  transition: transform 0.2s, box-shadow 0.2s;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.75rem;
}

.feature-description {
  color: #6b7280;
  line-height: 1.6;
}

.cta {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  border-radius: 16px;
  padding: 4rem 2rem;
  text-align: center;
  margin: 4rem 0;
}

.cta-title {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin-bottom: 1rem;
}

.cta-subtitle {
  font-size: 1.125rem;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 2rem;
}

.cta .btn-primary {
  background: white;
  color: #2563eb;
}

.cta .btn-primary:hover {
  background: #f3f4f6;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .cta-title {
    font-size: 1.5rem;
  }
}
</style>
