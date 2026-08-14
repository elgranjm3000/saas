'use client';

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  Info,
} from 'lucide-react';
import { useCurrencyStore, getActiveCurrencies, getBaseCurrency } from '@/store/currency-store';

interface CurrencyConverterSelectorProps {
  amount: number;
  fromCurrencyId?: number | null;
  onCurrencyChange?: (currencyId: number) => void;
  onAmountChange?: (convertedAmount: number, currencyId: number) => void;
  disabled?: boolean;
  label?: string;
  showConversionDetails?: boolean;
  excludeCurrencyIds?: number[];
  className?: string;
}

/**
 * Selector de moneda con conversión en tiempo real
 *
 * Muestra un dropdown para seleccionar la moneda y automáticamente
 * calcula y muestra el monto convertido.
 *
 * Ejemplo de uso:
 * ```tsx
 * <CurrencyConverterSelector
 *   amount={1000}
 *   fromCurrencyId={usdCurrencyId}
 *   onCurrencyChange={(currencyId) => {
 *     // Guardar la moneda seleccionada
 *   }}
 *   onAmountChange={(convertedAmount, currencyId) => {
 *     // Usar el monto convertido
 *   }}
 * />
 * ```
 */
export const CurrencyConverterSelector: React.FC<CurrencyConverterSelectorProps> = ({
  amount,
  fromCurrencyId,
  onCurrencyChange,
  onAmountChange,
  disabled = false,
  label = 'Convertir a',
  showConversionDetails = true,
  excludeCurrencyIds = [],
  className = '',
}) => {
  const { currencies, isLoading, fetchCurrencies } = useCurrencyStore();

  const [selectedCurrencyId, setSelectedCurrencyId] = useState<number | null>(null);
  const [convertedAmount, setConvertedAmount] = useState<number>(0);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);

  // Cargar monedas al montar
  useEffect(() => {
    if (currencies.length === 0) {
      fetchCurrencies({ is_active: true });
    }
  }, []);

  // Calcular conversión cuando cambian los inputs
  useEffect(() => {
    if (!fromCurrencyId || !selectedCurrencyId || amount === 0) {
      setConvertedAmount(0);
      setExchangeRate(null);
      return;
    }

    const fromCurrency = currencies.find((c) => c.id === fromCurrencyId);
    const toCurrency = currencies.find((c) => c.id === selectedCurrencyId);

    if (!fromCurrency || !toCurrency) {
      return;
    }

    // Si es la misma moneda, no hay conversión
    if (fromCurrency.id === toCurrency.id) {
      setConvertedAmount(amount);
      setExchangeRate(1);
      if (onAmountChange) {
        onAmountChange(amount, selectedCurrencyId);
      }
      return;
    }

    // Obtener moneda base para el cálculo
    const baseCurrency = getBaseCurrency({ currencies });

    if (!baseCurrency) {
      console.warn('No hay moneda base configurada');
      return;
    }

    let rate = 1;
    let converted = amount;

    // Lógica de conversión vía moneda base
    const fromRate = parseFloat(fromCurrency.exchange_rate);
    const toRate = parseFloat(toCurrency.exchange_rate);
    const baseRate = parseFloat(baseCurrency.exchange_rate);

    if (baseCurrency.code === 'VES') {
      // VES es moneda base
      if (fromCurrency.code === 'VES') {
        // VES → Otra moneda
        rate = toRate > 0 ? 1 / toRate : 0;
        converted = amount * rate;
      } else if (toCurrency.code === 'VES') {
        // Otra moneda → VES
        rate = fromRate;
        converted = amount * rate;
      } else {
        // Otra moneda → Otra moneda (vía VES)
        const amountInVES = amount * fromRate;
        rate = toRate > 0 ? 1 / toRate : 0;
        converted = amountInVES * rate;
      }
    } else if (baseCurrency.code === 'USD') {
      // USD es moneda base
      if (fromCurrency.code === 'USD') {
        // USD → Otra moneda
        rate = toRate;
        converted = amount * rate;
      } else if (toCurrency.code === 'USD') {
        // Otra moneda → USD
        rate = fromRate > 0 ? 1 / fromRate : 0;
        converted = amount * rate;
      } else {
        // Otra moneda → Otra moneda (vía USD)
        const amountInUSD = amount / fromRate;
        rate = toRate;
        converted = amountInUSD * toRate;
      }
    } else {
      // Otra moneda base
      if (fromCurrency.code === 'USD') {
        // USD → Otra moneda
        converted = amount * (toRate / 34.5); // Usar tasa USD fija o configurable
        rate = toRate / 34.5;
      } else {
        // Para otras monedas, convertir vía USD
        const amountInUSD = fromCurrency.code === 'USD'
          ? amount
          : amount / fromRate;

        rate = toRate;
        converted = amountInUSD * toRate;
      }
    }

    setExchangeRate(rate);
    setConvertedAmount(converted);

    if (onAmountChange) {
      onAmountChange(converted, selectedCurrencyId);
    }
  }, [amount, fromCurrencyId, selectedCurrencyId, currencies]);

  const handleCurrencyChange = (currencyId: number) => {
    setSelectedCurrencyId(currencyId);
    if (onCurrencyChange) {
      onCurrencyChange(currencyId);
    }
  };

  const activeCurrencies = getActiveCurrencies({ currencies });
  const baseCurrency = getBaseCurrency({ currencies });
  const fromCurrency = currencies.find((c) => c.id === fromCurrencyId);
  const selectedCurrency = currencies.find((c) => c.id === selectedCurrencyId);

  // Filtrar monedas excluidas
  const availableCurrencies = activeCurrencies.filter(
    (c) => !excludeCurrencyIds.includes(c.id)
  );

  if (isLoading && currencies.length === 0) {
    return (
      <div className={`p-4 border border-gray-300 rounded-lg bg-gray-50 ${className}`}>
        <div className="flex items-center gap-2 text-gray-500">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="text-sm">Cargando monedas...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      <div className="flex items-center gap-3">
        {/* Monto original */}
        <div className="flex-1">
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Monto original</div>
            <div className="flex items-baseline gap-2">
              {fromCurrency && (
                <span className="text-2xl font-light text-gray-700">
                  {fromCurrency.symbol}
                </span>
              )}
              <span className="text-2xl font-semibold text-gray-900">
                {amount.toLocaleString('es-VE', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              {fromCurrency && (
                <span className="text-sm text-gray-500">{fromCurrency.code}</span>
              )}
            </div>
          </div>
        </div>

        {/* Flecha de conversión */}
        <div className="flex-shrink-0 pt-6">
          <ArrowRight className="w-6 h-6 text-gray-400" />
        </div>

        {/* Selector de moneda destino */}
        <div className="flex-1">
          <div className="relative">
            <select
              value={selectedCurrencyId || ''}
              onChange={(e) => handleCurrencyChange(parseInt(e.target.value))}
              disabled={disabled}
              className={`w-full px-3 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white ${
                disabled ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
            >
              <option value="">Seleccionar moneda...</option>
              {availableCurrencies.map((currency) => (
                <option key={currency.id} value={currency.id}>
                  {currency.code} - {currency.name}
                  {currency.is_base_currency && ' ⭐ BASE'}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <DollarSign className="w-5 h-5 text-gray-400" />
            </div>
          </div>

          {/* Monto convertido */}
          {selectedCurrency && convertedAmount > 0 && (
            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-xs text-green-600 mb-1">Monto convertido</div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-light text-green-700">
                  {selectedCurrency.symbol}
                </span>
                <span className="text-2xl font-semibold text-green-900">
                  {convertedAmount.toLocaleString('es-VE', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span className="text-sm text-green-600">{selectedCurrency.code}</span>
              </div>

              {exchangeRate && exchangeRate !== 1 && showConversionDetails && (
                <div className="mt-2 pt-2 border-t border-green-200">
                  <div className="flex items-center gap-1 text-xs text-green-700">
                    <TrendingUp className="w-3 h-3" />
                    <span>Tasa: {exchangeRate.toFixed(6)}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Información adicional */}
      {selectedCurrency && fromCurrency && showConversionDetails && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 text-sm text-blue-700">
              <div className="font-medium mb-1">Conversión aplicada:</div>
              <div className="space-y-1 text-xs">
                <div>
                  <span className="font-medium">Origen:</span> {amount} {fromCurrency.code}
                  {fromCurrency.is_base_currency && ' (moneda base)'}
                </div>
                <div>
                  <span className="font-medium">Destino:</span> {convertedAmount.toFixed(2)} {selectedCurrency.code}
                  {selectedCurrency.is_base_currency && ' (moneda base)'}
                </div>
                {exchangeRate && exchangeRate !== 1 && (
                  <div>
                    <span className="font-medium">Tasa utilizada:</span> {exchangeRate.toFixed(6)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrencyConverterSelector;
