<template>
  <div>
    <Header />
    <div class="video-list-container">
      <div class="video-grid">
      <div 
        v-for="video in videos" 
        :key="video.id" 
        class="video-item"
        @click="navigateToPlayer(video.id)"
      >
        <div class="video-thumbnail">
          <img :src="resolveUrl(video.cover_path)" :alt="video.title" />
        </div>
        <div class="video-info">
          <h3 class="video-title">{{ video.title }}</h3>
          <p class="video-description">{{ truncateDescription(video.description) }}</p>
          <div class="video-meta">
            <span class="video-author">{{ video.nickname }}</span>
            <span class="video-date">{{ formatDate(video.created_at) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  </div>
</template>

<script>
import Header from '../components/Header.vue'
import { resolveUrl } from '../utils/url'
import { api } from '../utils/api'

export default {
  name: 'VideoList',
  components: {
    Header
  },
  data() {
    return {
      videos: []
    }
  },
  mounted() {
    this.fetchVideos()
  },
  methods: {
    resolveUrl,
    async fetchVideos() {
      try {
        const response = await fetch(api('/videos'))
        const data = await response.json()
        if (data.code === 200) {
          this.videos = data.data
        }
      } catch (error) {
        console.error('获取视频列表失败:', error)
      }
    },
    navigateToPlayer(videoId) {
      this.$router.push(`/player/${videoId}`)
    },
    truncateDescription(description) {
      return description.length > 80 ? description.substring(0, 80) + '...' : description
    },
    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString()
    }
  }
}
</script>

<style scoped>
.video-list-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
}

.video-item {
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
}

.video-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.video-thumbnail {
  width: 100%;
  height: 180px;
  overflow: hidden;
}

.video-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.video-item:hover .video-thumbnail img {
  transform: scale(1.05);
}

.video-info {
  padding: 1rem;
}

.video-title {
  font-size: 1rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.video-description {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 1rem;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.video-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #999;
}

@media (max-width: 768px) {
  .video-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
  }
  
  .video-list-container {
    padding: 1rem;
  }
}
</style>
