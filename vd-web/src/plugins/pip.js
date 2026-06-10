import videojs from 'video.js'

const PipPlugin = function() {
  const player = this
  let pipWindow = null
  let originalParent = null
  let originalSibling = null
  let videoEl = null

  const overlay = createOverlay()

  function createOverlay() {
    const el = document.createElement('div')
    el.id = 'pipOverlay'
    el.innerHTML = [
      '<div style="text-align:center;color:#888;font-size:16px;">',
      '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="1.5">',
      '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>',
      '<rect x="11" y="9" width="9" height="6" rx="1" ry="1"/>',
      '</svg>',
      '<p style="margin-top:12px;">画中画播放中</p>',
      '</div>'
    ].join('')
    el.style.cssText = [
      'position:absolute', 'top:0', 'left:0', 'width:100%', 'height:100%',
      'background:#000', 'display:none', 'align-items:center', 'justify-content:center',
      'z-index:2147483647', 'pointer-events:none'
    ].join(';')
    return el
  }

  function showOverlay() {
    const wrapper = document.querySelector('.player-wrapper')
    if (!wrapper) return
    if (!overlay.parentNode) {
      wrapper.appendChild(overlay)
    }
    overlay.style.display = 'flex'
  }

  function hideOverlay() {
    if (!overlay) return
    overlay.style.display = 'none'
    if (overlay.parentNode) {
      overlay.parentNode.removeChild(overlay)
    }
  }

  function copyStyles(destDoc) {
    const styles = document.querySelectorAll('style, link[rel="stylesheet"]')
    styles.forEach(function(s) {
      destDoc.head.appendChild(s.cloneNode(true))
    })
  }

  function closePiP() {
    if (pipWindow) {
      const win = pipWindow
      onPipPageHide()
      try {
        if (!win.closed) {
          win.close()
        }
      } catch (e) {}
    }
  }

  function movePlayerBack() {
    if (!originalParent) return
    try {
      const el = player.el()
      if (!el) return
      if (el.parentNode === originalParent) return
      if (originalSibling && originalSibling.parentNode) {
        originalParent.insertBefore(el, originalSibling)
      } else {
        originalParent.appendChild(el)
      }
      resetPlayerStyles()
    } catch (err) {
      console.error('Failed to move player back:', err)
    }
  }

  function resetPlayerStyles() {
    const el = player.el()
    if (!el) return
    el.style.width = ''
    el.style.height = ''
    el.style.position = ''
    el.style.margin = ''
    el.style.padding = ''
    el.style.top = ''
    el.style.left = ''
    el.style.background = ''
  }

  function clearDanmuContainer() {
    const el = player.el()
    if (!el) return
    const dmContainer = el.querySelector('.vjs-danmu-container')
    if (dmContainer) {
      const count = dmContainer.querySelectorAll('.vjs-danmu-item').length
      if (count > 0) {
        dmContainer.innerHTML = ''
      }
    }
  }

  function onPipPageHide() {
    movePlayerBack()
    hideOverlay()
    clearDanmuContainer()
    const fullscreenToggle = player.controlBar.getChild('FullscreenToggle')
    if (fullscreenToggle) {
      fullscreenToggle.show()
    }
    if (pipWindow) {
      try { pipWindow.removeEventListener('pagehide', onPipPageHide) } catch (e) {}
      pipWindow = null
    }
  }

  async function enterDpIP(e) {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    if (pipWindow) {
      return
    }

    if (!('documentPictureInPicture' in window)) {
      try {
        await videoEl.requestPictureInPicture()
      } catch (err) {
        console.error('Native PiP fallback failed:', err)
      }
      return
    }

    try {
      const vidW = videoEl.videoWidth || 1280
      const vidH = videoEl.videoHeight || 720

      pipWindow = await documentPictureInPicture.requestWindow({
        width: vidW,
        height: vidH
      })

      originalParent = player.el().parentNode
      originalSibling = player.el().nextSibling

      pipWindow.document.body.innerHTML = ''
      pipWindow.document.body.style.margin = '0'
      pipWindow.document.body.style.padding = '0'
      pipWindow.document.body.style.background = '#000'
      pipWindow.document.body.style.overflow = 'hidden'
      pipWindow.document.body.style.width = vidW + 'px'
      pipWindow.document.body.style.height = vidH + 'px'

      copyStyles(pipWindow.document)

      pipWindow.document.body.appendChild(player.el())
      clearDanmuContainer()

      const pEl = player.el()
      pEl.style.width = vidW + 'px'
      pEl.style.height = vidH + 'px'
      pEl.style.position = 'static'
      pEl.style.margin = '0'
      pEl.style.padding = '0'
      pEl.style.top = 'auto'
      pEl.style.left = 'auto'
      pEl.style.background = '#000'

      const techEl = pEl.querySelector('.vjs-tech')
      if (techEl) {
        techEl.style.width = '100%'
        techEl.style.height = '100%'
        techEl.style.objectFit = 'contain'
      }

      showOverlay()

      const fullscreenToggle = player.controlBar.getChild('FullscreenToggle')
      if (fullscreenToggle) {
        fullscreenToggle.hide()
      }

      pipWindow.addEventListener('pagehide', onPipPageHide)
    } catch (err) {
      console.error('Document PiP failed:', err)
    }
  }

  function onEnterNativePiP() {
    showOverlay()
  }

  function onLeaveNativePiP() {
    hideOverlay()
  }

  function takeOverPipButton() {
    const pipControl = player.controlBar.getChild('PictureInPictureToggle')
    if (pipControl) {
      pipControl.handleClick = function(event) {
        if (pipWindow) {
          if (event) {
            event.preventDefault()
            event.stopPropagation()
          }
          closePiP()
        } else {
          enterDpIP(event)
        }
      }
    } else {
      const pipBtn = player.el().querySelector('.vjs-picture-in-picture-control')
      if (pipBtn) {
        pipBtn.addEventListener('click', function(event) {
          event.preventDefault()
          event.stopPropagation()
          if (pipWindow) {
            closePiP()
          } else {
            enterDpIP(event)
          }
        }, true)
      }
    }
  }

  function init() {
    videoEl = player.tech_.el()
    takeOverPipButton()

    videoEl.addEventListener('enterpictureinpicture', onEnterNativePiP)
    videoEl.addEventListener('leavepictureinpicture', onLeaveNativePiP)

    player.on('dispose', function() {
      if (pipWindow && !pipWindow.closed) {
        try { pipWindow.close() } catch (e) {}
      }
      pipWindow = null
      originalParent = null
      originalSibling = null
      videoEl.removeEventListener('enterpictureinpicture', onEnterNativePiP)
      videoEl.removeEventListener('leavepictureinpicture', onLeaveNativePiP)
    })
  }

  if (!player.tech_) {
    player.ready(init)
  } else {
    init()
  }
}

if (!videojs.getPlugin('pip')) {
  videojs.registerPlugin('pip', PipPlugin)
}
export default PipPlugin