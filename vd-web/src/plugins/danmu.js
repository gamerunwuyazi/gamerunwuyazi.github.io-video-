import videojs from 'video.js'

const MAX_LINES = 8
const LINE_HEIGHT = 10

const DanmuPlugin = function() {
  const player = this
  let danmus = []
  let danmuLines = []
  let container = null
  let shownIndices = new Set()

  function initDanmuLines() {
    danmuLines = []
    for (let i = 0; i < MAX_LINES; i++) {
      danmuLines.push({
        top: i * LINE_HEIGHT + 5,
        busyUntil: 0,
        activeDanmus: []
      })
    }
  }

  function createContainer() {
    container = document.createElement('div')
    container.className = 'vjs-danmu-container'
    container.style.cssText = [
      'position: absolute',
      'top: 0',
      'left: 0',
      'width: 100%',
      'height: 100%',
      'pointer-events: none',
      'overflow: hidden',
      'z-index: 2147483647',
      'background: transparent'
    ].join(';')
    player.el().appendChild(container)
  }

  function findSuitableLine() {
    const now = player.currentTime()
    for (let i = 0; i < danmuLines.length; i++) {
      if (now >= danmuLines[i].busyUntil - 0.3) {
        danmuLines[i].busyUntil = now + 3.5
        return i
      }
    }
    let idx = 0
    let soonest = danmuLines[0].busyUntil
    for (let i = 1; i < danmuLines.length; i++) {
      if (danmuLines[i].busyUntil < soonest) {
        soonest = danmuLines[i].busyUntil
        idx = i
      }
    }
    danmuLines[idx].busyUntil = now + 3.5
    return idx
  }

  function showDanmuItem(danmu) {
    if (!container) return
    const existing = container.querySelectorAll('.vjs-danmu-item')
    for (let e = 0; e < existing.length; e++) {
      if (existing[e].textContent === danmu.content) {
        return
      }
    }
    const el = document.createElement('div')
    el.className = 'vjs-danmu-item'
    el.textContent = danmu.content
    el.style.color = danmu.color || '#fff'

    const size = 16 + Math.random() * 8
    el.style.fontSize = size + 'px'
    el.style.cssText += [
      ';position:absolute',
      'white-space:nowrap',
      'text-shadow:1px 1px 2px #000',
      'opacity:0.9',
      'z-index:2147483647',
      'pointer-events:none',
      'left:100%',
      'animation:vjs-danmu-move 6s linear forwards'
    ].join(';')

    const lineIdx = findSuitableLine()
    const line = danmuLines[lineIdx]
    el.style.top = line.top + '%'

    const id = danmu.id || 'vjs_dm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    line.activeDanmus.push(id)
    el.setAttribute('data-danmu-id', id)

    el.addEventListener('animationend', function onEnd() {
      if (el.parentNode) el.parentNode.removeChild(el)
      const idx = line.activeDanmus.indexOf(id)
      if (idx !== -1) {
        line.activeDanmus.splice(idx, 1)
      }
    })

    container.appendChild(el)
    if (player.paused()) {
      el.style.animationPlayState = 'paused'
    } else if (player.readyState() < 2) {
      el.style.animationPlayState = 'paused'
      player.one('canplay', function() {
        el.style.animationPlayState = 'running'
      })
    }
  }

  function onTimeUpdate() {
    if (!container || !danmus.length) return
    const t = player.currentTime()
    for (let i = 0; i < danmus.length; i++) {
      if (shownIndices.has(i)) continue
      const d = danmus[i]
      if (Math.abs(d.time - t) < 0.5) {
        showDanmuItem(d)
        shownIndices.add(i)
      }
    }
  }

  function onSeeked() {
    if (container) container.innerHTML = ''
    initDanmuLines()
    const t = player.currentTime()
    shownIndices = new Set()
    for (let i = 0; i < danmus.length; i++) {
      if (danmus[i].time < t - 0.5) {
        shownIndices.add(i)
      }
    }
    onTimeUpdate()
  }

  function onPlay() {
    const items = container ? container.querySelectorAll('.vjs-danmu-item') : []
    items.forEach(function(el) {
      el.style.animationPlayState = 'running'
    })
  }

  function onPause() {
    const items = container ? container.querySelectorAll('.vjs-danmu-item') : []
    items.forEach(function(el) {
      el.style.animationPlayState = 'paused'
    })
  }

  function init() {
    if (!container) createContainer()
    initDanmuLines()

    player.on('timeupdate', onTimeUpdate)
    player.on('seeked', onSeeked)
    player.on('play', onPlay)
    player.on('pause', onPause)
  }

  const api = {
    setDanmus(data) {
      danmus = data || []
      initDanmuLines()
      shownIndices = new Set()
      if (container) container.innerHTML = ''
    },
    addDanmu(item) {
      danmus.push(item)
      showDanmuItem(item)
    },
    getDanmus() {
      return danmus
    },
    clear() {
      if (container) container.innerHTML = ''
      initDanmuLines()
      shownIndices = new Set()
    },
    pause() {
      const items = container ? container.querySelectorAll('.vjs-danmu-item') : []
      items.forEach(function(el) {
        el.style.animationPlayState = 'paused'
      })
    },
    resume() {
      const items = container ? container.querySelectorAll('.vjs-danmu-item') : []
      items.forEach(function(el) {
        el.style.animationPlayState = 'running'
      })
    }
  }

  init()
  return api
}

videojs.registerPlugin('danmu', DanmuPlugin)

export default DanmuPlugin