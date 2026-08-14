'use client'
import React from 'react';
import { TrendingUp, DollarSign } from 'lucide-react';

interface SalesData {
  currencyCode: string;
  currencySymbol: string;
  amount: number;
  percentage: number;
  color: string;
}

interface SalesByCurrencyChartProps {
  data: SalesData[];
  period?: string;
}

export const SalesByCurrencyChart: React.FC<SalesByCurrencyChartProps> = ({
  data,
  period = 'Este mes'
}) => {
  const maxAmount = Math.max(...data.map(d => d.amount));

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

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-light text-gray-900">Ventas por Moneda</h3>
          <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
        </div>
        <p className="text-sm text-gray-500">{period}</p>
      </div>

      {/* Content */}
      <div className="p-6">
        {data.length === 0 ? (
          <div className="text-center py-8">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No hay ventas registradas</p>
          </div>
        ) : (
          <div className="space-y-5">
            {data.map((item, index) => (
              <div key={index} className="space-y-2">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getCurrencyFlag(item.currencyCode)}</span>
                    <div>
                      <p className="font-semibold text-gray-900">{item.currencyCode}</p>
                      <p className="text-xs text-gray-500">{item.percentage.toFixed(1)}% del total</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {item.currencySymbol}{item.amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${(item.amount / maxAmount) * 100}%`,
                      backgroundColor: item.color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Total */}
        {data.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Total Ventas</span>
              <span className="text-lg font-semibold text-gray-900">
                {data.length > 0 && data[0]?.currencySymbol}
                {data.reduce((sum, item) => sum + item.amount, 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                {data.length > 1 && ' (mixto)'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
