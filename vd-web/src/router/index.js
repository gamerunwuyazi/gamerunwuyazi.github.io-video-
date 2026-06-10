import { createRouter, createWebHistory } from 'vue-router'
import VideoList from '../views/VideoList.vue'
import VideoPlayer from '../views/VideoPlayer.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Upload from '../views/Upload.vue'

const routes = [
  {
    path: '/',
    name: 'VideoList',
    component: VideoList
  },
  {
    path: '/player/:id',
    name: 'VideoPlayer',
    component: VideoPlayer,
    props: true
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/register',
    name: 'Register',
    component: Register
  },
  {
    path: '/upload',
    name: 'Upload',
    component: Upload
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
