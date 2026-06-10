<template>
  <div class="login-container">
    <Header />
    <div class="login-content">
      <div class="login-form-container">
        <h2>用户登录</h2>
        <div class="auth-form">
          <div style="margin-bottom: 1rem;">
            <input type="text" v-model="form.username" placeholder="用户名" style="width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
          </div>
          <div style="margin-bottom: 1.5rem;">
            <input type="password" v-model="form.password" placeholder="密码" style="width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
          </div>
          <div class="modal-actions">
            <button type="button" class="submit-btn" @click="submitLogin">登录</button>
          </div>
          <div class="auth-link">
            没有账号？
            <router-link to="/register">去注册</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Header from '../components/Header.vue'
import { showToast } from '../composables/useToast'
import { api } from '../utils/api'

export default {
  name: 'Login',
  components: {
    Header
  },
  data() {
    return {
      form: {
        username: '',
        password: ''
      }
    }
  },
  methods: {
    async submitLogin() {
      const { username, password } = this.form
      
      if (!username || !password) {
        showToast('请输入用户名和密码', true)
        return
      }
      
      try {
        const response = await fetch(api('/users/login'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username, password })
        })
        
        const data = await response.json()
        
        if (data.code === 200) {
          if (data.data.token) {
            localStorage.setItem('authToken', data.data.token)
          }
          if (data.data.user && data.data.user.id) {
            localStorage.setItem('userId', data.data.user.id)
          }
          showToast('登录成功')
          this.$router.push('/')
        } else {
          showToast(data.msg || '登录失败', true)
        }
      } catch (error) {
        console.error('登录失败:', error)
        showToast('登录失败，请重试', true)
      }
    }
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: #f0f2f5;
}

.login-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 4rem 2rem;
  display: flex;
  justify-content: center;
  align-items: center;
}

.login-form-container {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 450px;
}

.login-form-container h2 {
  text-align: center;
  margin-bottom: 2rem;
  color: #333;
}

.auth-form {
  padding: 1.5rem 0;
}

.auth-form h3 {
  margin-bottom: 1.5rem;
  text-align: center;
  color: #333;
}

.modal-actions {
  display: flex;
  justify-content: center;
}

.submit-btn {
  background: #00a1d6;
  color: white;
  padding: 0.8rem 2rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.submit-btn:hover:not(:disabled) {
  background: #008cc3;
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.auth-link {
  text-align: center;
  margin-top: 1.5rem;
  color: #666;
  font-size: 14px;
}

.auth-link a {
  color: #00a1d6;
  text-decoration: none;
  font-weight: 500;
}

.auth-link a:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .login-content {
    padding: 2rem 1rem;
  }

  .login-form-container {
    padding: 1.5rem;
  }
}
</style>