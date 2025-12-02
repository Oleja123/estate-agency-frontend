<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="not-found">
    <div class="not-found-content">
      <h1 class="not-found-code">404</h1>
      <h2 class="not-found-title">Page Not Found</h2>
      <p class="not-found-message">
        Sorry, we couldn't find the page you're looking for.
      </p>
      <RouterLink to="/" class="btn btn-primary">
        Go to Home
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  min-height: calc(100vh - 200px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.not-found-content {
  text-align: center;
}

.not-found-code {
  font-size: 8rem;
  font-weight: 800;
  color: #2563eb;
  line-height: 1;
  margin-bottom: 1rem;
}

.not-found-title {
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 1rem;
}

.not-found-message {
  color: #6b7280;
  margin-bottom: 2rem;
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

.btn-primary {
  background: #2563eb;
  color: white;
}

.btn-primary:hover {
  background: #1d4ed8;
}
</style>
