<template>
  <div class="upload-container">
    <Header />
    <div class="upload-content">
      <div class="upload-form-container">
        <h2>上传新视频</h2>
        <form id="uploadForm" enctype="multipart/form-data">
          <div style="margin-bottom: 1rem;">
            <input type="text" name="title" v-model="formData.title" placeholder="视频标题" style="width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 4px;" autocomplete="off">
          </div>
          <div style="margin-bottom: 1rem;">
            <textarea name="description" v-model="formData.description" placeholder="视频描述" style="width: 100%; height: 100px; padding: 0.8rem; border: 1px solid #ddd; border-radius: 4px;"></textarea>
          </div>
          <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem;">
            <div class="drop-area" id="coverDropArea" style="flex: 1; margin-bottom: 0;" @click="triggerFileInput('cover')" @dragover.prevent @drop.prevent="handleDrop($event, 'cover')">
              <div class="icon">📷</div>
              <p>拖放封面图片到这里</p>
              <p>或者</p>
              <button type="button" class="submit-btn" style="margin-top: 1rem; background: #00a1d6; color: white;">选择图片</button>
              <input type="file" name="cover" accept="image/*" id="coverFileInput" @change="handleFileChange($event, 'cover')" autocomplete="off" style="display: none;">
              <div id="coverFileInfo" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%; max-width: 100%; display: inline-block; box-sizing: border-box; padding: 5px 0; border: 1px solid transparent;">{{ coverFileName || '未选择文件' }}</div>
            </div>
            
            <div class="drop-area" id="videoDropArea" style="flex: 2; margin-bottom: 0;" @click="triggerFileInput('video')" @dragover.prevent @drop.prevent="handleDrop($event, 'video')">
              <div class="icon">🎬</div>
              <p>拖放视频文件到这里</p>
              <p>或者</p>
              <button type="button" class="submit-btn" style="margin-top: 1rem; background: #00a1d6; color: white;">选择视频</button>
              <input type="file" name="video" accept="video/*" id="videoFileInput" @change="handleFileChange($event, 'video')" autocomplete="off" style="display: none;">
              <div id="videoFileInfo" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%; max-width: 100%; display: inline-block; box-sizing: border-box; padding: 5px 0; border: 1px solid transparent;">{{ videoFileName || '未选择文件' }}</div>
            </div>
          </div>
          <div style="margin-bottom: 1rem; display: none;" id="compressProgressContainer" v-show="showCompressProgress">
            <div style="width: 100%; height: 6px; background-color: #eee; border-radius: 3px; overflow: hidden;">
              <div id="compressProgressBar" style="height: 100%; background-color: #4caf50; transition: width 0.3s ease;" :style="{ width: compressProgress + '%' }"></div>
            </div>
            <div style="text-align: center; margin-top: 5px; font-size: 0.9rem; color: #666;" id="compressProgressText">{{ compressStatus }}</div>
          </div>
          <div style="margin-bottom: 1rem; display: none;" id="progressContainer" v-show="showProgress">
            <div style="width: 100%; height: 6px; background-color: #eee; border-radius: 3px; overflow: hidden;">
              <div id="progressBar" style="height: 100%; background-color: #00a1d6; transition: width 0.3s ease;" :style="{ width: progress + '%' }"></div>
            </div>
            <div style="text-align: center; margin-top: 5px; font-size: 0.9rem; color: #666;" id="progressText">{{ progress }}%</div>
          </div>
          <div class="modal-actions">
            <button type="button" id="backgroundUploadBtn" class="cancel-btn" style="display: none; margin-right: auto;" v-show="showBackgroundBtn" @click="backgroundUpload">后台上传</button>
            <button type="button" class="submit-btn" @click="submitForm" :disabled="isSubmitting">
              {{ isSubmitting ? '处理中...' : '提交' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import Header from '../components/Header.vue'
import { showToast } from '../composables/useToast'
import { api } from '../utils/api'

// CDN 全部走 jsDelivr（国内访问稳定）
const FFMPEG_MODULE = 'https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/+esm'
const UTIL_MODULE = 'https://cdn.jsdelivr.net/npm/@ffmpeg/util@0.12.1/+esm'
const CORE_RAW = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm'

// 自包含的 worker 脚本（内联了 const.js、errors.js 的依赖，避免 blob 内部相对路径解析失败）
const workerSource = `
const CORE_VERSION = "0.12.6";
const CORE_URL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@" + CORE_VERSION + "/dist/umd/ffmpeg-core.js";
var FFMessageType;
(function (FFMessageType) {
  FFMessageType.LOAD = "LOAD";
  FFMessageType.EXEC = "EXEC";
  FFMessageType.WRITE_FILE = "WRITE_FILE";
  FFMessageType.READ_FILE = "READ_FILE";
  FFMessageType.DELETE_FILE = "DELETE_FILE";
  FFMessageType.RENAME = "RENAME";
  FFMessageType.CREATE_DIR = "CREATE_DIR";
  FFMessageType.LIST_DIR = "LIST_DIR";
  FFMessageType.DELETE_DIR = "DELETE_DIR";
  FFMessageType.ERROR = "ERROR";
  FFMessageType.DOWNLOAD = "DOWNLOAD";
  FFMessageType.PROGRESS = "PROGRESS";
  FFMessageType.LOG = "LOG";
  FFMessageType.MOUNT = "MOUNT";
  FFMessageType.UNMOUNT = "UNMOUNT";
})(FFMessageType || (FFMessageType = {}));
const ERROR_UNKNOWN_MESSAGE_TYPE = new Error("unknown message type");
const ERROR_NOT_LOADED = new Error("ffmpeg is not loaded");
const ERROR_TERMINATED = new Error("called FFmpeg.terminate()");
const ERROR_IMPORT_FAILURE = new Error("failed to import ffmpeg-core.js");
let ffmpeg;
const load = async ({ coreURL: _coreURL, wasmURL: _wasmURL, workerURL: _workerURL }) => {
  const first = !ffmpeg;
  try {
    if (!_coreURL) _coreURL = CORE_URL;
    importScripts(_coreURL);
  } catch {
    if (!_coreURL) _coreURL = CORE_URL.replace('/umd/', '/esm/');
    self.createFFmpegCore = (await import(_coreURL)).default;
    if (!self.createFFmpegCore) throw ERROR_IMPORT_FAILURE;
  }
  const coreURL = _coreURL;
  const wasmURL = _wasmURL ? _wasmURL : _coreURL.replace(/\\.js$/g, ".wasm");
  const workerURL = _workerURL ? _workerURL : _coreURL.replace(/\\.js$/g, ".worker.js");
  ffmpeg = await self.createFFmpegCore({
    mainScriptUrlOrBlob: coreURL + "#" + btoa(JSON.stringify({ wasmURL, workerURL })),
  });
  ffmpeg.setLogger((data) => self.postMessage({ type: FFMessageType.LOG, data }));
  ffmpeg.setProgress((data) => self.postMessage({ type: FFMessageType.PROGRESS, data }));
  return first;
};
const exec = ({ args, timeout = -1 }) => {
  ffmpeg.setTimeout(timeout);
  ffmpeg.exec(...args);
  const ret = ffmpeg.ret;
  ffmpeg.reset();
  return ret;
};
const writeFile = ({ path, data }) => { ffmpeg.FS.writeFile(path, data); return true; };
const readFile = ({ path, encoding }) => ffmpeg.FS.readFile(path, { encoding });
const deleteFile = ({ path }) => { ffmpeg.FS.unlink(path); return true; };
const rename = ({ oldPath, newPath }) => { ffmpeg.FS.rename(oldPath, newPath); return true; };
const createDir = ({ path }) => { ffmpeg.FS.mkdir(path); return true; };
const listDir = ({ path }) => {
  const names = ffmpeg.FS.readdir(path);
  const nodes = [];
  for (const name of names) {
    const stat = ffmpeg.FS.stat(path + "/" + name);
    nodes.push({ name, isDir: ffmpeg.FS.isDir(stat.mode) });
  }
  return nodes;
};
const deleteDir = ({ path }) => { ffmpeg.FS.rmdir(path); return true; };
const mount = ({ fsType, options, mountPoint }) => {
  const fs = ffmpeg.FS.filesystems[fsType];
  if (!fs) return false;
  ffmpeg.FS.mount(fs, options, mountPoint);
  return true;
};
const unmount = ({ mountPoint }) => { ffmpeg.FS.unmount(mountPoint); return true; };
self.onmessage = async ({ data: { id, type, data: _data } }) => {
  const trans = [];
  let data;
  try {
    if (type !== FFMessageType.LOAD && !ffmpeg) throw ERROR_NOT_LOADED;
    switch (type) {
      case FFMessageType.LOAD: data = await load(_data); break;
      case FFMessageType.EXEC: data = exec(_data); break;
      case FFMessageType.WRITE_FILE: data = writeFile(_data); break;
      case FFMessageType.READ_FILE: data = readFile(_data); break;
      case FFMessageType.DELETE_FILE: data = deleteFile(_data); break;
      case FFMessageType.RENAME: data = rename(_data); break;
      case FFMessageType.CREATE_DIR: data = createDir(_data); break;
      case FFMessageType.LIST_DIR: data = listDir(_data); break;
      case FFMessageType.DELETE_DIR: data = deleteDir(_data); break;
      case FFMessageType.MOUNT: data = mount(_data); break;
      case FFMessageType.UNMOUNT: data = unmount(_data); break;
      default: throw ERROR_UNKNOWN_MESSAGE_TYPE;
    }
  } catch (e) {
    self.postMessage({ id, type: FFMessageType.ERROR, data: e.toString() });
    return;
  }
  if (data instanceof Uint8Array) trans.push(data.buffer);
  self.postMessage({ id, type, data }, trans);
};
`

export default {
  name: 'Upload',
  components: {
    Header
  },
  data() {
    return {
      formData: {
        title: '',
        description: ''
      },
      coverFile: null,
      videoFile: null,
      coverFileName: '',
      videoFileName: '',
      showProgress: false,
      showCompressProgress: false,
      showBackgroundBtn: false,
      progress: 0,
      compressProgress: 0,
      compressStatus: '准备中...',
      isSubmitting: false,
      currentUploadXHR: null
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
        
        if (data.code !== 200 || !data.data) {
          showToast('请先登录后再上传视频', true)
          this.$router.push('/login')
        }
      } catch (error) {
        console.error('检查登录状态失败:', error)
        showToast('请先登录后再上传视频', true)
        this.$router.push('/login')
      }
    },
    triggerFileInput(type) {
      if (type === 'cover') {
        document.getElementById('coverFileInput').click()
      } else if (type === 'video') {
        document.getElementById('videoFileInput').click()
      }
    },
    handleFileChange(event, type) {
      const file = event.target.files[0]
      if (file) {
        if (type === 'cover') {
          this.coverFile = file
          this.coverFileName = this.truncateFileName(file.name)
        } else if (type === 'video') {
          this.videoFile = file
          this.videoFileName = this.truncateFileName(file.name)
        }
      }
    },
    handleDrop(event, type) {
      const file = event.dataTransfer.files[0]
      if (file) {
        if (type === 'cover' && file.type.startsWith('image/')) {
          this.coverFile = file
          this.coverFileName = this.truncateFileName(file.name)
        } else if (type === 'video' && file.type.startsWith('video/')) {
          this.videoFile = file
          this.videoFileName = this.truncateFileName(file.name)
        }
      }
    },
    truncateFileName(fileName) {
      const maxLength = 20
      if (fileName.length <= maxLength) {
        return fileName
      }
      
      const lastDotIndex = fileName.lastIndexOf('.')
      if (lastDotIndex === -1) {
        return fileName.substring(0, maxLength) + '...'
      }
      
      const extension = fileName.substring(lastDotIndex)
      const nameWithoutExtension = fileName.substring(0, lastDotIndex)
      const availableLengthForName = maxLength - extension.length - 3
      
      if (availableLengthForName <= 0) {
        return fileName.substring(0, maxLength - 3) + '...'
      }
      
      return nameWithoutExtension.substring(0, availableLengthForName) + '...' + extension
    },
    async compressCover(file) {
      if (!window.imageCompression) {
        return file
      }
      try {
        this.compressStatus = '封面图片压缩中...'
        this.compressProgress = 10
        const compressedBlob = await window.imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1280,
          useWebWorker: true,
          fileType: 'image/jpeg',
          initialQuality: 0.8
        })
        this.compressProgress = 20
        const compressedFile = new File([compressedBlob], file.name.replace(/\.[^.]+$/, '.jpg'), {
          type: 'image/jpeg'
        })
        return compressedFile
      } catch (err) {
        console.error('封面压缩失败，使用原图:', err)
        return file
      }
    },
    async compressVideo(file) {
      const fileSizeMB = file.size / (1024 * 1024)
      if (fileSizeMB < 15) {
        return file
      }
      try {
        this.compressStatus = '加载 ffmpeg.wasm 引擎...'
        this.compressProgress = 5

        const FFmpegModule = await import(/* @vite-ignore */ FFMPEG_MODULE)
        const UtilModule = await import(/* @vite-ignore */ UTIL_MODULE)
        const { FFmpeg } = FFmpegModule
        const { fetchFile, toBlobURL } = UtilModule

        const ffmpeg = new FFmpeg()

        ffmpeg.on('progress', ({ progress: p }) => {
          const percent = Math.round(p * 80) + 15
          this.compressProgress = Math.min(percent, 95)
          this.compressStatus = `视频压缩中: ${Math.round(p * 100)}%`
        })

        // 收集日志用于探测原视频信息
        const logLines = []
        ffmpeg.on('log', ({ message }) => logLines.push(message))

        this.compressStatus = '加载 ffmpeg 核心...'
        this.compressProgress = 10

        const workerBlob = new Blob([workerSource], { type: 'text/javascript' })
        const workerBlobUrl = URL.createObjectURL(workerBlob)
        const [coreBlobUrl, wasmBlobUrl] = await Promise.all([
          toBlobURL(`${CORE_RAW}/ffmpeg-core.js`, 'text/javascript'),
          toBlobURL(`${CORE_RAW}/ffmpeg-core.wasm`, 'application/wasm')
        ])

        await ffmpeg.load({
          classWorkerURL: workerBlobUrl,
          coreURL: coreBlobUrl,
          wasmURL: wasmBlobUrl
        })

        this.compressStatus = '分析视频信息...'
        this.compressProgress = 12

        const inputName = 'input' + this.getExtension(file.name)
        const outputName = 'output.mp4'

        await ffmpeg.writeFile(inputName, await fetchFile(file))

        // 用浏览器原生 Video API 探测分辨率（瞬时，零开销），不依赖 ffmpeg 探测
        let srcWidth = 0
        let srcHeight = 0
        let duration = 0
        try {
          const videoInfo = await new Promise((resolve, reject) => {
            const v = document.createElement('video')
            v.preload = 'metadata'
            v.muted = true
            const url = URL.createObjectURL(file)
            v.onloadedmetadata = () => {
              URL.revokeObjectURL(url)
              resolve({
                width: v.videoWidth,
                height: v.videoHeight,
                duration: v.duration
              })
            }
            v.onerror = () => {
              URL.revokeObjectURL(url)
              reject(new Error('视频信息读取失败'))
            }
            v.src = url
          })
          srcWidth = videoInfo.width
          srcHeight = videoInfo.height
          duration = videoInfo.duration
        } catch (e) {
          console.warn('无法通过 Video API 读取尺寸，将使用默认 1080P:', e)
        }

        this.compressStatus = '视频压缩中...'
        this.compressProgress = 15

        // 折中压缩方案：
        // 1) preset superfast：速度与压缩率平衡点
        // 2) ABR 模式（目标码率 + maxrate 上限 + bufsize 缓冲）
        //    目标：输出文件大小 ≈ 源文件 55%（画质与大小平衡）
        // 3) GOP 250 帧（30fps 下约 8s）：压缩率和 seek 速度的平衡
        // 4) 音频 96k AAC：B 站标准，人声清晰
        // 5) 1080P 保留原分辨率（画质优先），2K/4K 才降到 1080P
        // 6) 多线程编码：-threads 0 自动用满所有 CPU 核心
        const isLong = duration > 600 // 超过 10 分钟算长
        const isHuge = fileSizeMB > 200 // 超过 200MB 算巨大
        const isLowRes = srcHeight > 0 && srcHeight <= 720

        let targetHeight = srcHeight || 1080

        if ((isLong || isHuge) && !isLowRes) {
          // 视频过长或过大：降到 720P
          targetHeight = 720
        } else if (srcHeight > 1080) {
          // 2K/4K：缩到 1080P（保留 1080P，不再激进降 720P）
          targetHeight = 1080
        } else if (srcHeight >= 1080) {
          // 1080P：保留原分辨率（不再激进降到 720P，画质优先）
          targetHeight = 1080
        } else if (srcHeight > 0) {
          // 720P 及以下：保留原分辨率
          targetHeight = srcHeight
        }

        // 根据原文件大小和时长计算目标码率
        // 目标：输出文件大小 ≈ 源文件 55%（折中方案）
        const safeDuration = duration > 0 ? duration : 60
        const targetOutputSizeMB = fileSizeMB * 0.55 // 折中压缩到 55%
        const targetBitrateKbps = Math.floor((targetOutputSizeMB * 8 * 1024) / safeDuration) - 96 // 减去音频 96k

        // 根据分辨率选择码率上下限（折中设置）
        const bitrateByRes = {
          1080: { min: 2000, max: 5000, default: 3000 },
          720: { min: 1200, max: 2800, default: 1800 },
          480: { min: 700, max: 1400, default: 1000 },
          360: { min: 400, max: 900, default: 650 }
        }
        let profile
        if (targetHeight >= 1080) profile = bitrateByRes[1080]
        else if (targetHeight >= 720) profile = bitrateByRes[720]
        else if (targetHeight >= 480) profile = bitrateByRes[480]
        else profile = bitrateByRes[360]

        // 在动态计算值和分辨率推荐值中取较合理的范围
        let videoBitrateK
        if (targetBitrateKbps < profile.min) {
          // 计算出的码率太低（短片），用默认值保证质量
          videoBitrateK = profile.default
        } else if (targetBitrateKbps > profile.max) {
          // 计算出的码率太高（可能是低分辨率长片），用上限
          videoBitrateK = profile.max
        } else {
          videoBitrateK = targetBitrateKbps
        }

        const videoBitrate = videoBitrateK + 'k'
        const maxBitrate = Math.floor(videoBitrateK * 1.5) + 'k' // maxrate 给 1.5 倍缓冲
        const bufSize = (videoBitrateK * 2) + 'k'

        const args = [
          '-i', inputName,
          '-c:v', 'libx264',
          '-preset', 'superfast', // 速度与压缩率平衡
          '-tune', 'fastdecode',
          '-pix_fmt', 'yuv420p',
          '-threads', '0', // 多线程：用满所有 CPU 核心
          // ABR 模式：目标码率 + 缓冲
          '-b:v', videoBitrate,
          '-maxrate', maxBitrate,
          '-bufsize', bufSize,
          // 折中 GOP（关键帧间隔 250 帧，30fps 下约 8 秒）
          // 压缩率与 seek 速度的甜点
          '-g', '250',
          '-keyint_min', '250',
          '-sc_threshold', '0',
          // 音频：96k AAC（B 站标准，人声清晰）
          '-c:a', 'aac',
          '-b:a', '96k',
          '-ac', '2',
          // faststart：浏览器边下边播
          '-movflags', '+faststart',
          // 覆盖输出
          '-y'
        ]

        if (srcWidth > 0 && srcHeight > 0 && targetHeight !== srcHeight) {
          // 等比例缩放，宽度取偶数（h264 要求）
          const scaledWidth = Math.round((srcWidth * targetHeight / srcHeight) / 2) * 2
          args.push('-vf', `scale=${scaledWidth}:${targetHeight}`)
        }

        args.push(outputName)

        await ffmpeg.exec(args)

        this.compressStatus = '读取压缩结果...'
        this.compressProgress = 97

        const data = await ffmpeg.readFile(outputName)
        const compressedBlob = new Blob([data.buffer], { type: file.type || 'video/mp4' })
        const compressedFile = new File([compressedBlob], file.name, { type: file.type || 'video/mp4' })

        this.compressProgress = 100
        this.compressStatus = '视频压缩完成'

        return compressedFile
      } catch (err) {
        console.error('视频压缩失败，使用原文件:', err)
        showToast('视频压缩失败，将上传原始文件', true)
        return file
      }
    },
    async submitForm() {
      if (!this.formData.title) {
        showToast('请输入视频标题', true)
        return
      }
      
      if (!this.coverFile) {
        showToast('请选择封面图片', true)
        return
      }
      
      if (!this.videoFile) {
        showToast('请选择视频文件', true)
        return
      }
      
      try {
        this.isSubmitting = true
        this.showCompressProgress = true
        this.compressProgress = 0
        this.compressStatus = '开始压缩处理...'

        const compressedCover = await this.compressCover(this.coverFile)
        const compressedVideo = await this.compressVideo(this.videoFile)

        this.showCompressProgress = false
        this.showProgress = true
        this.progress = 0

        const formData = new FormData()
        formData.append('title', this.formData.title)
        formData.append('description', this.formData.description)
        formData.append('cover', compressedCover)
        formData.append('video', compressedVideo)
        
        const token = localStorage.getItem('authToken')
        
        this.currentUploadXHR = new XMLHttpRequest()
        this.currentUploadXHR.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            this.progress = Math.round((event.loaded / event.total) * 100)
          }
        })
        
        this.currentUploadXHR.addEventListener('load', () => {
          try {
            const response = JSON.parse(this.currentUploadXHR.responseText)
            if (response.code === 200) {
              showToast('视频上传成功')
              this.$router.push('/')
            } else if (response.code === 401 || response.code === 403) {
              showToast('登录已过期，请重新登录', true)
              this.$router.push('/login')
            } else {
              showToast('上传失败: ' + (response.msg || '未知错误'), true)
              this.isSubmitting = false
              this.showProgress = false
            }
          } catch (error) {
            console.error('解析响应失败:', error)
            showToast('上传失败，请重试', true)
            this.isSubmitting = false
            this.showProgress = false
          }
        })
        
        this.currentUploadXHR.addEventListener('error', () => {
          showToast('上传失败，请重试', true)
          this.isSubmitting = false
          this.showProgress = false
        })
        
        this.currentUploadXHR.open('POST', api('/videos'))
        if (token) {
          this.currentUploadXHR.setRequestHeader('Authorization', `Bearer ${token}`)
        }
        this.currentUploadXHR.send(formData)
        
        setTimeout(() => {
          this.showBackgroundBtn = true
        }, 3000)
        
      } catch (error) {
        console.error('上传失败:', error)
        showToast('上传失败，请重试', true)
        this.isSubmitting = false
        this.showProgress = false
        this.showCompressProgress = false
      }
    },
    getExtension(filename) {
      const i = filename.lastIndexOf('.')
      return i !== -1 ? filename.substring(i) : '.mp4'
    },
    backgroundUpload() {
      this.showBackgroundBtn = false
      showToast('上传已移至后台')
      this.$router.push('/')
    }
  }
}
</script>

