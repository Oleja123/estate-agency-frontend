<script setup>
import { computed } from 'vue'

const props = defineProps({
  message: {
    type: String,
    default: 'Загрузка...'
  }
})

const displayMessage = computed(() => {
  const m = props.message || ''
  return m ? m.charAt(0).toUpperCase() + m.slice(1) : m
})
</script>

<template>
  <div class="loading-spinner">
    <div class="spinner"></div>
    <p class="loading-message">{{ displayMessage }}</p>
  </div>
</template>

<style scoped>
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-message {
  margin-top: 1rem;
  color: #6b7280;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
