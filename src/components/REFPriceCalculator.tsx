'use client';

import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Calculator } from 'lucide-react';
import { ratesAPI } from '@/lib/api';

interface REFPriceCalculatorProps {
  priceUSD: string;
  onPriceChange?: (priceVES: number, exchangeRate: number) => void;
  className?: string;
  showLabel?: boolean;
}

export const REFPriceCalculator: React.FC<REFPriceCalculatorProps> = ({
  priceUSD,
  onPriceChange,
  className = '',
  showLabel = true
}) => {
  const [priceVES, setPriceVES] = useState<number | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!priceUSD || parseFloat(priceUSD) <= 0) {
      setPriceVES(null);
      setExchangeRate(null);
      return;
    }

    const calculatePrice = async () => {
      try {
        setLoading(true);
        setError(null);

        // Obtener tasa BCV del día
        const rateResponse = await ratesAPI.getTodayRate('USD', 'VES');

        if (!rateResponse.data || !rateResponse.data.rate) {
          throw new Error('No hay tasa disponible');
        }

        const rate = rateResponse.data.rate;
        const usdPrice = parseFloat(priceUSD);
        const vesPrice = usdPrice * rate;

        setExchangeRate(rate);
        setPriceVES(vesPrice);

        // Notificar al componente padre
        if (onPriceChange) {
          onPriceChange(vesPrice, rate);
        }
      } catch (err: any) {
        console.error('Error calculating price:', err);
        setError('Error al calcular precio VES');
      } finally {
        setLoading(false);
      }
    };

    calculatePrice();
  }, [priceUSD]);

  if (!priceUSD || parseFloat(priceUSD) <= 0) {
    return null;
  }

  return (
    <div className={`bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 ${className}`}>
      {showLabel && (
        <div className="flex items-center space-x-2 mb-2">
          <Calculator className="w-4 h-4 text-green-600" />
          <span className="text-sm font-semibold text-green-800">
            Precio Calculado en VES
          </span>
        </div>
      )}

      <div className="space-y-2">
        {loading && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Calculando...</span>
          </div>
        )}

        {!loading && error && (
          <div className="text-sm text-red-600">
            ⚠️ {error}
          </div>
        )}

        {!loading && priceVES !== null && exchangeRate !== null && (
          <>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Tasa BCV:</span>
              <span className="font-mono font-semibold text-gray-900">
                {exchangeRate.toFixed(2)} Bs/USD
              </span>
            </div>

            <div className="flex justify-between items-center bg-white rounded-lg p-3">
              <span className="text-sm text-gray-600">Precio VES:</span>
              <span className="font-mono font-bold text-xl text-green-600">
                Bs. {priceVES.toLocaleString('es-VE', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </span>
            </div>

            {exchangeRate > 0 && (
              <div className="text-xs text-gray-500 text-center pt-1">
                1 USD = {exchangeRate.toFixed(2)} VES
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default REFPriceCalculator;
