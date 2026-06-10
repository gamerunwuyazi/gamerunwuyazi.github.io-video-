<template>
  <div class="register-container">
    <Header />
    <div class="register-content">
      <div class="register-form-container">
        <h2>用户注册</h2>
        <div class="auth-form">
          <div style="margin-bottom: 1rem;">
            <div class="div-input-container">
              <div class="div-input" contenteditable="true" v-html="form.username" @input="form.username = $event.target.textContent" placeholder="用户名（4-20个字符）" required style="width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 4px;"></div>
            </div>
          </div>
          <div style="margin-bottom: 1rem;">
            <div class="div-input-container">
              <div class="div-input password-input" contenteditable="true" v-html="form.password" @input="form.password = $event.target.textContent" placeholder="密码（至少6个字符）" required style="width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 4px;"></div>
            </div>
          </div>
          <div style="margin-bottom: 1.5rem;">
            <div class="div-input-container">
              <div class="div-input" contenteditable="true" v-html="form.nickname" @input="form.nickname = $event.target.textContent" placeholder="昵称" required style="width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 4px;"></div>
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="submit-btn" @click="submitRegister">注册</button>
          </div>
          <div class="auth-link">
            已有账号？
            <router-link to="/login">去登录</router-link>
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
  name: 'Register',
  components: {
    Header
  },
  data() {
    return {
      form: {
        username: '',
        password: '',
        nickname: ''
      }
    }
  },
  methods: {
    async submitRegister() {
      const { username, password, nickname } = this.form
      
      if (!username || !password || !nickname) {
        showToast('请填写所有必填字段', true)
        return
      }
      
      if (username.length < 4 || username.length > 20) {
        showToast('用户名长度应为4-20个字符', true)
        return
      }
      
      if (password.length < 6) {
        showToast('密码长度至少为6个字符', true)
        return
      }
      
      try {
        const response = await fetch(api('/users/register'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ username, password, nickname })
        })
        
        const data = await response.json()
        
        if (data.code === 200) {
          showToast('注册成功，请登录')
          this.$router.push('/login')
        } else {
          showToast(data.msg || '注册失败', true)
        }
      } catch (error) {
        console.error('注册失败:', error)
        showToast('注册失败，请重试', true)
      }
    }
  }
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  background: #f0f2f5;
}

.register-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 4rem 2rem;
  display: flex;
  justify-content: center;
  align-items: center;
}

.register-form-container {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 450px;
}

.register-form-container h2 {
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

.div-input-container {
  width: 100%;
  position: relative;
}

.div-input {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  color: #333;
  font-size: 14px;
  outline: none;
  transition: border-color 0.3s;
  min-height: 44px;
  font-family: inherit;
  resize: none;
  overflow: hidden;
  line-height: 1.5;
  box-sizing: border-box;
}

.div-input:focus {
  border-color: #00a1d6;
  box-shadow: 0 0 0 2px rgba(0,161,214,0.2);
}

.div-input:empty:before {
  content: attr(placeholder);
  color: #999;
  pointer-events: none;
}

.password-input {
  font-family: 'Courier New', monospace;
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
  .register-content {
    padding: 2rem 1rem;
  }

  .register-form-container {
    padding: 1.5rem;
  }
}
</style>