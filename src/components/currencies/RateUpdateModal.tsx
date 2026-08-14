'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Calendar,
  User,
  FileText,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { useCurrencyStore } from '@/store/currency-store';
import type { CurrencyRateUpdateForm } from '@/types/currency';

interface RateUpdateModalProps {
  currencyId: number;
  currencyCode: string;
  currentRate: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RateUpdateModal: React.FC<RateUpdateModalProps> = ({
  currencyId,
  currencyCode,
  currentRate,
  onClose,
  onSuccess,
}) => {
  const { updateCurrencyRate, isUpdatingRate, error, clearError } =
    useCurrencyStore();

  const [formData, setFormData] = useState<CurrencyRateUpdateForm>({
    new_rate: '',
    change_reason: '',
    change_type: 'manual',
    change_source: 'user_admin',
  });

  const [previewDifference, setPreviewDifference] = useState<number | null>(
    null
  );
  const [previewPercent, setPreviewPercent] = useState<number | null>(null);

  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    if (formData.new_rate) {
      const oldRate = parseFloat(currentRate);
      const newRate = parseFloat(formData.new_rate);
      const diff = newRate - oldRate;
      const percent = oldRate !== 0 ? (diff / oldRate) * 100 : 0;

      setPreviewDifference(diff);
      setPreviewPercent(percent);
    } else {
      setPreviewDifference(null);
      setPreviewPercent(null);
    }
  }, [formData.new_rate, currentRate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await updateCurrencyRate(currencyId, formData);
      onSuccess?.();
      onClose();
    } catch (err) {
      // Error handled by store
    }
  };

  const getVariationColor = () => {
    if (!previewDifference) return 'text-gray-600';
    if (previewDifference > 0) return 'text-green-600';
    if (previewDifference < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getVariationIcon = () => {
    if (!previewDifference) return null;
    if (previewDifference > 0) return '↑';
    if (previewDifference < 0) return '↓';
    return '=';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold">Actualizar Tasa de Cambio</h2>
                <p className="text-sm text-gray-500">
                  Moneda: <span className="font-mono font-bold">{currencyCode}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Error Display */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Current Rate */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Tasa Actual</p>
            <p className="text-2xl font-mono font-bold text-gray-900">
              {currentRate}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nueva Tasa */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nueva Tasa de Cambio * (hasta 10 decimales)
              </label>
              <input
                type="text"
                inputMode="decimal"
                required
                value={formData.new_rate}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\d*\.?\d{0,10}$/.test(value) || value === '') {
                    setFormData({ ...formData, new_rate: value });
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-lg"
                placeholder="36.50"
                autoFocus
              />

              {/* Preview de la diferencia */}
              {previewDifference !== null && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Diferencia</p>
                      <p className={`font-semibold ${getVariationColor()}`}>
                        {getVariationIcon()} {Math.abs(previewDifference).toFixed(10)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Variación %</p>
                      <p className={`font-semibold ${getVariationColor()}`}>
                        {getVariationIcon()}{' '}
                        {Math.abs(previewPercent || 0).toFixed(4)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tipo de Cambio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Actualización
              </label>
              <select
                value={formData.change_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    change_type: e.target.value as any,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="manual">Manual (usuario)</option>
                <option value="automatic_api">API Automática</option>
                <option value="scheduled">Programada</option>
                <option value="correction">Corrección</option>
              </select>
            </div>

            {/* Origen del Cambio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Origen
              </label>
              <input
                type="text"
                value={formData.change_source}
                onChange={(e) =>
                  setFormData({ ...formData, change_source: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="user_admin, api_bcv, etc."
              />
            </div>

            {/* Razón del Cambio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Razón del Cambio
              </label>
              <textarea
                value={formData.change_reason}
                onChange={(e) =>
                  setFormData({ ...formData, change_reason: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Explica por qué se actualiza la tasa..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Esta información quedará registrada en el historial
              </p>
            </div>

            {/* Información sobre el historial */}
            <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-green-700">
                <p className="font-semibold mb-1">Registro Automático</p>
                <p>
                  Esta actualización creará automáticamente un registro en el
                  historial con la tasa anterior, la nueva, diferencia,
                  variación porcentual, usuario, fecha y razón.
                </p>
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isUpdatingRate || !formData.new_rate}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUpdatingRate ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Actualizar Tasa
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
