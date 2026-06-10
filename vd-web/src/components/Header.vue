<template>
  <header class="header">
    <h1>视频分享平台</h1>
    <div style="display: flex; gap: 1rem;">
      <button 
        v-if="!currentUser" 
        id="loginBtn" 
        class="upload-btn" 
        @click="navigateToLogin"
      >
        登录
      </button>
      <button 
        v-else 
        id="loginBtn" 
        class="upload-btn" 
        @click="logout"
      >
        退出登录
      </button>
      <button class="upload-btn" @click="navigateToUpload">上传视频</button>
    </div>
  </header>
</template>

<script>
import { showToast } from '../composables/useToast'
import { api } from '../utils/api'

export default {
  name: 'Header',
  data() {
    return {
      currentUser: null
    }
  },
  mounted() {
    this.checkLoginStatus()
  },
  methods: {
    async checkLoginStatus() {
      try {
        const token = localStorage.getItem('authToken')
        const response = await fetch(api('/users/current'), {
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        })
        const data = await response.json()
        
        if (data.code === 200 && data.data) {
          this.currentUser = data.data
        } else {
          this.currentUser = null
        }
      } catch (error) {
        console.error('检查登录状态失败:', error)
        this.currentUser = null
      }
    },
    navigateToLogin() {
      this.$router.push('/login')
    },
    async logout() {
      try {
        const token = localStorage.getItem('authToken')
        const response = await fetch(api('/users/logout'), {
          method: 'POST',
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        })
        
        localStorage.removeItem('authToken')
        localStorage.removeItem('userId')
        this.currentUser = null
        showToast('已退出登录')
        this.$router.push('/')
      } catch (error) {
        console.error('退出登录失败:', error)
        localStorage.removeItem('authToken')
        localStorage.removeItem('userId')
        this.currentUser = null
        showToast('已退出登录')
        this.$router.push('/')
      }
    },
    navigateToUpload() {
      if (!this.currentUser) {
        showToast('请先登录后再上传视频', true)
        this.$router.push('/login')
        return
      }
      
      this.$router.push('/upload')
    }
  }
}
</script>

<style scoped>
.header {
  background: #00a1d6;
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.upload-btn {
  background: #fff;
  color: #00a1d6;
  padding: 0.8rem 1.5rem;
  border-radius: 25px;
  border: none;
  cursor: pointer;
  font-weight: bold;
  transition: transform 0.2s, box-shadow 0.2s;
}

.upload-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0,161,214,0.3);
}

@media (max-width: 768px) {
  .header {
    padding: 1rem;
  }
  
  .upload-btn {
    padding: 0.6rem 1.2rem;
    font-size: 0.9rem;
  }
}
</style>
