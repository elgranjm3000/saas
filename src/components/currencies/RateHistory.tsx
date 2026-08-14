'use client';

import React, { useEffect } from 'react';
import {
  History,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  User,
  FileText,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useCurrencyStore } from '@/store/currency-store';
import type { CurrencyRateHistory as RateHistory } from '@/types/currency';

interface RateHistoryProps {
  currencyId: number;
  currencyCode: string;
}

export const RateHistory: React.FC<RateHistoryProps> = ({
  currencyId,
  currencyCode,
}) => {
  const { rateHistory, fetchRateHistory, isLoading, error } =
    useCurrencyStore();

  useEffect(() => {
    fetchRateHistory(currencyId);
  }, [currencyId, fetchRateHistory]);

  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case 'manual':
        return 'bg-blue-100 text-blue-800';
      case 'automatic_api':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-purple-100 text-purple-800';
      case 'correction':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-VE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12 gap-2">
        <AlertCircle className="w-5 h-5 text-red-500" />
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (rateHistory.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <History className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>No hay historial de cambios para esta moneda</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold">
            Historial de Cambios - {currencyCode}
          </h3>
        </div>
        <span className="text-sm text-gray-500">
          {rateHistory.length} registro{rateHistory.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Historial */}
      <div className="space-y-3">
        {rateHistory.map((record: RateHistory) => {
          const oldRate = parseFloat(record.old_rate);
          const newRate = parseFloat(record.new_rate);
          const diff = newRate - oldRate;
          const isIncrease = diff > 0;
          const isDecrease = diff < 0;
          const isSame = diff === 0;

          return (
            <div
              key={record.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              {/* Fecha y Tipo de Cambio */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">
                    {formatDateTime(record.changed_at)}
                  </span>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getChangeTypeColor(
                    record.change_type
                  )}`}
                >
                  {record.change_type === 'manual' && 'Manual'}
                  {record.change_type === 'automatic_api' && 'API Automática'}
                  {record.change_type === 'scheduled' && 'Programado'}
                  {record.change_type === 'correction' && 'Corrección'}
                </span>
              </div>

              {/* Tasas */}
              <div className="grid grid-cols-3 gap-4 mb-3">
                {/* Tasa Anterior */}
                <div>
                  <p className="text-xs text-gray-500 mb-1">Tasa Anterior</p>
                  <p className="text-lg font-mono font-semibold text-gray-700">
                    {oldRate.toFixed(4)}
                  </p>
                </div>

                {/* Flecha de cambio */}
                <div className="flex items-center justify-center">
                  {isIncrease && (
                    <div className="flex flex-col items-center text-green-600">
                      <TrendingUp className="w-5 h-5" />
                      <span className="text-xs font-medium mt-1">
                        +{Math.abs(diff).toFixed(4)}
                      </span>
                    </div>
                  )}
                  {isDecrease && (
                    <div className="flex flex-col items-center text-red-600">
                      <TrendingDown className="w-5 h-5" />
                      <span className="text-xs font-medium mt-1">
                        -{Math.abs(diff).toFixed(4)}
                      </span>
                    </div>
                  )}
                  {isSame && (
                    <div className="flex flex-col items-center text-gray-400">
                      <Minus className="w-5 h-5" />
                      <span className="text-xs font-medium mt-1">
                        Sin cambio
                      </span>
                    </div>
                  )}
                </div>

                {/* Nueva Tasa */}
                <div>
                  <p className="text-xs text-gray-500 mb-1">Nueva Tasa</p>
                  <p className="text-lg font-mono font-semibold text-gray-900">
                    {newRate.toFixed(4)}
                  </p>
                </div>
              </div>

              {/* Variación Porcentual */}
              {record.rate_variation_percent && (
                <div className="mb-3 p-2 bg-gray-50 rounded">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">
                      Variación Porcentual
                    </span>
                    <span
                      className={`text-sm font-semibold ${
                        isIncrease
                          ? 'text-green-600'
                          : isDecrease
                          ? 'text-red-600'
                          : 'text-gray-600'
                      }`}
                    >
                      {isIncrease && '+'}
                      {parseFloat(record.rate_variation_percent).toFixed(4)}%
                    </span>
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-3 text-xs text-gray-600 border-t border-gray-100 pt-3">
                {/* Usuario */}
                {record.changed_by && (
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>Usuario ID: {record.changed_by}</span>
                  </div>
                )}

                {/* Origen */}
                {record.change_source && (
                  <div className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    <span>Origen: {record.change_source}</span>
                  </div>
                )}
              </div>

              {/* Razón */}
              {record.change_reason && (
                <div className="mt-3 p-2 bg-blue-50 rounded text-sm text-blue-700">
                  <span className="font-medium">Razón:</span>{' '}
                  {record.change_reason}
                </div>
              )}

              {/* Provider Metadata */}
              {record.provider_metadata && (
                <details className="mt-2">
                  <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                    Ver metadata del proveedor
                  </summary>
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                    {JSON.stringify(record.provider_metadata, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
