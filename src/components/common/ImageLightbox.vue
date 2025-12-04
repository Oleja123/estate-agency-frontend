<template>
  <div v-if="visible" class="lightbox-overlay" @click.self="close">
    <div class="lightbox-content">
      <button class="lightbox-close" @click="close">×</button>
      <button v-if="hasPrev" class="lightbox-prev" @click.stop="prev">‹</button>
      <img :src="currentSrc" class="lightbox-img" @click.stop />
      <button v-if="hasNext" class="lightbox-next" @click.stop="next">›</button>
      <div v-if="caption" class="lightbox-caption">{{ caption }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch, ref, onMounted, onUnmounted } from 'vue'
const props = defineProps({
  images: { type: Array, default: () => [] },
  startIndex: { type: Number, default: 0 },
  modelValue: { type: Boolean, default: false }
})
const emits = defineEmits(['update:modelValue', 'close'])

let index = ref(props.startIndex || 0)
const visible = computed({
  get: () => props.modelValue,
  set: (v) => emits('update:modelValue', v)
})

watch(() => props.startIndex, (v) => { index.value = v || 0 })
watch(() => props.images, () => { if (index.value >= props.images.length) index.value = 0 })

function close() {
  visible.value = false
  emits('close')
}

function prev() {
  if (props.images.length === 0) return
  index.value = (index.value - 1 + props.images.length) % props.images.length
}

function next() {
  if (props.images.length === 0) return
  index.value = (index.value + 1) % props.images.length
}

const currentSrc = computed(() => props.images[index.value] || null)
const caption = computed(() => {
  // попытаться извлечь имя файла или использовать запасной вариант
  const img = props.images[index.value]
  return img?.caption || ''
})
const hasPrev = computed(() => props.images.length > 1)
const hasNext = computed(() => props.images.length > 1)

// keyboard handlers
function onKey(e) {
  if (!visible.value) return
  if (e.key === 'Escape') close()
  if (e.key === 'ArrowLeft') prev()
  if (e.key === 'ArrowRight') next()
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', onKey)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    try { window.removeEventListener('keydown', onKey) } catch (e) {}
  }
})
</script>

<style scoped>
.lightbox-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.lightbox-content {
  position: relative;
  max-width: 90%;
  max-height: 90%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}
.lightbox-img {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
}
.lightbox-close {
  position: absolute;
  top: -10px;
  right: -10px;
  background: #fff;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  font-size: 20px;
  cursor: pointer;
}
.lightbox-prev, .lightbox-next {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255,255,255,0.85);
  border: none;
  width: 44px;
  height: 60px;
  font-size: 28px;
  cursor: pointer;
  border-radius: 6px;
}
.lightbox-prev { left: -60px }
.lightbox-next { right: -60px }
.lightbox-caption {
  margin-top: 0.5rem;
  color: #fff;
}

/* Make arrows visible and easy to tap on small screens */
@media (max-width: 900px) {
  .lightbox-prev, .lightbox-next {
    left: 8px;
    right: 8px;
    width: 52px;
    height: 52px;
    font-size: 28px;
    background: rgba(0,0,0,0.5);
    color: #fff;
    border-radius: 10px;
    z-index: 1010;
  }
  .lightbox-prev { left: 12px; right: auto }
  .lightbox-next { right: 12px; left: auto }
}

@media (max-width: 420px) {
  .lightbox-prev, .lightbox-next {
    width: 48px;
    height: 48px;
  }
}
</style>