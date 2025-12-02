<template>
  <footer class="footer">
    <div class="footer-container">
      <div class="footer-content">
        <p>&copy; {{ currentYear }} Estate Agency. All rights reserved.</p>
        <p class="footer-credits">Salin Oleg Alekseevich - PIbd-43 - FIST</p>
      </div>
    </div>
  </footer>
</template>

<script setup>
const currentYear = new Date().getFullYear()
</script>

<style scoped>
.footer {
  background: #1f2937;
  color: #9ca3af;
  padding: 2rem 0;
  margin-top: auto;
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.footer-content {
  text-align: center;
}

.footer-credits {
  font-size: 0.875rem;
  margin-top: 0.5rem;
  color: #6b7280;
}
</style>
