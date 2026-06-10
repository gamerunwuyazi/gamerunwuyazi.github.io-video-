<script setup>
import ToastContainer from './components/ToastContainer.vue'
</script>

<template>
    <router-view />
    <ToastContainer />
</template>

<style>
/* 全局样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: #f5f5f5;
  color: #333;
  min-height: 100vh;
}

/* Div容器式输入框样式 */
.div-input-container {
  flex: 1;
  position: relative;
}

.div-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #444;
  border-radius: 4px;
  background: #222;
  color: white;
  font-size: 14px;
  outline: none;
  transition: border-color 0.3s;
  min-height: 36px;
  font-family: inherit;
  resize: none;
  overflow: hidden;
  line-height: 1.5;
  box-sizing: border-box;
}

.div-input:focus {
  border-color: #1890ff;
}

/* Placeholder样式 */
.div-input:empty:before {
  content: attr(placeholder);
  color: #666;
  pointer-events: none;
}

/* 密码输入框样式 */
.password-input {
  font-family: 'Courier New', monospace;
}
</style>