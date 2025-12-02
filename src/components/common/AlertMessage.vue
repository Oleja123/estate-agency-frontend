<script setup>
defineProps({
  type: {
    type: String,
    default: 'error',
    validator: (value) => ['success', 'error', 'warning', 'info'].includes(value)
  },
  message: {
    type: String,
    required: true
  },
  dismissible: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['dismiss'])

function handleDismiss() {
  emit('dismiss')
}
</script>

<template>
  <div :class="['alert', `alert-${type}`]">
    <span class="alert-icon">
      <template v-if="type === 'success'">✓</template>
      <template v-else-if="type === 'error'">✕</template>
      <template v-else-if="type === 'warning'">⚠</template>
      <template v-else>ℹ</template>
    </span>
    <span class="alert-message">{{ message }}</span>
    <button v-if="dismissible" @click="handleDismiss" class="alert-dismiss">×</button>
  </div>
</template>

<style scoped>
.alert {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.alert-success {
  background: #d1fae5;
  color: #065f46;
}

.alert-error {
  background: #fee2e2;
  color: #991b1b;
}

.alert-warning {
  background: #fef3c7;
  color: #92400e;
}

.alert-info {
  background: #dbeafe;
  color: #1e40af;
}

.alert-icon {
  font-size: 1.25rem;
  font-weight: bold;
}

.alert-message {
  flex: 1;
}

.alert-dismiss {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  opacity: 0.5;
  transition: opacity 0.2s;
}

.alert-dismiss:hover {
  opacity: 1;
}
</style>
