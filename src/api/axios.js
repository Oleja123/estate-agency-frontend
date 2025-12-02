import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

function now() {
  return new Date().toISOString()
}

function maskAuthHeader(headers = {}) {
  const h = { ...headers }
  if (h.Authorization) {
    h.Authorization = h.Authorization.replace(/Bearer\s+.+/, 'Bearer ***')
  }
  return h
}

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    try {
      const safeHeaders = maskAuthHeader(config.headers)
      console.log(`${now()} [API Request] ${config.method?.toUpperCase() || 'GET'} ${config.url}`, {
        params: config.params || undefined,
        data: config.data || undefined,
        headers: safeHeaders
      })
    } catch (e) {
      console.log('[API Request] (failed to log request)', e)
    }
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    console.error(now(), '[API Request Error]', error)
    return Promise.reject(error)
  }
)

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => {
    try {
      const cfg = response.config || {}
      console.log(`${now()} [API Response] ${cfg.method?.toUpperCase() || 'GET'} ${cfg.url} -> ${response.status}`, {
        data: response.data
      })
    } catch (e) {
      console.log('[API Response] (failed to log response)', e)
    }
    return response
  },
  async (error) => {
    const originalRequest = error.config || {}

    try {
      const status = error.response?.status
      const respData = error.response?.data
      console.error(now(), '[API Error]', {
        method: originalRequest.method?.toUpperCase() || 'GET',
        url: originalRequest.url,
        status: status,
        response: respData,
        message: error.message
      })
    } catch (e) {
      console.error('[API Error] (failed to log error)', e)
    }

    // extra debug: log raw request and response objects to help diagnose 405 / CORS / preflight issues
    try {
      console.error(now(), '[API Error Debug] config:', originalRequest)
      if (error.request) console.error(now(), '[API Error Debug] request:', error.request)
      if (error.response) console.error(now(), '[API Error Debug] response headers/status:', {
        status: error.response.status,
        headers: error.response.headers,
        data: error.response.data
      })
    } catch (e) {
      console.error('[API Error Debug] failed to dump debug info', e)
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/tokens/refresh`, {
            refresh_token: refreshToken
          })

          const { access_token, refresh_token } = response.data
          localStorage.setItem('access_token', access_token)
          localStorage.setItem('refresh_token', refresh_token)

          originalRequest.headers.Authorization = `Bearer ${access_token}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        console.error(now(), '[Token Refresh Error]', refreshError)
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api
