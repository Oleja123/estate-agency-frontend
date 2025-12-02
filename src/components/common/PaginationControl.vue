<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentPage: {
    type: Number,
    required: true
  },
  totalPages: {
    type: Number,
    required: true
  },
  maxVisiblePages: {
    type: Number,
    default: 5
  }
})

const emit = defineEmits(['page-change'])

const visiblePages = computed(() => {
  const pages = []
  const half = Math.floor(props.maxVisiblePages / 2)
  let start = Math.max(1, props.currentPage - half)
  let end = Math.min(props.totalPages, start + props.maxVisiblePages - 1)
  
  if (end - start + 1 < props.maxVisiblePages) {
    start = Math.max(1, end - props.maxVisiblePages + 1)
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

function goToPage(page) {
  if (page >= 1 && page <= props.totalPages && page !== props.currentPage) {
    emit('page-change', page)
  }
}
</script>

<template>
  <nav v-if="totalPages > 1" class="pagination">
    <button 
      class="pagination-btn" 
      :disabled="currentPage === 1"
      @click="goToPage(1)"
    >
      ««
    </button>
    <button 
      class="pagination-btn" 
      :disabled="currentPage === 1"
      @click="goToPage(currentPage - 1)"
    >
      «
    </button>
    
    <button 
      v-for="page in visiblePages" 
      :key="page"
      :class="['pagination-btn', { active: page === currentPage }]"
      @click="goToPage(page)"
    >
      {{ page }}
    </button>
    
    <button 
      class="pagination-btn" 
      :disabled="currentPage === totalPages"
      @click="goToPage(currentPage + 1)"
    >
      »
    </button>
    <button 
      class="pagination-btn" 
      :disabled="currentPage === totalPages"
      @click="goToPage(totalPages)"
    >
      »»
    </button>
  </nav>
</template>

<style scoped>
.pagination {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 2rem;
}

.pagination-btn {
  min-width: 40px;
  height: 40px;
  padding: 0 0.75rem;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.pagination-btn.active {
  background: #2563eb;
  border-color: #2563eb;
  color: white;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