<style scoped>
.upload-container {
  min-height: 100vh;
  background: #f0f2f5;
}

.upload-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.upload-form-container {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

.upload-form-container h2 {
  text-align: center;
  margin-bottom: 2rem;
  color: #333;
}

.drop-area {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #fafafa;
}

.drop-area:hover {
  border-color: #00a1d6;
  background-color: #f0f8ff;
}

.drop-area .icon {
  font-size: 3rem;
  color: #999;
  margin-bottom: 1rem;
}

.drop-area:hover .icon {
  color: #00a1d6;
}

.drop-area p {
  margin: 0.5rem 0;
  color: #666;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.submit-btn {
  background: #00a1d6;
  color: white;
  padding: 0.8rem 1.5rem;
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

.cancel-btn {
  background: #f5f5f5;
  color: #666;
  padding: 0.8rem 1.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.cancel-btn:hover {
  background: #e8e8e8;
}

@media (max-width: 768px) {
  .upload-content {
    padding: 1rem;
  }
  
  .upload-form-container {
    padding: 1.5rem;
  }
  
  .drop-area {
    padding: 1.5rem;
  }
  
  .drop-area .icon {
    font-size: 2rem;
  }
  
  .modal-actions {
    flex-direction: column;
  }
  
  .submit-btn,
  .cancel-btn {
    width: 100%;
  }
}
</style>