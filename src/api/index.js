import api from './axios'

export const authApi = {
  login: (email, password) => 
    api.post('/users/login', { email, password }),

  register: (userData) => 
    api.post('/users/register', userData),

  refreshToken: (refreshToken) => 
    api.post('/tokens/refresh', { refresh_token: refreshToken })
}

export const usersApi = {
  getAll: (params = {}) => 
    api.get('/users', { params }),

  getById: (id) => 
    api.get(`/users/${id}`),

  updateProfile: (id, data) => 
    api.patch(`/users/${id}/profile`, data),

  changePassword: (id, currentPassword, newPassword) => 
    api.patch(`/users/${id}/password`, {
      current_password: currentPassword,
      new_password: newPassword
    }),

  changeRole: (id, role) => 
    api.patch(`/users/${id}/role`, { role }),

  toggleActive: (id) => 
    api.patch(`/users/${id}/active`),

  delete: (id) => 
    api.delete(`/users/${id}`),

  getFavorites: (id) => 
    api.get(`/users/${id}/favorites`)
}

export const propertiesApi = {
  getAll: (params = {}) => 
    api.get('/properties', { params }),

  getById: (id) => 
    api.get(`/properties/${id}`),

  create: (data) => 
    api.post('/properties', data),

  update: (id, data) => 
    api.patch(`/properties/${id}`, data),

  delete: (id) => 
    api.delete(`/properties/${id}`),

  toggleFavorite: (id) => 
    api.post(`/properties/${id}/favorites`),

  getImages: (id) => 
    api.get(`/properties/${id}/images`),

  uploadImages: (id, files) => {
    const formData = new FormData()
    files.forEach((file) => {
      formData.append('files', file)
    })
    return api.put(`/properties/${id}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
}

export const propertyTypesApi = {
  getAll: (params = {}) => 
    api.get('/property_types', { params }),

  getById: (id) => 
    api.get(`/property_types/${id}`),

  create: (name) => 
    api.post('/property_types', { name }),

  update: (id, name) => 
    api.patch(`/property_types/${id}`, { name }),

  delete: (id) => 
    api.delete(`/property_types/${id}`)
}
