import { create } from 'zustand';
import { currenciesAPI } from '@/lib/api';
import type {
  Currency,
  CurrencyRateHistory,
  CurrencyStatistics,
  CurrencyConversion,
  IGTFResult,
  CurrencyCreateForm,
  CurrencyUpdateForm,
  CurrencyRateUpdateForm,
  ConversionFactor,
} from '@/types/currency';

// ==================== STATE INTERFACE ====================

interface CurrencyState {
  // Data
  currencies: Currency[];
  selectedCurrency: Currency | null;
  rateHistory: CurrencyRateHistory[];
  statistics: CurrencyStatistics | null;
  conversionFactors: ConversionFactor[];

  // UI State
  isLoading: boolean;
  isUpdatingRate: boolean;
  isConverting: boolean;
  error: string | null;

  // Pagination
  total: number;
  skip: number;
  limit: number;
}

// ==================== ACTIONS INTERFACE ====================

interface CurrencyActions {
  // ==================== CRUD BÁSICO ====================

  /**
   * Obtener todas las monedas de la empresa
   */
  fetchCurrencies: (params?: { skip?: number; limit?: number; is_active?: boolean }) => Promise<void>;

  /**
   * Obtener moneda por ID
   */
  fetchCurrencyById: (id: number) => Promise<Currency>;

  /**
   * Crear nueva moneda
   */
  createCurrency: (data: CurrencyCreateForm) => Promise<Currency>;

  /**
   * Actualizar moneda existente
   */
  updateCurrency: (id: number, data: CurrencyUpdateForm) => Promise<void>;

  /**
   * Eliminar moneda
   */
  deleteCurrency: (id: number) => Promise<void>;

  // ==================== TASAS DE CAMBIO ====================

  /**
   * Actualizar tasa de cambio con registro histórico
   */
  updateCurrencyRate: (id: number, data: CurrencyRateUpdateForm) => Promise<void>;

  /**
   * Obtener historial de cambios de tasa
   */
  fetchRateHistory: (id: number, limit?: number) => Promise<void>;

  /**
   * Obtener estadísticas completas de moneda
   */
  fetchStatistics: (id: number) => Promise<void>;

  // ==================== CONVERSIÓN ====================

  /**
   * Convertir monto entre monedas
   */
  convertCurrency: (from: string, to: string, amount: number) => Promise<CurrencyConversion>;

  /**
   * Obtener factores de conversión de todas las monedas
   */
  fetchConversionFactors: () => Promise<void>;

  // ==================== IGTF ====================

  /**
   * Calcular IGTF para una transacción
   */
  calculateIGTF: (amount: number, currencyId: number, paymentMethod?: string) => Promise<IGTFResult>;

  // ==================== VALIDACIÓN ====================

  /**
   * Validar código ISO 4217
   */
  validateISOCode: (code: string) => Promise<{ valid: boolean; code: string; message: string }>;

  // ==================== UI HELPERS ====================

  /**
   * Seleccionar moneda activa
   */
  selectCurrency: (currency: Currency | null) => void;

  /**
   * Limpiar errores
   */
  clearError: () => void;

  /**
   * Resetear estado
   */
  reset: () => void;
}

// ==================== INITIAL STATE ====================

const initialState: CurrencyState = {
  currencies: [],
  selectedCurrency: null,
  rateHistory: [],
  statistics: null,
  conversionFactors: [],
  isLoading: false,
  isUpdatingRate: false,
  isConverting: false,
  error: null,
  total: 0,
  skip: 0,
  limit: 100,
};

// ==================== STORE ====================

