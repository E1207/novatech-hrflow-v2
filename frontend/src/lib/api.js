import axios from 'axios'

const browserApiUrl = typeof window !== 'undefined' ? `${window.location.origin}/api` : ''
export const API_URL = process.env.REACT_APP_API_URL || browserApiUrl || 'http://localhost:3000/api'

export function getToken() {
  return localStorage.getItem('hrflow_token')
}

export function getUser() {
  return JSON.parse(localStorage.getItem('hrflow_user') || '{}')
}

export function authHeaders() {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function apiGet(path) {
  return axios.get(`${API_URL}${path}`, { headers: authHeaders() })
}

export function apiPost(path, body, config = {}) {
  return axios.post(`${API_URL}${path}`, body, {
    headers: { ...authHeaders(), ...(config.headers || {}) },
    ...config,
  })
}

export function apiPatch(path, body, config = {}) {
  return axios.patch(`${API_URL}${path}`, body, {
    headers: { ...authHeaders(), ...(config.headers || {}) },
    ...config,
  })
}
