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

// =============================================
// 👥 AUTHENTICATION & USERS API
// =============================================
export const authAPI = {
  login: (credentials: { username: string; password: string; company_tax_id: string }) =>
    apiClient.post('/auth/login', credentials),
  
  loginLegacy: (username: string, password: string) =>
    apiClient.post('/login/', null, { params: { username, password } }),
  
  registerCompany: (data: any) =>
    apiClient.post('/auth/register-company', data),
  
  checkCompanyTaxId: (taxId: string) =>
    apiClient.get(`/auth/check-company-tax-id/${taxId}`),
  
  checkUsername: (username: string) =>
    apiClient.get(`/auth/check-username/${username}`),
  
  getMe: () =>
    apiClient.get('/users/me'),

  updateProfile: (data: any) =>
    apiClient.put('/users/me', data),

  createUser: (username: string, email: string, password: string) =>
    apiClient.post('/users/', null, { params: { username, email, password } }),
};

// =============================================
// 📦 PRODUCTS API
// =============================================
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

  getSummary: () =>
    apiClient.get('/products/stats/summary'),

  bulkUpdate: (updates: any[]) =>
    apiClient.post('/products/bulk-update', updates),

  getInventoryMovements: (productId: number) =>
    apiClient.get(`/products/${productId}/inventory_movements`),

  getByCategory: (categoryId: number) =>
    apiClient.get(`/products/category/${categoryId}`),
};

// =============================================
// 📄 INVOICES API
// =============================================
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

  getSummary: () =>
    apiClient.get('/invoices/stats/summary'),

  getPending: () =>
    apiClient.get('/invoices/pending'),

  createCreditMovement: (invoiceId: number, data: any) =>
    apiClient.post(`/invoices/${invoiceId}/credit-movements`, data),
};

// =============================================
// 💰 BUDGETS API
// =============================================
export const budgetsAPI = {
  create: (data: any) =>
    apiClient.post('/budgets', data),

  confirm: (budgetId: number) =>
    apiClient.put(`/budgets/${budgetId}/confirm`),
};

// =============================================
// 🛒 PURCHASES API
// =============================================
export const purchasesAPI = {
  getAll: (params?: { skip?: number; limit?: number; status?: string }) =>
    apiClient.get('/purchases', { params }),
  
  getById: (id: number) =>
    apiClient.get(`/purchases/${id}`),
  
  create: (data: any) =>
    apiClient.post('/purchases', data),
  
  update: (id: number, data: any) =>
    apiClient.put(`/purchases/${id}`, data),
  
  delete: (id: number) =>
    apiClient.delete(`/purchases/${id}`),

  updateStatus: (id: number, status: string) =>
    apiClient.put(`/purchases/${id}/status`, null, { params: { status } }),

  getSummary: () =>
    apiClient.get('/purchases/stats/summary'),

  getPending: () =>
    apiClient.get('/purchases/pending'),
};

// =============================================
// 🔄 INVENTORY MOVEMENTS API
// =============================================
export const inventoryMovementsAPI = {
  getAll: (params?: { skip?: number; limit?: number; movement_type?: string; product_id?: number }) =>
    apiClient.get('/inventory/movements', { params }),

  getById: (id: number) =>
    apiClient.get(`/inventory/movements/${id}`),

  create: (data: any) =>
    apiClient.post('/inventory/movements', data),

  getByProduct: (productId: number) =>
    apiClient.get(`/inventory/movements/product/${productId}`),

  getByInvoice: (invoiceId: number) =>
    apiClient.get(`/inventory/movements/invoice/${invoiceId}`),

  getSummary: () =>
    apiClient.get('/inventory/movements/stats/summary'),

  getByType: () =>
    apiClient.get('/inventory/movements/stats/by-type'),

  getRecent: (params?: { days?: number; limit?: number }) =>
    apiClient.get('/inventory/movements/recent', { params }),
};

// =============================================
// 🏭 WAREHOUSES API
// =============================================
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

  getInventoryMovements: (warehouseId: number) =>
    apiClient.get(`/warehouses/${warehouseId}/inventory_movements`),

  getSummary: () =>
    apiClient.get('/warehouses/stats/summary'),

  getProducts: (warehouseId: number) =>
    apiClient.get(`/warehouses/${warehouseId}/products`),

  getLowStock: (warehouseId: number, threshold?: number) =>
    apiClient.get(`/warehouses/${warehouseId}/low-stock`, { params: { threshold } }),
};