export const useCurrencyStore = create<CurrencyState & CurrencyActions>()((set, get) => ({
  ...initialState,

  // ==================== CRUD BÁSICO ====================

  fetchCurrencies: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await currenciesAPI.getAll(params);
      set({
        currencies: response.data,
        total: response.data.length,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Error al cargar monedas',
        isLoading: false,
      });
      throw error;
    }
  },

  fetchCurrencyById: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await currenciesAPI.getById(id);
      const currency = response.data;

      // Actualizar lista y seleccionar moneda
      set((state) => ({
        currencies: state.currencies.map((c) => (c.id === id ? currency : c)),
        selectedCurrency: currency,
        isLoading: false,
      }));

      return currency;
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Error al cargar moneda',
        isLoading: false,
      });
      throw error;
    }
  },

  createCurrency: async (data: CurrencyCreateForm) => {
    set({ isLoading: true, error: null });
    try {
      const response = await currenciesAPI.create(data);
      const newCurrency = response.data;

      // Agregar a la lista
      set((state) => ({
        currencies: [...state.currencies, newCurrency],
        total: state.total + 1,
        isLoading: false,
      }));

      return newCurrency;
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Error al crear moneda',
        isLoading: false,
      });
      throw error;
    }
  },

  updateCurrency: async (id: number, data: CurrencyUpdateForm) => {
    set({ isLoading: true, error: null });
    try {
      const response = await currenciesAPI.update(id, data);
      const updatedCurrency = response.data;

      // Actualizar en la lista
      set((state) => ({
        currencies: state.currencies.map((c) => (c.id === id ? updatedCurrency : c)),
        selectedCurrency: state.selectedCurrency?.id === id ? updatedCurrency : state.selectedCurrency,
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Error al actualizar moneda',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteCurrency: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      await currenciesAPI.delete(id);

      // Remover de la lista
      set((state) => ({
        currencies: state.currencies.filter((c) => c.id !== id),
        total: state.total - 1,
        selectedCurrency: state.selectedCurrency?.id === id ? null : state.selectedCurrency,
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Error al eliminar moneda',
        isLoading: false,
      });
      throw error;
    }
  },

  // ==================== TASAS DE CAMBIO ====================

  updateCurrencyRate: async (id: number, data: CurrencyRateUpdateForm) => {
    set({ isUpdatingRate: true, error: null });
    try {
      const response = await currenciesAPI.updateRate(id, data);
      const updatedCurrency = response.data;

      // Actualizar moneda en la lista
      set((state) => ({
        currencies: state.currencies.map((c) => (c.id === id ? updatedCurrency : c)),
        selectedCurrency: state.selectedCurrency?.id === id ? updatedCurrency : state.selectedCurrency,
        isUpdatingRate: false,
      }));

      // Recargar historial
      await get().fetchRateHistory(id);
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Error al actualizar tasa',
        isUpdatingRate: false,
      });
      throw error;
    }
  },

  fetchRateHistory: async (id: number, limit = 100) => {
    set({ isLoading: true, error: null });
    try {
      const response = await currenciesAPI.getRateHistory(id, limit);
      set({
        rateHistory: response.data,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Error al cargar historial',
        isLoading: false,
      });
      throw error;
    }
  },

  fetchStatistics: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await currenciesAPI.getStatistics(id);
      set({
        statistics: response.data,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Error al cargar estadísticas',
        isLoading: false,
      });
      throw error;
    }
  },

  // ==================== CONVERSIÓN ====================

  convertCurrency: async (from: string, to: string, amount: number) => {
    set({ isConverting: true, error: null });
    try {
      const response = await currenciesAPI.convert(from, to, amount);
      set({ isConverting: false });
      return response.data;
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Error al convertir moneda',
        isConverting: false,
      });
      throw error;
    }
  },

  fetchConversionFactors: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await currenciesAPI.getConversionFactors();
      set({
        conversionFactors: response.data,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Error al cargar factores',
        isLoading: false,
      });
      throw error;
    }
  },

  // ==================== IGTF ====================

  calculateIGTF: async (amount: number, currencyId: number, paymentMethod = 'transfer') => {
    set({ isLoading: true, error: null });
    try {
      const response = await currenciesAPI.calculateIGTF(amount, currencyId, paymentMethod);
      set({ isLoading: false });
      return response.data;
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Error al calcular IGTF',
        isLoading: false,
      });
      throw error;
    }
  },

  // ==================== VALIDACIÓN ====================

  validateISOCode: async (code: string) => {
    try {
      const response = await currenciesAPI.validateISO(code);
      return response.data;
    } catch (error: any) {
      return {
        valid: false,
        code,
        message: error.response?.data?.detail || 'Código inválido',
      };
    }
  },

  // ==================== UI HELPERS ====================

  selectCurrency: (currency: Currency | null) => {
    set({ selectedCurrency: currency });
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set(initialState);
  },
}));

// ==================== SELECTORS HELPER ====================

/**
 * Obtener moneda base de la empresa
 */
export const getBaseCurrency = (state: CurrencyState) =>
  state.currencies.find((c) => c.is_base_currency) || null;

/**
 * Obtener monedas activas
 */
export const getActiveCurrencies = (state: CurrencyState) =>
  state.currencies.filter((c) => c.is_active);

/**
 * Obtener monedas que aplican IGTF
 */
export const getIGTFCurrencies = (state: CurrencyState) =>
  state.currencies.filter((c) => c.applies_igtf && c.is_active);

/**
 * Obtener moneda por código
 */
export const getCurrencyByCode = (code: string) => (state: CurrencyState) =>
  state.currencies.find((c) => c.code === code) || null;
