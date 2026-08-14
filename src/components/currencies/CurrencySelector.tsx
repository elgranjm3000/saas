'use client';

import React, { useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Loader2,
  Info,
} from 'lucide-react';
import { useCurrencyStore, getActiveCurrencies } from '@/store/currency-store';

interface CurrencySelectorProps {
  value: number;
  onChange: (currencyId: number) => void;
  disabled?: boolean;
  showRate?: boolean;
  showIGTF?: boolean;
  label?: string;
  excludeBaseCurrency?: boolean;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  value,
  onChange,
  disabled = false,
  showRate = true,
  showIGTF = false,
  label = 'Moneda',
  excludeBaseCurrency = false,
}) => {
  const { currencies, isLoading, fetchCurrencies } = useCurrencyStore();

  const activeCurrencies = getActiveCurrencies({ currencies });
  const baseCurrency = activeCurrencies.find((c) => c.is_base_currency);

  let availableCurrencies = activeCurrencies;
  if (excludeBaseCurrency && baseCurrency) {
    availableCurrencies = activeCurrencies.filter((c) => c.id !== baseCurrency.id);
  }

  useEffect(() => {
    if (currencies.length === 0) {
      fetchCurrencies({ is_active: true });
    }
  }, []);

  const selectedCurrency = activeCurrencies.find((c) => c.id === value);

  if (isLoading && currencies.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        <span className="text-sm text-gray-500">Cargando monedas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      {/* Selector */}
      <div className="relative">
        <select
          value={value || ''}
          onChange={(e) => onChange(parseInt(e.target.value))}
          disabled={disabled}
          className={`w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white ${
            disabled ? 'bg-gray-100 cursor-not-allowed' : ''
          }`}
        >
          <option value="">Seleccionar moneda...</option>
          {availableCurrencies.map((currency) => (
            <option key={currency.id} value={currency.id}>
              {currency.code} - {currency.name} ({currency.symbol})
              {currency.is_base_currency && ' [BASE]'}
              {showIGTF && currency.applies_igtf && ` [IGTF ${currency.igtf_rate}%]`}
            </option>
          ))}
        </select>

        {/* Icono personalizado */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <DollarSign className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Información de la moneda seleccionada */}
      {selectedCurrency && showRate && (
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 text-sm text-blue-700">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-medium">Tasa:</span>{' '}
                  <span className="font-mono">
                    {parseFloat(selectedCurrency.exchange_rate).toFixed(4)}
                  </span>
                </div>
                {selectedCurrency.conversion_factor && (
                  <div>
                    <span className="font-medium">Factor:</span>{' '}
                    <span className="font-mono">
                      {parseFloat(selectedCurrency.conversion_factor).toFixed(6)}
                    </span>
                  </div>
                )}
                {selectedCurrency.is_base_currency && (
                  <div className="col-span-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Moneda Base
                    </span>
                  </div>
                )}
              </div>

              {/* Información de IGTF */}
              {showIGTF && selectedCurrency.applies_igtf && (
                <div className="mt-2 pt-2 border-t border-blue-200">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-3 h-3 text-orange-600" />
                    <span className="text-orange-700 font-medium">
                      IGTF: {selectedCurrency.igtf_rate}%
                    </span>
                    {selectedCurrency.igtf_exempt && (
                      <span className="text-xs text-gray-600">
                        (exenta por defecto)
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Última actualización */}
              {selectedCurrency.last_rate_update && (
                <div className="mt-1 text-xs text-blue-600">
                  Actualizada:{' '}
                  {new Date(selectedCurrency.last_rate_update).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Alerta si no hay monedas */}
      {availableCurrencies.length === 0 && !isLoading && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-700">
            No hay monedas configuradas. Configure las monedas en{' '}
            <a href="/currencies" className="font-medium underline">
              Sistema de Monedas
            </a>
          </p>
        </div>
      )}
    </div>
  );
};

// ==================== COMPONENTE PARA ITEMS DE FACTURA/COMPRA ====================

interface InvoiceItemCurrencyProps {
  currencyId: number;
  amount: number;
  baseCurrencyId?: number;
}

export const InvoiceItemCurrencyDisplay: React.FC<InvoiceItemCurrencyProps> = ({
  currencyId,
  amount,
  baseCurrencyId,
}) => {
  const { currencies } = useCurrencyStore();

  const currency = currencies.find((c) => c.id === currencyId);
  const baseCurrency = currencies.find((c) => c.id === baseCurrencyId);

  if (!currency) {
    return (
      <span className="text-gray-500 italic">Moneda no encontrada</span>
    );
  }

  const exchangeRate = parseFloat(currency.exchange_rate);
  const displayAmount = parseFloat(amount.toString()).toFixed(2);

  // Calcular monto en moneda base si se proporciona
  let baseAmount = null;
  if (baseCurrency && currency.id !== baseCurrency.id) {
    const conversionFactor = currency.conversion_factor
      ? parseFloat(currency.conversion_factor)
      : null;
    if (conversionFactor) {
      baseAmount = (parseFloat(amount.toString()) * conversionFactor).toFixed(2);
    }
  }

  return (
    <div className="inline-flex items-center gap-2 px-2 py-1 bg-gray-50 rounded border border-gray-200">
      {/* Monto original */}
      <span className="font-mono font-semibold">
        {currency.symbol}
        {displayAmount}
      </span>

      {/* Código de moneda */}
      <span className="text-xs text-gray-500 font-medium">
        {currency.code}
      </span>

      {/* Tasa de cambio */}
      {exchangeRate > 0 && (
        <span className="text-xs text-gray-400">
          (@ {exchangeRate.toFixed(4)})
        </span>
      )}

      {/* Monto en moneda base */}
      {baseAmount && baseCurrency && (
        <span className="text-xs text-blue-600">
          ≈ {baseCurrency.symbol}
          {baseAmount} {baseCurrency.code}
        </span>
      )}
    </div>
  );
};
