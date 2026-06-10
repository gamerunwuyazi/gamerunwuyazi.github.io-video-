<template>
  <div class="comment-section">
    <h2 style="margin-bottom: 1rem;">评论区</h2>
    <div class="comment-form">
      <textarea 
        class="comment-input" 
        id="commentInput" 
        placeholder="发表评论..." 
        rows="1"
        v-model="commentContent"
      ></textarea>
      <button class="comment-submit" @click="submitComment">评论</button>
    </div>
    
    <div class="comment-list" id="commentList">
      <div v-if="loading" class="loading">加载评论中...</div>
      <div v-else-if="comments.length === 0" class="empty-comments">暂无评论，快来发表第一条评论吧！</div>
      <div v-else>
        <div 
          v-for="comment in comments" 
          :key="comment.id" 
          class="comment-item"
        >
          <div class="comment-content">{{ comment.content }}</div>
          <div class="comment-time">
            <span>{{ comment.nickname || '匿名用户' }}</span>
            <span style="margin-left: 1rem;">{{ formatDate(comment.created_at) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { showToast } from '../composables/useToast'
import { api } from '../utils/api'

export default {
  name: 'CommentSection',
  props: {
    videoId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      comments: [],
      loading: true,
      commentContent: ''
    }
  },
  mounted() {
    this.fetchComments()
  },
  methods: {
    async fetchComments() {
      try {
        this.loading = true
        const response = await fetch(api(`/comments?video_id=${this.videoId}`))
        const data = await response.json()
        if (data.code === 200) {
          this.comments = data.data
        }
      } catch (error) {
        console.error('获取评论失败:', error)
      } finally {
        this.loading = false
      }
    },
    async submitComment() {
      if (!this.commentContent.trim()) {
        showToast('请输入评论内容', true)
        return
      }

      try {
        const token = localStorage.getItem('authToken')
        if (!token) {
          showToast('请先登录后再发表评论', true)
          this.$router.push('/login')
          return
        }

        const response = await fetch(api('/comments'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            video_id: this.videoId,
            content: this.commentContent.trim()
          })
        })

        const data = await response.json()
        if (data.code === 200) {
          this.commentContent = ''
          await this.fetchComments()
          showToast('评论发表成功')
        } else if (data.code === 401 || data.code === 403) {
          showToast('登录已过期，请重新登录', true)
          this.$router.push('/login')
        } else {
          showToast('评论发表失败: ' + (data.msg || '未知错误'), true)
        }
      } catch (error) {
        console.error('发表评论失败:', error)
        showToast('发表评论失败，请重试', true)
      }
    },
    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleString('zh-CN')
    }
  }
}
</script>

<style scoped>
.comment-section {
  background: rgba(255,255,255,0.05);
  border-radius: 8px;
  padding: 1.5rem;
}

.comment-form {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.comment-input {
  flex: 1;
  padding: 0.8rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: white;
  color: #333;
  font-size: 14px;
  resize: vertical;
  min-height: 60px;
}

.comment-submit {
  padding: 0.8rem 1.5rem;
  background: #00a1d6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  align-self: flex-start;
}

.comment-submit:hover:not(:disabled) {
  background: #008cc3;
}

.comment-submit:disabled {
  background: #444;
  cursor: not-allowed;
}

.comment-list {
  max-height: 300px;
  overflow-y: auto;
  padding-right: 10px;
}

.comment-list::-webkit-scrollbar {
  width: 6px;
}

.comment-list::-webkit-scrollbar-track {
  background: rgba(255,255,255,0.1);
  border-radius: 3px;
}

.comment-list::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.3);
  border-radius: 3px;
}

.comment-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255,255,255,0.5);
}

.comment-item {
  padding: 1rem;
  border-bottom: 1px solid #333;
  transition: background-color 0.2s;
}

.comment-item:hover {
  background: rgba(255,255,255,0.03);
}

.comment-content {
  margin-bottom: 0.5rem;
  word-break: break-word;
}

.comment-time {
  font-size: 0.8rem;
  color: #888;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #888;
}

.empty-comments {
  text-align: center;
  padding: 2rem;
  color: #888;
}

@media (max-width: 768px) {
  .comment-form {
    flex-direction: column;
  }
  
  .comment-submit {
    align-self: stretch;
  }
}
</style>
