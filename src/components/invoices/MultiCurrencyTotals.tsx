'use client'
import React, { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, AlertCircle, Info, RefreshCw } from 'lucide-react';
import { useCurrencyStore } from '@/store/currency-store';
import { formatCurrency } from '@/lib/utils';

interface InvoiceTotals {
  subtotal: number;
  taxableBase: number;
  exemptAmount: number;
  tax: number;
  total: number;
}

interface MultiCurrencyTotalsProps {
  totals: InvoiceTotals;
  currencyId: number | null;
  ivaPercentage: number;
  itemsCount: number;
}

export const MultiCurrencyTotals: React.FC<MultiCurrencyTotalsProps> = ({
  totals,
  currencyId,
  ivaPercentage,
  itemsCount
}) => {
  const { currencies, convertCurrency, calculateIGTF } = useCurrencyStore();
  const [igtfResult, setIGTFResult] = useState<{
    amount: number;
    applied: boolean;
    total: number;
    metadata: any;
  } | null>(null);
  const [convertedTotals, setConvertedTotals] = useState<{
    subtotalInVES: number;
    totalInVES: number;
    igtfInVES: number;
    exchangeRate: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedCurrency = currencies.find(c => c.id === currencyId);
  const baseCurrency = currencies.find(c => c.is_base_currency);
  const appliesIGTF = selectedCurrency?.applies_igtf && !selectedCurrency?.is_base_currency;

  // Calcular IGTF
  useEffect(() => {
    const calculateIGTFTax = async () => {
      if (!appliesIGTF || !currencyId || totals.subtotal === 0) {
        setIGTFResult(null);
        setConvertedTotals(null);
        return;
      }

      setLoading(true);
      try {
        // Calcular IGTF
        const igtf = await calculateIGTF(totals.subtotal, currencyId, 'transfer');

        setIGTFResult({
          amount: igtf.igtf_amount,
          applied: igtf.igtf_applied,
          total: igtf.total_with_igtf,
          metadata: igtf.metadata
        });

        // Convertir totales a VES
        if (selectedCurrency && baseCurrency && selectedCurrency.code !== baseCurrency.code) {
          const conversion = await convertCurrency(
            selectedCurrency.code,
            baseCurrency.code,
            igtf.total_with_igtf
          );

          const subtotalConversion = await convertCurrency(
            selectedCurrency.code,
            baseCurrency.code,
            totals.subtotal
          );

          setConvertedTotals({
            subtotalInVES: subtotalConversion.converted_amount,
            totalInVES: conversion.converted_amount,
            igtfInVES: conversion.converted_amount - subtotalConversion.converted_amount,
            exchangeRate: conversion.exchange_rate_used
          });
        }
      } catch (error) {
        console.error('Error calculating IGTF:', error);
      } finally {
        setLoading(false);
      }
    };

    calculateIGTFTax();
  }, [currencyId, totals.subtotal, appliesIGTF, selectedCurrency, baseCurrency, convertCurrency, calculateIGTF]);

  const finalTotal = igtfResult?.total || totals.total;
  const igtfAmount = igtfResult?.amount || 0;

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 overflow-hidden sticky top-8">
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-xl font-light text-gray-900">Resumen</h3>
        {selectedCurrency && (
          <p className="text-sm text-gray-500 mt-1">
            Moneda: <span className="font-medium text-gray-900">{selectedCurrency.code}</span>
            {selectedCurrency.rate_update_method === 'api_bcv' && (
              <span className="ml-2 text-xs text-blue-600">
                (Tasa BCV: {parseFloat(selectedCurrency.exchange_rate).toFixed(2)})
              </span>
            )}
          </p>
        )}
      </div>

      <div className="p-6">
        <div className="space-y-3">
          {/* Subtotal */}
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Subtotal</span>
            <div className="text-right">
              <span className="font-medium text-gray-900">
                {selectedCurrency ? selectedCurrency.symbol : '$'}{totals.subtotal.toFixed(2)}
              </span>
              {convertedTotals && (
                <p className="text-xs text-gray-500">
                  ≈ {formatCurrency(convertedTotals.subtotalInVES)}
                </p>
              )}
            </div>
          </div>

          {/* Base Imponible */}
          {totals.taxableBase > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Base Imponible</span>
              <div className="text-right">
                <span className="text-sm text-gray-700">
                  {selectedCurrency ? selectedCurrency.symbol : '$'}{totals.taxableBase.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Monto Exento */}
          {totals.exemptAmount > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-green-600">Monto Exento</span>
              <div className="text-right">
                <span className="text-sm text-green-700">
                  {selectedCurrency ? selectedCurrency.symbol : '$'}{totals.exemptAmount.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* IVA */}
          <div className="flex justify-between items-center">
            <span className="text-gray-600">IVA ({ivaPercentage}%)</span>
            <div className="text-right">
              <span className="font-medium text-gray-900">
                {selectedCurrency ? selectedCurrency.symbol : '$'}{totals.tax.toFixed(2)}
              </span>
            </div>
          </div>

          {/* IGTF */}
          {appliesIGTF && (
            <div className={`flex justify-between items-center p-3 rounded-xl ${loading ? 'bg-gray-50' : 'bg-orange-50/80 border border-orange-200'}`}>
              <div className="flex items-center space-x-2">
                {loading ? (
                  <RefreshCw className="w-4 h-4 text-orange-600 animate-spin" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-orange-600" />
                )}
                <span className="text-sm font-medium text-orange-900">IGTF</span>
                {igtfResult && (
                  <span className="text-xs text-orange-700">
                    ({selectedCurrency?.igtf_rate || 3}%)
                  </span>
                )}
              </div>
              <div className="text-right">
                {loading ? (
                  <span className="text-sm text-orange-600">Calculando...</span>
                ) : (
                  <>
                    <span className="font-medium text-orange-900">
                      {selectedCurrency ? selectedCurrency.symbol : '$'}{igtfAmount.toFixed(2)}
                    </span>
                    {convertedTotals && (
                      <p className="text-xs text-orange-700">
                        ≈ {formatCurrency(convertedTotals.igtfInVES)}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Total */}
          <div className="flex justify-between pt-3 border-t border-gray-200">
            <span className="font-semibold text-gray-900">Total</span>
            <div className="text-right">
              <span className="text-2xl font-light text-blue-600">
                {selectedCurrency ? selectedCurrency.symbol : '$'}{finalTotal.toFixed(2)}
              </span>
              {convertedTotals && (
                <p className="text-sm text-gray-600 mt-1">
                  ≈ {formatCurrency(convertedTotals.totalInVES)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Venezuela Info */}
        {(totals.taxableBase > 0 || totals.exemptAmount > 0) && (
          <div className="mt-4 p-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-600 mb-2 font-medium">Desglose IVA (Venezuela):</p>
            <div className="space-y-1">
              {totals.taxableBase > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Operaciones gravadas:</span>
                  <span className="text-gray-700">
                    {selectedCurrency ? selectedCurrency.symbol : '$'}{totals.taxableBase.toFixed(2)}
                  </span>
                </div>
              )}
              {totals.exemptAmount > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-green-600">Operaciones exentas:</span>
                  <span className="text-green-700">
                    {selectedCurrency ? selectedCurrency.symbol : '$'}{totals.exemptAmount.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Exchange Rate Info */}
        {selectedCurrency && !selectedCurrency.is_base_currency && convertedTotals && (
          <div className="mt-4 p-3 bg-blue-50/80 border border-blue-200 rounded-xl">
            <div className="flex items-start space-x-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">Tasa de Cambio</p>
                <p className="text-xs text-blue-700 mt-1">
                  1 {selectedCurrency.code} = {convertedTotals.exchangeRate.toFixed(2)} {baseCurrency?.code || 'VES'}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Última actualización: {selectedCurrency.last_rate_update
                    ? new Date(selectedCurrency.last_rate_update).toLocaleDateString('es-VE')
                    : 'No disponible'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* IGTF Warning */}
        {appliesIGTF && !loading && (
          <div className="mt-4 p-3 bg-orange-50/80 border border-orange-200 rounded-xl">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-orange-900">IGTF Aplicable</p>
                <p className="text-xs text-orange-700 mt-1">
                  Esta transacción en {selectedCurrency?.code} está sujeta al Impuesto a Grandes Transacciones Financieras ({selectedCurrency?.igtf_rate || 3}%).
                </p>
                {igtfResult && !igtfResult.applied && (
                  <p className="text-xs text-green-700 mt-1">
                    ✓ Esta factura está exenta de IGTF
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Items Count */}
        <div className="mt-4 p-4 bg-blue-50 rounded-2xl">
          <p className="text-sm text-blue-900">
            <span className="font-medium">Items:</span> {itemsCount}
          </p>
        </div>
      </div>
    </div>
  );
};
