<template>
  <div class="video-player-page">
    <Header />
    <div class="video-player-container">
      <div class="player-header">
        <button class="back-btn" @click="navigateBack">
          ← 返回列表
        </button>
        <h1>{{ video.title }}</h1>
      </div>

      <div class="player-wrapper">
        <video
          id="videoPlayer"
          class="video-js vjs-default-skin vjs-big-play-centered"
          preload="auto"
          playsinline
          webkit-playsinline
          x5-playsinline
          x5-video-player-type="h5"
          x5-video-player-fullscreen="false"
          x5-video-orientation="portraint"
        >
          <source :src="videoSrc" type="video/mp4">
          您的浏览器不支持HTML5视频播放
        </video>
      </div>

      <div class="danmu-controls">
        <div class="div-input-container">
          <div class="div-input" id="danmuInput" contenteditable="true" placeholder="发送弹幕..." autocomplete="danmu"></div>
        </div>
        <div class="danmu-color-picker">
          <span class="color-label">颜色:</span>
          <div class="color-options">
            <button class="color-option" data-color="#ffffff" style="background-color: #ffffff; border: 1px solid #ccc;"></button>
            <button class="color-option" data-color="#ff0000" style="background-color: #ff0000;"></button>
            <button class="color-option" data-color="#00ff00" style="background-color: #00ff00;"></button>
            <button class="color-option" data-color="#00ffff" style="background-color: #00ffff;"></button>
            <button class="color-option" data-color="#ff00ff" style="background-color: #ff00ff;"></button>
            <button class="color-option" data-color="#ffff00" style="background-color: #ffff00;"></button>
          </div>
        </div>
        <button class="danmu-send" @click="sendDanmu">发送</button>
      </div>

      <div class="video-info">
        <div class="video-meta">
          <span class="video-author">{{ video.nickname || '匿名用户' }}</span>
          <span class="video-date">{{ formatDate(video.created_at) }}</span>
          <button v-if="isOwner" class="video-delete-btn" @click="deleteVideo">删除视频</button>
        </div>
        <div class="video-description">
          {{ video.description || '暂无描述' }}
        </div>
      </div>

      <CommentSection :videoId="id" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Header from '../components/Header.vue'
import CommentSection from '../components/CommentSection.vue'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'
import '../plugins/danmu'
import '../plugins/pip'
import { showToast } from '../composables/useToast'
import { resolveUrl } from '../utils/url'
import { api } from '../utils/api'

const router = useRouter()
const route = useRoute()
const id = route.params.id

const video = reactive({
  id: '',
  title: '加载中...',
  description: '',
  cover_path: '',
  video_path: '',
  created_at: '',
  nickname: '',
  user_id: null
})
const selectedDanmuColor = ref('#ffffff')
const player = ref(null)
const danmuPlugin = ref(null)

const videoSrc = computed(() => resolveUrl(video.video_path))

const isOwner = computed(() => {
  const userId = localStorage.getItem('userId')
  return userId && video.user_id && Number(video.user_id) === Number(userId)
})

onMounted(() => {
  fetchVideoDetail()
  initDanmuColorPicker()
})

onBeforeUnmount(() => {
  if (player.value) {
    player.value.dispose()
  }
})

async function fetchVideoDetail() {
  try {
    const response = await fetch(api(`/videos/${id}`))
    const data = await response.json()
    if (data.code === 200) {
      Object.assign(video, data.data)
      nextTick(() => {
        initVideoPlayer()
        loadDanmus()
      })
    }
  } catch (error) {
    console.error('获取视频详情失败:', error)
  }
}

function initVideoPlayer() {
  if (player.value) {
    player.value.dispose()
    player.value = null
  }

  const vjsPlayer = videojs('videoPlayer', {
    controls: true,
    autoplay: false,
    preload: 'metadata',
    language: 'zh-CN',
    responsive: true,
    bigPlayButton: true,
    disableContextMenu: true,
    userActions: {
      doubleClick: false
    },
    controlBar: {
      fullscreenToggle: true,
      pictureInPictureToggle: true
    },
    nativeControlsForTouch: false,
    inactivityTimeout: 3000,
    techOrder: ['html5'],
    html5: {
      nativeAudioTracks: false,
      nativeVideoTracks: false,
      nativeTextTracks: false,
      vhs: {
        enableLowInitialPlaylist: true,
        partiallyResumeEndOfStream: true
      }
    }
  })

  danmuPlugin.value = vjsPlayer.danmu()
  vjsPlayer.pip()
  player.value = vjsPlayer
}

async function loadDanmus() {
  try {
    const response = await fetch(api(`/danmus?video_id=${id}`))
    const { code, data } = await response.json()
    if (code === 200) {
      danmuPlugin.value.setDanmus(data || [])
    }
  } catch (error) {
    console.error('弹幕加载失败:', error)
    danmuPlugin.value.setDanmus([])
  }
}

function initDanmuColorPicker() {
  const colorOptions = document.querySelectorAll('.color-option')
  colorOptions.forEach(option => {
    option.addEventListener('click', () => {
      colorOptions.forEach(opt => opt.classList.remove('active'))
      option.classList.add('active')
      selectedDanmuColor.value = option.dataset.color
    })
  })
  if (colorOptions[0]) {
    colorOptions[0].classList.add('active')
  }
}

