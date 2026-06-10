const apiBaseUrl = import.meta.env.VITE_RESOURCE_DOMAIN || ''

export function api(path) {
  if (!path.startsWith('/')) {
    path = '/' + path
  }
  return apiBaseUrl + '/api' + path
}

export default apiBaseUrl