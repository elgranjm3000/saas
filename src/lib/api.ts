import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Configuración del cliente Axios
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const getCookie = (name: string): string | null => {
  if (typeof window === 'undefined') return null
  
  return document.cookie.split('; ').reduce((r, v) => {
    const parts = v.split('=')
    return parts[0] === name ? decodeURIComponent(parts[1]) : r
  }, null as string | null)
}

// Interceptor para incluir el token de autorización
apiClient.interceptors.request.use(
  (config) => {
    const token = getCookie('access_token') || localStorage.getItem('access_token')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_data');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Servicios de API
export const authAPI = {
  login: (credentials: { username: string; password: string; company_tax_id: string }) =>
    apiClient.post('/auth/login', credentials),
  
  registerCompany: (data: any) =>
    apiClient.post('/auth/register-company', data),
  
  checkCompanyTaxId: (taxId: string) =>
    apiClient.get(`/auth/check-company-tax-id/${taxId}`),
  
  checkUsername: (username: string) =>
    apiClient.get(`/auth/check-username/${username}`),
  
  getMe: () =>
    apiClient.get('/users/me'),
};

export const productsAPI = {
  getAll: (params?: { skip?: number; limit?: number }) =>
    apiClient.get('/products', { params }),
  
  getById: (id: number) =>
    apiClient.get(`/products/${id}`),
  
  create: (data: any) =>
    apiClient.post('/products', data),
  
  update: (id: number, data: any) =>
    apiClient.put(`/products/${id}`, data),
  
  delete: (id: number) =>
    apiClient.delete(`/products/${id}`),
  
  search: (q: string) =>
    apiClient.get('/products/search', { params: { q } }),
  
  getLowStock: (threshold?: number) =>
    apiClient.get('/products/low-stock', { params: { threshold } }),
};

export const invoicesAPI = {
  getAll: (params?: { skip?: number; limit?: number; status?: string }) =>
    apiClient.get('/invoices', { params }),
  
  getById: (id: number) =>
    apiClient.get(`/invoices/${id}`),
  
  create: (data: any) =>
    apiClient.post('/invoices', data),
  
  update: (id: number, data: any) =>
    apiClient.put(`/invoices/${id}`, data),
  
  delete: (id: number) =>
    apiClient.delete(`/invoices/${id}`),
};

export const warehousesAPI = {
  getAll: (params?: { skip?: number; limit?: number }) =>
    apiClient.get('/warehouses', { params }),
  
  getById: (id: number) =>
    apiClient.get(`/warehouses/${id}`),
  
  create: (data: any) =>
    apiClient.post('/warehouses', data),
  
  update: (id: number, data: any) =>
    apiClient.put(`/warehouses/${id}`, data),
  
  delete: (id: number) =>
    apiClient.delete(`/warehouses/${id}`),
};
