// Dev (npm run dev) → Vite proxy ашиглана (BASE = '')
// Production build (APK) → PC IP руу шууд хандана
const BASE = import.meta.env.DEV ? '' : 'http://192.168.1.7:5000'

export function api(path) {
  return BASE + path
}

export function uploadUrl(filename) {
  return filename ? `${BASE}/api/uploads/${filename}` : null
}