async function sendDanmu() {
  const input = document.getElementById('danmuInput')
  const content = input.textContent.trim()

  if (!content) {
    showToast('弹幕内容不能为空', true)
    return
  }

  try {
    const time = player.value ? player.value.currentTime() : 0
    const color = selectedDanmuColor.value

    const response = await fetch(api('/danmus'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('authToken') ? `Bearer ${localStorage.getItem('authToken')}` : ''
      },
      body: JSON.stringify({
        video_id: id,
        content: content,
        time: time,
        color: color
      })
    })

    const result = await response.json()
    if (result.code === 200) {
      const newDanmu = {
        id: result.data?.id || 'temp_' + Date.now(),
        content: content,
        time: time,
        color: color,
        created_at: new Date().toISOString()
      }
      danmuPlugin.value.addDanmu(newDanmu)
      input.textContent = ''
      showToast('弹幕发送成功')
    } else if (result.code === 401 || result.code === 403) {
      showToast('登录已过期，请重新登录', true)
      router.push('/login')
    } else {
      throw new Error(result.msg)
    }
  } catch (error) {
    console.error('发送弹幕失败:', error)
    showToast('弹幕发送失败: ' + error.message, true)
  }
}

function navigateBack() {
  router.push('/')
}

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString()
}

async function deleteVideo() {
  if (!confirm('确定要删除此视频吗？此操作不可撤销。')) return
  try {
    const token = localStorage.getItem('authToken')
    const response = await fetch(api(`/videos/${id}`), {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await response.json()
    if (data.code === 200) {
      showToast('视频已删除')
      router.push('/')
    } else if (data.code === 401 || data.code === 403) {
      showToast('登录已过期，请重新登录', true)
      router.push('/login')
    } else {
      showToast(data.msg || '删除失败', true)
    }
  } catch (error) {
    console.error('删除视频失败:', error)
    showToast('删除视频失败', true)
  }
}
</script>

<style scoped>
.video-player-page {
  background: #f0f2f5;
  min-height: 100vh;
}

.video-player-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.player-header {
  display: flex;
  align-items: center;
  margin-bottom: 2rem;
}

.back-btn {
  background: rgba(255,255,255,0.2);
  border: none;
  color: #1890ff;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  margin-right: 1rem;
  transition: background-color 0.2s;
}

.back-btn:hover {
  background: rgba(255,255,255,0.3);
}

.player-header h1 {
  flex: 1;
  font-size: 1.5rem;
  color: #333;
}

.player-wrapper {
  position: relative;
  background-color: black;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 2rem;
  width: 100%;
  aspect-ratio: 16 / 9;
}

.player-wrapper :deep(.video-js) {
  width: 100% !important;
  height: 100% !important;
}

.player-wrapper :deep(.vjs-tech) {
  width: 100% !important;
  height: 100% !important;
  object-fit: contain;
}

.player-wrapper :deep(.vjs-poster) {
  background-size: contain;
}

.video-info {
  background-color: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.video-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  color: #666;
  font-size: 0.9rem;
}

.video-author {
  margin-right: auto;
}

.video-delete-btn {
  background: #ff4d4f;
  color: white;
  border: none;
  padding: 0.4rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background-color 0.2s;
}

.video-delete-btn:hover {
  background: #d9363e;
}

.video-description {
  color: #333;
  line-height: 1.6;
}

.danmu-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
  background: #fff;
  padding: 0.8rem 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.div-input-container {
  flex: 1;
  position: relative;
  min-width: 200px;
}

.div-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  color: #333;
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

.div-input:empty:before {
  content: attr(placeholder);
  color: #999;
  pointer-events: none;
}

.danmu-color-picker {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.color-label {
  font-size: 14px;
  color: #333;
}

.color-options {
  display: flex;
  gap: 5px;
}

.color-option {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.color-option:hover {
  transform: scale(1.1);
}

.color-option.active {
  border-color: #333;
  box-shadow: 0 0 0 2px #fff, 0 0 0 4px #333;
}

.danmu-send {
  padding: 0.5rem 1rem;
  background: #00a1d6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.danmu-send:hover:not(:disabled) {
  background: #008cc3;
}

.danmu-send:disabled {
  background: #444;
  cursor: not-allowed;
}

.vjs-big-play-button {
  position: absolute !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  margin: 0 !important;
  z-index: 100 !important;
}

@media (max-width: 768px) {
  .video-player-container {
    padding: 1rem;
  }

  .danmu-controls {
    flex-wrap: wrap;
  }

  .div-input-container {
    min-width: 100%;
  }

  .player-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .back-btn {
    margin-bottom: 1rem;
  }
}
</style>

<style>
@keyframes vjs-danmu-move {
  0% {
    left: 100%;
    opacity: 0;
  }
  5% {
    opacity: 0.9;
  }
  95% {
    opacity: 0.9;
  }
  100% {
    left: -100%;
    opacity: 0;
  }
}
</style>