import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach access token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — auto-refresh on 401
api.interceptors.response.use(
  (response) => response.data?.data ?? response.data,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');
        const res = await axios.post(`${API_URL}/auth/refresh`, null, {
          headers: { Authorization: `Bearer ${refreshToken}` },
        });
        const { accessToken } = res.data.data || res.data;
        localStorage.setItem('accessToken', accessToken);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error.response?.data || error);
  },
);

// ── Typed API methods ──
export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

export const ingredientsApi = {
  list: (params?: any) => api.get('/ingredients', { params }),
  get: (id: string) => api.get(`/ingredients/${id}`),
  create: (data: any) => api.post('/ingredients', data),
  update: (id: string, data: any) => api.put(`/ingredients/${id}`, data),
  delete: (id: string) => api.delete(`/ingredients/${id}`),
  categories: () => api.get('/ingredients/categories'),
};

export const suppliersApi = {
  list: (params?: any) => api.get('/suppliers', { params }),
  get: (id: string) => api.get(`/suppliers/${id}`),
  create: (data: any) => api.post('/suppliers', data),
  update: (id: string, data: any) => api.put(`/suppliers/${id}`, data),
  delete: (id: string) => api.delete(`/suppliers/${id}`),
};

export const recipesApi = {
  list: (params?: any) => api.get('/recipes', { params }),
  get: (id: string) => api.get(`/recipes/${id}`),
  create: (data: any) => api.post('/recipes', data),
  update: (id: string, data: any) => api.put(`/recipes/${id}`, data),
  delete: (id: string) => api.delete(`/recipes/${id}`),
  analytics: () => api.get('/recipes/analytics'),
  costPreview: (data: any) => api.post('/recipes/cost-preview', data),
};

export const assetsApi = {
  list: (params?: any) => api.get('/assets', { params }),
  get: (id: string) => api.get(`/assets/${id}`),
  create: (data: any) => api.post('/assets', data),
  update: (id: string, data: any) => api.put(`/assets/${id}`, data),
  delete: (id: string) => api.delete(`/assets/${id}`),
  summary: () => api.get('/assets/summary'),
};

export const sopApi = {
  list: (params?: any) => api.get('/sop', { params }),
  get: (id: string) => api.get(`/sop/${id}`),
  create: (data: any) => api.post('/sop', data),
  update: (id: string, data: any) => api.put(`/sop/${id}`, data),
  delete: (id: string) => api.delete(`/sop/${id}`),
};

export const financialsApi = {
  dashboard: () => api.get('/financials/dashboard'),
  byYear: (year: number) => api.get(`/financials/year/${year}`),
  upsert: (data: any) => api.post('/financials', data),
};

export const organizationApi = {
  get: () => api.get('/organization'),
  update: (data: any) => api.put('/organization', data),
  members: () => api.get('/organization/members'),
  invite: (data: any) => api.post('/organization/members/invite', data),
  removeMember: (userId: string) => api.delete(`/organization/members/${userId}`),
  updateDocSettings: (data: any) => api.put('/organization/document-settings', data),
};

export const usersApi = {
  profile: () => api.get('/users/profile'),
  updateProfile: (data: any) => api.put('/users/profile', data),
  changePassword: (data: any) => api.put('/users/password', data),
};
