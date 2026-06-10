const resourceDomain = import.meta.env.VITE_RESOURCE_DOMAIN || ''

export function resolveUrl(path) {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('//')) {
    return path
  }
  if (path.startsWith('/')) {
    return resourceDomain + path
  }
  return resourceDomain + '/' + path
}