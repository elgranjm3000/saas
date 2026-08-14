'use client';

import React, { useState, useEffect } from 'react';
import { ratesAPI } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';

interface BCVRate {
  rate: number;
  rate_date: string;
  source: string;
  inverse_rate: number;
}

interface BCVRateWidgetProps {
  fromCurrency?: string;
  toCurrency?: string;
  onRateChange?: (rate: BCVRate) => void;
  className?: string;
}

export const BCVRateWidget: React.FC<BCVRateWidgetProps> = ({
  fromCurrency = 'USD',
  toCurrency = 'VES',
  onRateChange,
  className = '',
}) => {
  const { token, isAuthenticated } = useAuthStore();
  const [rate, setRate] = useState<BCVRate | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRate = async () => {
    // Verificar autenticación antes de hacer el request
    console.log('🔍 BCVRateWidget: isAuthenticated=', isAuthenticated, 'token=', token ? 'exists' : 'missing');

    if (!isAuthenticated || !token) {
      console.warn('⚠️ BCVRateWidget: User not authenticated, skipping fetch');
      setError('Debes iniciar sesión para ver las tasas');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('🔄 BCVRateWidget: Fetching rate...', { fromCurrency, toCurrency });
      const response = await ratesAPI.getTodayRate(fromCurrency, toCurrency);
      console.log('✅ BCVRateWidget: Rate fetched successfully', response.data);
      setRate(response.data);
      onRateChange?.(response.data);
    } catch (err: any) {
      console.error('❌ BCVRateWidget: Error fetching rate', err);
      console.error('❌ Error status:', err.response?.status);
      console.error('❌ Error data:', err.response?.data);
      console.error('❌ Full error:', JSON.stringify(err, null, 2));
      const errorMsg = err.response?.data?.message || err.message || 'Error al cargar tasa BCV';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const syncBCV = async () => {
    try {
      setSyncing(true);
      setError(null);
      await ratesAPI.syncBCVRates(true);
      // Recargar la tasa después de sincronizar
      await fetchRate();
    } catch (err: any) {
      console.error('Error syncing BCV:', err);
      setError(err.response?.data?.message || 'Error al sincronizar BCV');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchRate();
    }
    // Recargar cada 5 minutos
    const interval = setInterval(() => {
      if (isAuthenticated && token) {
        fetchRate();
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fromCurrency, toCurrency, isAuthenticated, token]);

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error && !rate) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-red-800 font-medium">Error al cargar tasa BCV</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
          <button
            onClick={fetchRate}
            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const isStale = rate ? new Date(rate.rate_date) < new Date(Date.now() - 24 * 60 * 60 * 1000) : false;

  return (
    <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800">
          Tasa BCV {fromCurrency} → {toCurrency}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={fetchRate}
            disabled={loading}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition disabled:opacity-50"
            title="Recargar tasa"
          >
            🔄
          </button>
          <button
            onClick={syncBCV}
            disabled={syncing}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
            title="Sincronizar con BCV"
          >
            {syncing ? '⏳' : '🔄'} Sincronizar
          </button>
        </div>
      </div>

      {rate && (
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-gray-600">Tasa:</span>
            <span className="text-3xl font-bold text-gray-900">
              {rate.rate.toFixed(2)} {toCurrency}/{fromCurrency}
            </span>
          </div>

          <div className="flex items-baseline justify-between text-sm">
            <span className="text-gray-600">Inversa:</span>
            <span className="text-gray-700">
              {rate.inverse_rate.toFixed(6)} {fromCurrency}/{toCurrency}
            </span>
          </div>

          <div className="flex items-baseline justify-between text-sm">
            <span className="text-gray-600">Fecha:</span>
            <span className={`font-medium ${isStale ? 'text-orange-600' : 'text-gray-700'}`}>
              {new Date(rate.rate_date).toLocaleDateString('es-VE', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
              {isStale && ' ⚠️'}
            </span>
          </div>

          <div className="flex items-baseline justify-between text-sm">
            <span className="text-gray-600">Fuente:</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              rate.source === 'BCV'
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {rate.source}
            </span>
          </div>

          {error && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
              ⚠️ {error}
            </div>
          )}

          {isStale && (
            <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-sm text-orange-800">
              ⚠️ La tasa tiene más de 24 horas. Considera sincronizar con BCV.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BCVRateWidget;
