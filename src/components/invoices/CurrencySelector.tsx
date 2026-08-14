'use client'
import React, { useEffect, useState } from 'react';
import { ChevronDown, DollarSign, Info, CheckCircle } from 'lucide-react';
import { useCurrencyStore } from '@/store/currency-store';
import type { Currency } from '@/types/currency';

interface CurrencySelectorProps {
  value: number | null;
  onChange: (currencyId: number) => void;
  disabled?: boolean;
  error?: string;
  showIGTFInfo?: boolean;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  value,
  onChange,
  disabled = false,
  error,
  showIGTFInfo = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { currencies, fetchCurrencies } = useCurrencyStore();
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);

  useEffect(() => {
    fetchCurrencies({ is_active: true });
  }, [fetchCurrencies]);

  useEffect(() => {
    if (value && currencies.length > 0) {
      const currency = currencies.find(c => c.id === value);
      setSelectedCurrency(currency || null);
    }
  }, [value, currencies]);

  const selected = currencies.find(c => c.id === value);

  const getCurrencyFlag = (code: string) => {
    const flags: Record<string, string> = {
      'VES': '🇻🇪',
      'USD': '🇺🇸',
      'EUR': '🇪🇺',
      'COP': '🇨🇴',
      'PTR': '🇵🇹'
    };
    return flags[code] || '💱';
  };

  const getCurrencyBadgeColor = (currency: Currency) => {
    if (currency.is_base_currency) return 'bg-green-100 text-green-700 border-green-200';
    if (currency.applies_igtf) return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Moneda *
        {showIGTFInfo && selected?.applies_igtf && (
          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700">
            <Info className="w-3 h-3 mr-1" />
            IGTF {selected.igtf_rate}%
          </span>
        )}
      </label>

      {/* Selector Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-4 py-3 text-left bg-gray-50/80 border rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all outline-none flex items-center justify-between ${
          error ? 'border-red-300' : 'border-gray-200/60 focus:border-blue-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
      >
        <div className="flex items-center space-x-3">
          {selected ? (
            <>
              <span className="text-2xl">{getCurrencyFlag(selected.code)}</span>
              <div>
                <p className="font-medium text-gray-900">{selected.code}</p>
                <div className="flex items-center space-x-2">
                  <p className="text-xs text-gray-500">{selected.name}</p>
                  {selected.is_base_currency && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                      Base
                    </span>
                  )}
                </div>
              </div>
            </>
          ) : (
            <span className="text-gray-400">Seleccionar moneda...</span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-lg z-20 max-h-80 overflow-y-auto">
          {currencies.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No hay monedas configuradas
            </div>
          ) : (
            currencies.map((currency) => (
              <button
                key={currency.id}
                type="button"
                onClick={() => {
                  onChange(currency.id);
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getCurrencyFlag(currency.code)}</span>
                    <div>
                      <p className="font-medium text-gray-900">{currency.code}</p>
                      <p className="text-xs text-gray-500">{currency.name}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-1">
                    {/* Tasa de cambio */}
                    {!currency.is_base_currency && (
                      <span className="text-xs text-gray-500">
                        Tasa: {parseFloat(currency.exchange_rate).toFixed(2)}
                      </span>
                    )}

                    {/* Badges */}
                    <div className="flex items-center space-x-1">
                      {currency.is_base_currency && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Base
                        </span>
                      )}
                      {currency.applies_igtf && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
                          IGTF {currency.igtf_rate}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Info de actualización */}
                {currency.rate_update_method === 'api_bcv' && currency.last_rate_update && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-400">
                      Actualizado: {new Date(currency.last_rate_update).toLocaleDateString('es-VE')}
                    </p>
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      {/* IGTF Info Panel */}
      {selected?.applies_igtf && showIGTFInfo && (
        <div className="mt-3 p-3 bg-orange-50/80 border border-orange-200 rounded-xl">
          <div className="flex items-start space-x-2">
            <Info className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-orange-900">
                Esta moneda aplica IGTF ({selected.igtf_rate}%)
              </p>
              <p className="text-xs text-orange-700 mt-1">
                El Impuesto a Grandes Transacciones Financieras se calculará automáticamente sobre el subtotal.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
