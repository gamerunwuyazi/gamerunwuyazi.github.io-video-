<template>
  <div v-if="state.visible" class="toast" :class="{ error: state.isError }">
    {{ state.text }}
  </div>
</template>

<script>
import { useToast } from '../composables/useToast'

export default {
  name: 'ToastContainer',
  setup() {
    const { state } = useToast()
    return { state }
  }
}
</script>

<style scoped>
.toast {
  position: fixed;
  top: 80px;
  right: 20px;
  background: #4caf50;
  color: white;
  padding: 1rem 2rem;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  z-index: 3000;
  animation: slideIn 0.3s ease-out;
  font-size: 14px;
  max-width: 350px;
  word-break: break-word;
}

.toast.error {
  background: #f44336;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>