// =============================================
// 📦 WAREHOUSE PRODUCTS (STOCK) API
// =============================================
export const warehouseProductsAPI = {
  getAll: (params?: { skip?: number; limit?: number }) =>
    apiClient.get('/warehouse-products', { params }),

  getByWarehouseAndProduct: (warehouseId: number, productId: number) =>
    apiClient.get(`/warehouse-products/${warehouseId}/${productId}`),

  createOrUpdate: (data: any) =>
    apiClient.post('/warehouse-products', data),

  updateStock: (warehouseId: number, productId: number, data: any) =>
    apiClient.put(`/warehouse-products/${warehouseId}/${productId}`, data),

  delete: (warehouseId: number, productId: number) =>
    apiClient.delete(`/warehouse-products/${warehouseId}/${productId}`),

  getByWarehouse: (warehouseId: number) =>
    apiClient.get(`/warehouse-products/warehouse/${warehouseId}`),

  getByProduct: (productId: number) =>
    apiClient.get(`/warehouse-products/product/${productId}`),

  getLowStockAll: (threshold?: number) =>
    apiClient.get('/warehouse-products/low-stock', { params: { threshold } }),

  transferStock: (fromWarehouseId: number, toWarehouseId: number, productId: number, quantity: number) =>
    apiClient.post('/warehouse-products/transfer', null, {
      params: { from_warehouse_id: fromWarehouseId, to_warehouse_id: toWarehouseId, product_id: productId, quantity }
    }),

  adjustStock: (warehouseId: number, productId: number, adjustment: number, reason: string) =>
    apiClient.post('/warehouse-products/adjust-stock', null, {
      params: { warehouse_id: warehouseId, product_id: productId, adjustment, reason }
    }),
};

// =============================================
// 🚚 SUPPLIERS API (PARA IMPLEMENTAR EN BACKEND)
// =============================================
export const suppliersAPI = {
  getAll: (params?: { skip?: number; limit?: number }) =>
    apiClient.get('/suppliers', { params }),
  
  getById: (id: number) =>
    apiClient.get(`/suppliers/${id}`),
  
  create: (data: any) =>
    apiClient.post('/suppliers', data),
  
  update: (id: number, data: any) =>
    apiClient.put(`/suppliers/${id}`, data),
  
  delete: (id: number) =>
    apiClient.delete(`/suppliers/${id}`),

  search: (q: string) =>
    apiClient.get('/suppliers/search', { params: { q } }),

  getSummary: () =>
    apiClient.get('/suppliers/stats/summary'),

  getActive: () =>
    apiClient.get('/suppliers/active'),

  getPurchases: (supplierId: number) =>
    apiClient.get(`/suppliers/${supplierId}/purchases`),
};

// =============================================
// 👥 CUSTOMERS API (PARA IMPLEMENTAR EN BACKEND)
// =============================================
export const customersAPI = {
  getAll: (params?: { skip?: number; limit?: number }) =>
    apiClient.get('/customers', { params }),
  
  getById: (id: number) =>
    apiClient.get(`/customers/${id}`),
  
  create: async (data: any) => {
    try {
      const response = await apiClient.post('/customers', data);
      console.log('✅ Success:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error:', error.response?.data || error.message);
      throw error;
    }
  },
  
  update: (id: number, data: any) =>
    apiClient.put(`/customers/${id}`, data),
  
  delete: (id: number) =>
    apiClient.delete(`/customers/${id}`),

  search: (q: string) =>
    apiClient.get('/customers/search', { params: { q } }),

  getSummary: () =>
    apiClient.get('/customers/stats/summary'),

  getActive: () =>
    apiClient.get('/customers/active'),

  getInvoices: (customerId: number) =>
    apiClient.get(`/customers/${customerId}/invoices`),

  updateCreditLimit: (customerId: number, creditLimit: number) =>
    apiClient.put(`/customers/${customerId}/credit-limit`, { credit_limit: creditLimit }),

  getCreditStatus: (customerId: number) =>
    apiClient.get(`/customers/${customerId}/credit-status`),
};

// =============================================
// 📊 CATEGORIES API (PARA IMPLEMENTAR EN BACKEND)
// =============================================
export const categoriesAPI = {
  getAll: () =>
    apiClient.get('/categories'),
  
  getById: (id: number) =>
    apiClient.get(`/categories/${id}`),
  
  create: (data: any) =>
    apiClient.post('/categories', data),
  
  update: (id: number, data: any) =>
    apiClient.put(`/categories/${id}`, data),
  
  delete: (id: number) =>
    apiClient.delete(`/categories/${id}`),
};

// =============================================
// 🔐 PROTECTED ROUTES API
// =============================================
export const protectedAPI = {
  protected: () =>
    apiClient.get('/protected'),

  adminOnly: () =>
    apiClient.get('/admin-only'),

  managerOnly: () =>
    apiClient.get('/manager-only'),
};

// =============================================
// 🏥 HEALTH CHECK API
// =============================================
export const healthAPI = {
  check: () =>
    apiClient.get('/health'),

  root: () =>
    apiClient.get('/'),
};

// =============================================
// EXPORT DEFAULT API CLIENT
// =============================================
export default apiClient;