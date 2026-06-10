import { reactive } from 'vue'

const state = reactive({
  visible: false,
  text: '',
  isError: false
})

let timer = null

export function showToast(text, isError = false) {
  if (timer) clearTimeout(timer)
  state.text = text
  state.isError = isError
  state.visible = true
  timer = setTimeout(() => {
    state.visible = false
  }, 3000)
}

export function useToast() {
  return { state, showToast }
}