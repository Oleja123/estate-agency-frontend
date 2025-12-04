<template>
  <RouterLink v-if="to" :to="to" class="back-button" :aria-label="ariaLabel || labelText">
    <svg class="back-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <span class="back-text"><slot>{{ labelText }}</slot></span>
  </RouterLink>

  <button v-else type="button" @click="goBack" class="back-button" :aria-label="ariaLabel || labelText">
    <svg class="back-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <span class="back-text"><slot>{{ labelText }}</slot></span>
  </button>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { computed } from 'vue'
const props = defineProps({
  to: { type: [String, Object], default: null },
  label: { type: String, default: '' },
  ariaLabel: { type: String, default: '' }
})

const router = useRouter()
function goBack() {
  try { router.back() } catch (e) { /* noop */ }
}

const labelText = computed(() => props.label || 'Назад')
</script>

<style scoped>
.back-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.85rem;
  background: #ffffff;
  border: 1px solid #e6eefc;
  color: #1e40af;
  font-weight: 600;
  border-radius: 8px;
  text-decoration: none;
  box-shadow: 0 1px 2px rgba(16,24,40,0.04);
  transition: transform 0.12s ease, box-shadow 0.12s ease;
  cursor: pointer;
}
.back-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(16,24,40,0.08);
}
.back-icon { font-size: 1.05rem; }
.back-text { display: inline-block; }
</style>
