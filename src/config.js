// Android Capacitor эсвэл Web — API URL тодорхойлох
// Production-д жинхэнэ server URL оруулна: https://api.dxkino.mn
// Dev Web: Vite proxy (/api → localhost:5000)
// Dev Android emulator: 10.0.2.2:5000

import { Capacitor } from '@capacitor/core'

const isNative = Capacitor.isNativePlatform()
const isDev = import.meta.env.DEV
const PROD_API = import.meta.env.VITE_API_BASE || 'https://api.chocomocha.site'

export const API_BASE = isNative
  ? PROD_API
  : (isDev ? '' : PROD_API)

export function apiUrl(path) {
  return API_BASE + path
}
