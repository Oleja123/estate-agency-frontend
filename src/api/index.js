import api from './axios'

function now() {
  return new Date().toISOString()
}

function wrapCall(fn, method, url, payload) {
  try {
    console.log(`${now()} [API Call] ${method} ${url}`, { payload })
  } catch (e) {
    console.log('[API Call] (failed to log call)', e)
  }

  return fn()
    .then((response) => {
      try {
        // transform response data: convert backend `email` fields to frontend `login`
        if (response && response.data) {
          response.data = mapEmailToLogin(response.data)
        }
      } catch (e) {
        console.log('[API Response Transform] failed', e)
      }
      return response
    })
    .catch((err) => {
      try {
        console.error(now(), '[API Call Error]', { method, url, payload, message: err.message, response: err.response?.data })
      } catch (e) {
        console.error('[API Call Error] (failed to log error)', e)
      }
      throw err
    })
}

function isPlainObject(obj) {
  return Object.prototype.toString.call(obj) === '[object Object]'
}

function mapEmailToLogin(value) {
  if (Array.isArray(value)) {
    return value.map(mapEmailToLogin)
  }

  if (!isPlainObject(value)) return value

  const out = {}
  for (const [k, v] of Object.entries(value)) {
    const key = k === 'email' ? 'login' : k
    out[key] = mapEmailToLogin(v)
  }
  return out
}

function mapLoginToEmail(value) {
  if (Array.isArray(value)) {
    return value.map(mapLoginToEmail)
  }

  if (!isPlainObject(value)) return value

  const out = {}
  for (const [k, v] of Object.entries(value)) {
    const key = k === 'login' ? 'email' : k
    out[key] = mapLoginToEmail(v)
  }
  return out
}

export const authApi = {

  login: (login, password) => {
    const payload = mapLoginToEmail({ login, password })
    return wrapCall(() => api.post('/users/login', payload), 'POST', '/users/login', payload)
  },

  register: (userData) => {
    const payload = mapLoginToEmail(userData)
    return wrapCall(() => api.post('/users/register', payload), 'POST', '/users/register', payload)
  },

  refreshToken: (refreshToken) =>
    wrapCall(() => api.post('/tokens/refresh', { refresh_token: refreshToken }), 'POST', '/tokens/refresh', { refresh_token: refreshToken })
}

export const usersApi = {
  getAll: (params = {}) =>
    wrapCall(() => api.get('/users', { params }), 'GET', '/users', { params }),

  getById: (id) =>
    wrapCall(() => api.get(`/users/${id}`), 'GET', `/users/${id}`, null),

  updateProfile: (id, data) => {
    const payload = mapLoginToEmail(data)
    return wrapCall(() => api.patch(`/users/${id}/profile`, payload), 'PATCH', `/users/${id}/profile`, payload)
  },

  changePassword: (id, currentPassword, newPassword) =>
    wrapCall(() => api.patch(`/users/${id}/password`, {
      current_password: currentPassword,
      new_password: newPassword
    }), 'PATCH', `/users/${id}/password`, { current_password: currentPassword }),

  // Admin: change a user's password without current password
  changeUserPasswordAdmin: (id, newPassword) => {
    const payload = { new_password: newPassword }
    return wrapCall(() => api.patch(`/users/${id}/password`, payload), 'PATCH', `/users/${id}/password`, payload)
  },

  changeRole: (id, role) =>
    wrapCall(() => api.patch(`/users/${id}/role`, { role }), 'PATCH', `/users/${id}/role`, { role }),

  toggleActive: (id) =>
    wrapCall(() => api.patch(`/users/${id}/active`), 'PATCH', `/users/${id}/active`, null),

  delete: (id) =>
    wrapCall(() => api.delete(`/users/${id}`), 'DELETE', `/users/${id}`, null),

  getFavorites: (id) =>
    wrapCall(() => api.get(`/users/${id}/favorites`), 'GET', `/users/${id}/favorites`, null)
}

export const propertiesApi = {
  getAll: (params = {}) =>
    wrapCall(() => api.get('/properties', { params }), 'GET', '/properties', { params }),

  getById: (id) =>
    wrapCall(() => api.get(`/properties/${id}`), 'GET', `/properties/${id}`, null),

  create: (data) =>
    wrapCall(() => api.post('/properties', data), 'POST', '/properties', data),

  update: (id, data) =>
    wrapCall(() => api.patch(`/properties/${id}`, data), 'PATCH', `/properties/${id}`, data),

  delete: (id) =>
    wrapCall(() => api.delete(`/properties/${id}`), 'DELETE', `/properties/${id}`, null),

  toggleFavorite: (id) =>
    wrapCall(() => api.post(`/properties/${id}/favorites`), 'POST', `/properties/${id}/favorites`, null),

  getImages: (id) =>
    wrapCall(() => api.get(`/properties/${id}/images`), 'GET', `/properties/${id}/images`, null),

  uploadImages: (id, files) => {
    const formData = new FormData()
    files.forEach((file) => {
      formData.append('files', file)
    })
    return wrapCall(() => api.put(`/properties/${id}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }), 'PUT', `/properties/${id}/images`, { filesCount: files.length })
  }
}

export const propertyTypesApi = {
  getAll: (params = {}) =>
    wrapCall(() => api.get('/property_types', { params }), 'GET', '/property_types', { params }),

  getById: (id) =>
    wrapCall(() => api.get(`/property_types/${id}`), 'GET', `/property_types/${id}`, null),

  create: (name) =>
    wrapCall(() => api.post('/property_types', { name }), 'POST', '/property_types', { name }),

  update: (id, name) =>
    wrapCall(() => api.patch(`/property_types/${id}`, { name }), 'PATCH', `/property_types/${id}`, { name }),

  delete: (id) =>
    wrapCall(() => api.delete(`/property_types/${id}`), 'DELETE', `/property_types/${id}`, null)
}
