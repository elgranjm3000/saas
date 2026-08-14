'use client'
import React, { useState } from 'react';
import {
  Filter,
  X,
  ChevronDown,
  Calendar,
  DollarSign,
  Percent,
  CheckCircle
} from 'lucide-react';
import { useCurrencyStore } from '@/store/currency-store';

interface InvoiceFiltersProps {
  onFilterChange: (filters: InvoiceFilterState) => void;
  activeFiltersCount: number;
}

export interface InvoiceFilterState {
  currencyId: number | null;
  hasIGTF: boolean | null;
  status: string | null;
  dateFrom: string;
  dateTo: string;
  minAmount: number;
  maxAmount: number;
}

export const InvoiceFilters: React.FC<InvoiceFiltersProps> = ({
  onFilterChange,
  activeFiltersCount
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { currencies } = useCurrencyStore();

  const [filters, setFilters] = useState<InvoiceFilterState>({
    currencyId: null,
    hasIGTF: null,
    status: null,
    dateFrom: '',
    dateTo: '',
    minAmount: 0,
    maxAmount: 0
  });

  const handleFilterChange = (key: keyof InvoiceFilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters: InvoiceFilterState = {
      currencyId: null,
      hasIGTF: null,
      status: null,
      dateFrom: '',
      dateTo: '',
      minAmount: 0,
      maxAmount: 0
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

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
    <div className="relative">
      {/* Filter Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center px-4 py-2 rounded-xl transition-all ${
          activeFiltersCount > 0
            ? 'bg-blue-500 text-white hover:bg-blue-600'
            : 'bg-white/80 border border-gray-200/60 text-gray-700 hover:bg-white hover:border-gray-300'
        }`}
      >
        <Filter className="w-4 h-4 mr-2" />
        <span className="font-medium">Filtros</span>
        {activeFiltersCount > 0 && (
          <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-lg text-xs font-semibold">
            {activeFiltersCount}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>

      {/* Filter Panel */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-96 bg-white/95 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-xl z-20">
          <div className="p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">Filtros Avanzados</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Filters */}
            <div className="space-y-4">
              {/* Currency Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Moneda
                </label>
                <select
                  value={filters.currencyId || ''}
                  onChange={(e) => handleFilterChange('currencyId', e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all outline-none text-sm"
                >
                  <option value="">Todas las monedas</option>
                  {currencies.map((currency) => (
                    <option key={currency.id} value={currency.id}>
                      {getCurrencyFlag(currency.code)} {currency.code} - {currency.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* IGTF Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Percent className="w-4 h-4 inline mr-1" />
                  IGTF
                </label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleFilterChange('hasIGTF', null)}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-xl transition-all ${
                      filters.hasIGTF === null
                        ? 'bg-gray-800 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Todas
                  </button>
                  <button
                    onClick={() => handleFilterChange('hasIGTF', true)}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-xl transition-all ${
                      filters.hasIGTF === true
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Con IGTF
                  </button>
                  <button
                    onClick={() => handleFilterChange('hasIGTF', false)}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-xl transition-all ${
                      filters.hasIGTF === false
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Sin IGTF
                  </button>
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  Estado
                </label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value || null)}
                  className="w-full px-3 py-2 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all outline-none text-sm"
                >
                  <option value="">Todos los estados</option>
                  <option value="factura">Factura</option>
                  <option value="pagada">Pagada</option>
                  <option value="presupuesto">Presupuesto</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="anulada">Anulada</option>
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Rango de Fechas
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    className="px-3 py-2 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all outline-none text-sm"
                    placeholder="Desde"
                  />
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    className="px-3 py-2 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all outline-none text-sm"
                    placeholder="Hasta"
                  />
                </div>
              </div>

              {/* Amount Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Rango de Monto
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={filters.minAmount || ''}
                    onChange={(e) => handleFilterChange('minAmount', e.target.value ? Number(e.target.value) : 0)}
                    className="px-3 py-2 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all outline-none text-sm"
                    placeholder="Mín"
                  />
                  <input
                    type="number"
                    value={filters.maxAmount || ''}
                    onChange={(e) => handleFilterChange('maxAmount', e.target.value ? Number(e.target.value) : 0)}
                    className="px-3 py-2 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all outline-none text-sm"
                    placeholder="Máx"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 pt-4 border-t border-gray-100 flex space-x-3">
              <button
                onClick={clearFilters}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all text-sm font-medium"
              >
                Limpiar
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all text-sm font-medium"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
