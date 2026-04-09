import axios from 'axios'
import { API_BASE } from './constants'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.response.use(
  response => response,
  error => {
    const detail = error.response?.data?.detail
    const message = typeof detail === 'string' ? detail : error.message || 'An unexpected error occurred'
    return Promise.reject(new Error(message))
  }
)

export default api
