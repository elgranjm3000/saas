'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowRightLeft,
  Calculator,
  Loader2,
  AlertCircle,
  Info,
  TrendingUp,
} from 'lucide-react';
import { useCurrencyStore, getActiveCurrencies } from '@/store/currency-store';
import type { CurrencyConversion } from '@/types/currency';

export const CurrencyConverter: React.FC = () => {
  const { currencies, convertCurrency, isConverting, error, clearError, fetchConversionFactors, conversionFactors } =
    useCurrencyStore();

  const [fromAmount, setFromAmount] = useState<number>(1);
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('VES');
  const [result, setResult] = useState<CurrencyConversion | null>(null);
  const [swapped, setSwapped] = useState(false);

  const activeCurrencies = getActiveCurrencies({ currencies });

  useEffect(() => {
    fetchConversionFactors();
  }, [fetchConversionFactors]);

  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleConvert = async () => {
    clearError();
    try {
      const conversion = await convertCurrency(fromCurrency, toCurrency, fromAmount);
      setResult(conversion);
      setSwapped(false);
    } catch (err) {
      setResult(null);
    }
  };

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setSwapped(true);
    setResult(null);
  };

  const getRateDisplay = () => {
    if (!result) return null;
    const { rate_metadata } = result;
    return (
      <div className="text-center text-sm text-gray-600 mb-3">
        <p className="font-medium">Tasa utilizada: {rate_metadata.rate.toFixed(6)}</p>
        <p className="text-xs text-gray-500">
          Método: {rate_metadata.method} | Origen: {rate_metadata.source}
          {rate_metadata.last_update && ` | Actualizado: ${new Date(rate_metadata.last_update).toLocaleDateString()}`}
        </p>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <Calculator className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold">Conversor de Monedas</h2>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {/* Moneda Origen */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            De
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="number"
              min="0"
              step="0.01"
              value={fromAmount}
              onChange={(e) => setFromAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-mono"
              placeholder="1.00"
            />
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {activeCurrencies.map((currency) => (
                <option key={currency.id} value={currency.code}>
                  {currency.code} - {currency.name} ({currency.symbol})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Botón de intercambio */}
        <div className="flex justify-center">
          <button
            onClick={handleSwap}
            className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
            title="Intercambiar monedas"
          >
            <ArrowRightLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Moneda Destino */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            A
          </label>
          <select
            value={toCurrency}
            onChange={(e) => setToCurrency(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {activeCurrencies.map((currency) => (
              <option key={currency.id} value={currency.code}>
                {currency.code} - {currency.name} ({currency.symbol})
              </option>
            ))}
          </select>
        </div>

        {/* Botón de convertir */}
        <button
          onClick={handleConvert}
          disabled={isConverting || fromAmount <= 0}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isConverting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Convirtiendo...
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4" />
              Convertir
            </>
          )}
        </button>

        {/* Resultado */}
        {result && !swapped && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              Resultado
            </h3>

            {getRateDisplay()}

            <div className="text-center py-4">
              <p className="text-3xl font-mono font-bold text-green-900">
                {result.converted_amount.toFixed(2)} {result.target_currency}
              </p>
              <p className="text-sm text-green-700 mt-2">
                {result.original_amount.toFixed(2)} {result.original_currency} =
                {' '}
                <span className="font-semibold">
                  {result.converted_amount.toFixed(2)} {result.target_currency}
                </span>
              </p>
            </div>

            {/* Información adicional */}
            <div className="mt-4 pt-4 border-t border-green-200">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-green-700">
                  <p className="font-medium mb-1">Detalles de la conversión:</p>
                  <ul className="space-y-1">
                    <li>• Factor de conversión: {result.rate_metadata.decimal_places} decimales</li>
                    <li>• ID de moneda: {result.rate_metadata.currency_id}</li>
                    <li>• Método: {result.conversion_method}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabla de Factores de Conversión */}
        {conversionFactors.length > 0 && (
          <div className="mt-6 border-t border-gray-200 pt-6">
            <h3 className="text-md font-semibold text-gray-900 mb-3">
              Factores de Conversión Disponibles
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">
                      Moneda
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">
                      Tasa
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">
                      Método
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">
                      Factor
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">
                      IGTF
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {conversionFactors.map((factor, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2">
                        <span className="font-mono font-semibold">{factor.code}</span>
                        <span className="text-gray-500 ml-1">{factor.symbol}</span>
                      </td>
                      <td className="px-3 py-2 font-mono">
                        {factor.exchange_rate.toFixed(4)}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          factor.conversion_method === 'direct' ? 'bg-blue-100 text-blue-800' :
                          factor.conversion_method === 'inverse' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {factor.conversion_method || 'undefined'}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono">
                        {factor.conversion_factor ? factor.conversion_factor.toFixed(6) : '-'}
                      </td>
                      <td className="px-3 py-2">
                        {factor.applies_igtf ? (
                          <span className="text-orange-600 font-medium">
                            {factor.igtf_rate}%
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
