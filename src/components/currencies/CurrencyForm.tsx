'use client';

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Calculator,
  Settings,
  Info,
} from 'lucide-react';
import { useCurrencyStore } from '@/store/currency-store';
import type { CurrencyCreateForm, CurrencyUpdateForm } from '@/types/currency';

interface CurrencyFormProps {
  onSuccess?: () => void;
  initialData?: CurrencyUpdateForm;
  currencyId?: number;
}

export const CurrencyForm: React.FC<CurrencyFormProps> = ({
  onSuccess,
  initialData,
  currencyId,
}) => {
  const { createCurrency, updateCurrency, isLoading, error, clearError, fetchCurrencies } =
    useCurrencyStore();

  // Importar API
  const { currenciesAPI } = require('@/lib/api');

  const [formData, setFormData] = useState<CurrencyCreateForm>({
    code: '',
    name: '',
    symbol: '',
    exchange_rate: '1.00',
    decimal_places: 2,
    is_base_currency: false,
    conversion_method: 'direct',
    applies_igtf: false,
    igtf_rate: '3.00',
    igtf_exempt: false,
    rate_update_method: 'manual',
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showIGTF, setShowIGTF] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        code: '',
        ...initialData,
        exchange_rate: initialData.exchange_rate || '1.00',
      });
    }
  }, [initialData]);

  // Extract error message from error object
  const getErrorMessage = (err: any): string => {
    if (typeof err === 'string') return err;

    if (err?.response?.data?.detail) {
      const detail = err.response.data.detail;
      if (typeof detail === 'string') return detail;
      if (Array.isArray(detail)) {
        return detail.map((e: any) => e.msg || 'Error de validación').join('. ');
      }
    }

    if (err?.response?.data?.message) return err.response.data.message;
    if (err?.message) return err.message;

    return 'Error al guardar la moneda';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setErrorMessage('');

    try {
      // VES y moneda base no deben tener conversion_method
      const dataToSubmit = { ...formData };

      if (dataToSubmit.code === 'VES' || dataToSubmit.is_base_currency) {
        delete dataToSubmit.conversion_method;
      }

      // Caso especial: Cambiar moneda base (solo al editar)
      const wasBaseBefore = initialData?.is_base_currency || false;
      const isBaseNow = dataToSubmit.is_base_currency || false;

      if (currencyId && initialData) {
        // Actualizar moneda normalmente
        await updateCurrency(currencyId, dataToSubmit);

        // Si se está cambiando la moneda base, usar el endpoint especial
        if (isBaseNow && !wasBaseBefore) {
          await currenciesAPI.setBaseCurrency(currencyId);
          // Recargar monedas para actualizar el estado
          await fetchCurrencies({ is_active: true });
        } else if (!isBaseNow && wasBaseBefore) {
          // Se está desmarcando la moneda base
          // Esto no debería permitirse, pero si sucede, mostramos advertencia
          setErrorMessage('No se puede desactivar la moneda base. Establezca otra moneda como base primero.');
          return;
        }
      } else {
        // Crear nueva moneda
        await createCurrency(dataToSubmit);
      }
      onSuccess?.();
    } catch (err: any) {
      setErrorMessage(getErrorMessage(err));
    }
  };

  const handleFieldChange = (
    field: keyof CurrencyCreateForm,
    value: string | number | boolean
  ) => {
    const newData = { ...formData, [field]: value };

    // Si es VES o moneda base, limpiar conversion_method
    if (field === 'code' && value === 'VES') {
      newData.conversion_method = undefined;
    }
    if (field === 'is_base_currency' && value === true) {
      newData.conversion_method = undefined;
    }

    setFormData(newData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Display */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{errorMessage}</p>
        </div>
      )}

      {/* Información Básica */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Información Básica</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Código ISO */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código ISO 4217 *
            </label>
            <input
              type="text"
              maxLength={3}
              required
              disabled={!!currencyId}
              value={formData.code.toUpperCase()}
              onChange={(e) => handleFieldChange('code', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              placeholder="USD"
            />
            <p className="text-xs text-gray-500 mt-1">
              3 letras (ej: USD, VES, EUR)
            </p>
          </div>

          {/* Símbolo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Símbolo *
            </label>
            <input
              type="text"
              required
              value={formData.symbol}
              onChange={(e) => handleFieldChange('symbol', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="$"
            />
          </div>

          {/* Nombre */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre Completo *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Dólar Estadounidense"
            />
          </div>
        </div>
      </div>

      {/* Tasa de Cambio */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold">Tasa de Cambio</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tasa Actual */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tasa de Cambio * (hasta 10 decimales)
            </label>
            <input
              type="text"
              inputMode="decimal"
              required
              value={formData.exchange_rate}
              onChange={(e) => {
                // Only allow valid decimal numbers
                const value = e.target.value;
                if (/^\d*\.?\d{0,10}$/.test(value) || value === '') {
                  handleFieldChange('exchange_rate', value);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
              placeholder="36.50"
            />
            <p className="text-xs text-gray-500 mt-1">
              Precisión de 10 decimales (ej: 36.5000000000)
            </p>
          </div>

          {/* Decimales */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Decimales para Display
            </label>
            <input
              type="number"
              min="0"
              max="10"
              value={formData.decimal_places}
              onChange={(e) =>
                handleFieldChange('decimal_places', parseInt(e.target.value))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="2"
            />
            <p className="text-xs text-gray-500 mt-1">
              Usado para mostrar precios
            </p>
          </div>

          {/* Método de Actualización */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Método de Actualización
            </label>
            <select
              value={formData.rate_update_method}
              onChange={(e) =>
                handleFieldChange(
                  'rate_update_method',
                  e.target.value as any
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="manual">Manual</option>
              <option value="api_bcv">API BCV (Venezuela)</option>
              <option value="api_binance">API Binance</option>
              <option value="api_fixer">API Fixer.io</option>
              <option value="scraper">Web Scraper</option>
              <option value="scheduled">Programado</option>
              <option value="webhook">Webhook</option>
            </select>
          </div>
        </div>
      </div>

      {/* Moneda Base y Conversión */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold">Configuración de Conversión</h3>
          </div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showAdvanced ? 'Ocultar' : 'Mostrar'} opciones avanzadas
          </button>
        </div>

        <div className="space-y-4">
          {/* Moneda Base */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_base_currency"
              checked={formData.is_base_currency || false}
              onChange={(e) =>
                handleFieldChange('is_base_currency', e.target.checked)
              }
              className="w-4 h-4 text-blue-600"
            />
            <label htmlFor="is_base_currency" className="text-sm text-gray-700">
              Moneda base de la empresa (solo una permitida)
            </label>
          </div>

          {showAdvanced && !formData.is_base_currency && formData.code !== 'VES' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Método de Conversión
              </label>
              <select
                value={formData.conversion_method}
                onChange={(e) =>
                  handleFieldChange('conversion_method', e.target.value as any)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="direct">
                  Directa (fuertes: USD, EUR) - 1/tasa
                </option>
                <option value="inverse">
                  Inversa (débiles: COP, ARS) - tasa
                </option>
                <option value="via_usd">Vía USD (para triangulación)</option>
              </select>
              <div className="mt-2 flex items-start gap-2 p-2 bg-blue-50 rounded">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-700">
                  <strong>Directa:</strong> USD 36.50 → factor 0.0274 (1/36.50){' '}
                  <br />
                  <strong>Inversa:</strong> COP 0.015 → factor 0.015 (igual){' '}
                  <br />
                  El sistema calcula automáticamente el factor de conversión.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* IGTF (Impuesto venezolano) */}
      <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold">IGTF</h3>
          </div>
          <button
            type="button"
            onClick={() => setShowIGTF(!showIGTF)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showIGTF ? 'Ocultar' : 'Mostrar'} configuración
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-3">
          Impuesto a Grandes Transacciones Financieras (Venezuela)
        </p>

        {showIGTF && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="applies_igtf"
                checked={formData.applies_igtf || false}
                onChange={(e) =>
                  handleFieldChange('applies_igtf', e.target.checked)
                }
                className="w-4 h-4 text-orange-600"
                disabled={formData.code === 'VES'}
              />
              <label htmlFor="applies_igtf" className="text-sm text-gray-700">
                Aplicar IGTF a esta moneda
              </label>
            </div>

            {formData.applies_igtf && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tasa IGTF (%)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.igtf_rate}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d*\.?\d{0,2}$/.test(value) || value === '') {
                        handleFieldChange('igtf_rate', value);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="3.00"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="igtf_exempt"
                    checked={formData.igtf_exempt || false}
                    onChange={(e) =>
                      handleFieldChange('igtf_exempt', e.target.checked)
                    }
                    className="w-4 h-4 text-orange-600"
                  />
                  <label htmlFor="igtf_exempt" className="text-sm text-gray-700">
                    Exenta de IGTF por defecto
                  </label>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              {currencyId ? 'Actualizar Moneda' : 'Crear Moneda'}
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onSuccess}
          className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
};
