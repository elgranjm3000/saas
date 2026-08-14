'use client';

import React, { useState, useEffect } from 'react';
import {
  Calculator,
  Receipt,
  AlertTriangle,
  Info,
  Loader2,
  CreditCard,
  Wallet,
  Building,
} from 'lucide-react';
import { useCurrencyStore, getIGTFCurrencies } from '@/store/currency-store';
import type { IGTFResult } from '@/types/currency';

export const IGTFCalculator: React.FC = () => {
  const { currencies, calculateIGTF, isLoading, error, clearError } =
    useCurrencyStore();

  const [amount, setAmount] = useState<number>(100);
  const [currencyId, setCurrencyId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('transfer');
  const [result, setResult] = useState<IGTFResult | null>(null);

  const igtfCurrencies = getIGTFCurrencies({ currencies });

  useEffect(() => {
    if (igtfCurrencies.length > 0 && !currencyId) {
      setCurrencyId(igtfCurrencies[0].id);
    }
  }, [igtfCurrencies, currencyId]);

  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleCalculate = async () => {
    if (!currencyId) return;

    clearError();
    try {
      const igtfResult = await calculateIGTF(amount, currencyId, paymentMethod);
      setResult(igtfResult);
    } catch (err) {
      setResult(null);
    }
  };

  const selectedCurrency = igtfCurrencies.find((c) => c.id === currencyId);

  const getPaymentMethodIcon = () => {
    switch (paymentMethod) {
      case 'transfer':
        return <Building className="w-5 h-5" />;
      case 'cash':
        return <Wallet className="w-5 h-5" />;
      case 'card':
        return <CreditCard className="w-5 h-5" />;
      default:
        return <Receipt className="w-5 h-5" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <Calculator className="w-6 h-6 text-orange-600" />
        <h2 className="text-xl font-semibold">Calculadora IGTF</h2>
      </div>

      {/* Información sobre IGTF */}
      <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-orange-800">
            <p className="font-semibold mb-1">
              Impuesto a Grandes Transacciones Financieras
            </p>
            <p className="text-orange-700">
              El IGTF es un impuesto venezolano (3% típico) que se aplica a
              pagos en moneda extranjera o en divisas. Seleccione una moneda y
              monto para calcular el IGTF aplicable.
            </p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {igtfCurrencies.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium">
            No hay monedas configuradas con IGTF
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Configure al menos una moneda con IGTF para usar esta calculadora
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Moneda */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Moneda
            </label>
            <select
              value={currencyId || ''}
              onChange={(e) => setCurrencyId(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              {igtfCurrencies.map((currency) => (
                <option key={currency.id} value={currency.id}>
                  {currency.code} - {currency.name} ({currency.symbol}) - Tasa
                  IGTF: {currency.igtf_rate}%
                </option>
              ))}
            </select>
            {selectedCurrency && selectedCurrency.igtf_min_amount && (
              <p className="text-xs text-gray-500 mt-1">
                Monto mínimo para IGTF:{' '}
                {selectedCurrency.igtf_min_amount} {selectedCurrency.code}
              </p>
            )}
          </div>

          {/* Monto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monto de la Transacción *
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-lg font-mono"
                placeholder="100.00"
              />
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-mono">
                {selectedCurrency?.symbol || '$'}
              </span>
            </div>
          </div>

          {/* Método de Pago */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Método de Pago
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'transfer', label: 'Transferencia' },
                { value: 'card', label: 'Tarjeta' },
                { value: 'cash', label: 'Efectivo' },
              ].map((method) => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setPaymentMethod(method.value)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    paymentMethod === method.value
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    {getPaymentMethodIcon()}
                    <span className="text-xs font-medium">
                      {method.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Botón de calcular */}
          <button
            onClick={handleCalculate}
            disabled={isLoading || !currencyId || amount <= 0}
            className="w-full px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Calculando...
              </>
            ) : (
              <>
                <Receipt className="w-4 h-4" />
                Calcular IGTF
              </>
            )}
          </button>

          {/* Resultado */}
          {result && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-lg font-semibold text-green-900 mb-3">
                Desglose del Pago
              </h3>

              <div className="space-y-3">
                {/* Monto Original */}
                <div className="flex justify-between items-center py-2 border-b border-green-200">
                  <span className="text-gray-700">Monto Original</span>
                  <span className="text-lg font-mono font-semibold">
                    {result.original_amount.toFixed(2)}{' '}
                    {result.metadata.currency_code}
                  </span>
                </div>

                {/* IGTF */}
                {result.igtf_applied ? (
                  <div className="flex justify-between items-center py-2 border-b border-green-200">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                      <span className="text-gray-700">IGTF ({result.metadata.rate}%)</span>
                    </div>
                    <span className="text-lg font-mono font-semibold text-orange-600">
                      +{result.igtf_amount.toFixed(2)}{' '}
                      {result.metadata.currency_code}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between py-2 border-b border-green-200">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Info className="w-4 h-4" />
                      <span>{result.metadata.reason}</span>
                    </div>
                  </div>
                )}

                {/* Total */}
                <div className="flex justify-between items-center py-3 bg-green-100 rounded-lg px-3">
                  <span className="text-md font-semibold text-green-900">
                    Total a Pagar
                  </span>
                  <span className="text-2xl font-mono font-bold text-green-900">
                    {result.total_with_igtf.toFixed(2)}{' '}
                    {result.metadata.currency_code}
                  </span>
                </div>
              </div>

              {/* Información adicional */}
              <div className="mt-4 pt-4 border-t border-green-200">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-green-700">
                    <p className="font-medium mb-1">
                      {result.igtf_applied
                        ? 'IGTF Aplicado'
                        : 'IGTF No Aplicable'}
                    </p>
                    {result.metadata.igtf_config_id && (
                      <p className="text-green-600">
                        Config ID: #{result.metadata.igtf_config_id}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Información sobre monedas exentas */}
          {selectedCurrency?.igtf_exempt && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-700">
                  Esta moneda está configurada como <strong>exenta de IGTF</strong>{' '}
                  por defecto, aunque esto puede variar según el método de pago
                  y monto de la transacción.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
