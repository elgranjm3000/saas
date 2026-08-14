'use client'
import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, AlertCircle } from 'lucide-react';
import { useCurrencyStore } from '@/store/currency-store';
import type { Currency } from '@/types/currency';

export const ExchangeRateWidget: React.FC = () => {
  const { currencies, fetchCurrencies, isLoading } = useCurrencyStore();
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCurrencies({ is_active: true });
  }, [fetchCurrencies]);

  const baseCurrency = currencies.find(c => c.is_base_currency);
  const foreignCurrencies = currencies.filter(c => !c.is_base_currency && c.is_active);

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

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchCurrencies({ is_active: true });
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error refreshing rates:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getTimeSinceUpdate = () => {
    const now = new Date();
    const diff = now.getTime() - lastUpdate.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Ahora mismo';
    if (minutes < 60) return `Hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours}h`;
    return lastUpdate.toLocaleDateString('es-VE');
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-light text-gray-900">Tasas de Cambio</h3>
            <p className="text-sm text-gray-500 mt-1">
              {baseCurrency ? `Moneda base: ${baseCurrency.code}` : 'Cargando...'}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
            title="Actualizar tasas"
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : foreignCurrencies.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No hay divisas configuradas</p>
          </div>
        ) : (
          <div className="space-y-4">
            {foreignCurrencies.map((currency) => (
              <div
                key={currency.id}
                className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <span className="text-3xl">{getCurrencyFlag(currency.code)}</span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-semibold text-gray-900">{currency.code}</p>
                      {currency.rate_update_method === 'api_bcv' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                          BCV
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{currency.name}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xl font-light text-gray-900">
                    {parseFloat(currency.exchange_rate).toFixed(4)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    por {baseCurrency?.code || 'VES'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Última actualización: {getTimeSinceUpdate()}</span>
            {foreignCurrencies.some(c => c.rate_update_method === 'api_bcv') && (
              <span className="flex items-center text-blue-600">
                <RefreshCw className="w-3 h-3 mr-1" />
                Actualización BCV automática
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
