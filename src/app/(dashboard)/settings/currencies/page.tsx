'use client'
import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  TrendingUp,
  RefreshCw,
  CheckCircle,
  XCircle,
  Info,
  Calendar,
  Building2,
  AlertCircle,
  Search,
  Filter,
  DollarSign,
  Percent,
  Settings
} from 'lucide-react';
import Link from 'next/link';
import { useCurrencyStore } from '@/store/currency-store';
import type { Currency, CurrencyRateUpdateForm } from '@/types/currency';
import { formatCurrency, formatDate } from '@/lib/utils';

const CurrenciesAdminPage = () => {
  const {
    currencies,
    fetchCurrencies,
    updateCurrencyRate,
    deleteCurrency,
    updateCurrency,
    createCurrency,
    isLoading,
    error,
    clearError
  } = useCurrencyStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Form state
  const [newRate, setNewRate] = useState('');
  const [changeReason, setChangeReason] = useState('');

  useEffect(() => {
    fetchCurrencies({ is_active: true });
  }, [fetchCurrencies]);

  const filteredCurrencies = currencies.filter(currency => {
    const matchesSearch =
      currency.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      currency.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filterActive === null || currency.is_active === filterActive;

    return matchesSearch && matchesFilter;
  });

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

  const handleUpdateRate = async (currency: Currency) => {
    setSelectedCurrency(currency);
    setNewRate(currency.exchange_rate);
    setChangeReason('');
    setShowRateModal(true);
  };

  const submitRateUpdate = async () => {
    if (!selectedCurrency) return;

    setUpdating(true);
    try {
      const rateData: CurrencyRateUpdateForm = {
        new_rate,
        change_reason: changeReason || 'Actualización manual',
        change_type: 'manual',
        change_source: 'user_admin'
      };

      await updateCurrencyRate(selectedCurrency.id, rateData);
      setShowRateModal(false);
      setSelectedCurrency(null);
    } catch (error) {
      console.error('Error updating rate:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (currency: Currency) => {
    if (!confirm(`¿Estás seguro de eliminar ${currency.code}? Esta acción desactivará la moneda.`)) {
      return;
    }

    try {
      await deleteCurrency(currency.id);
    } catch (error) {
      console.error('Error deleting currency:', error);
    }
  };

  const handleToggleActive = async (currency: Currency) => {
    try {
      await updateCurrency(currency.id, { is_active: !currency.is_active });
    } catch (error) {
      console.error('Error toggling currency:', error);
    }
  };

  const getRateChangeColor = (currency: Currency) => {
    if (currency.is_base_currency) return 'text-green-600';
    if (currency.rate_update_method === 'api_bcv') return 'text-blue-600';
    return 'text-gray-600';
  };

  const getRateUpdateBadge = (currency: Currency) => {
    if (currency.rate_update_method === 'api_bcv') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-blue-100 text-blue-700">
          <RefreshCw className="w-3 h-3 mr-1" />
          BCV
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700">
        <Settings className="w-3 h-3 mr-1" />
        Manual
      </span>
    );
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link
              href="/settings"
              className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-2xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-light text-gray-900 mb-2">
                Administración de Monedas
              </h1>
              <p className="text-gray-500 font-light">
                Gestiona las monedas, tasas de cambio y configuración IGTF
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-[1.02] shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="font-light">Nueva Moneda</span>
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50/80 border border-red-200 rounded-2xl flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="p-1 hover:bg-red-100 rounded-lg transition-colors"
            >
              <XCircle className="w-4 h-4 text-red-600" />
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Monedas</p>
                <p className="text-2xl font-light text-gray-900">{currencies.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Activas</p>
                <p className="text-2xl font-light text-green-600">
                  {currencies.filter(c => c.is_active).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Con IGTF</p>
                <p className="text-2xl font-light text-orange-600">
                  {currencies.filter(c => c.applies_igtf && c.is_active).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                <Percent className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">BCV Auto</p>
                <p className="text-2xl font-light text-blue-600">
                  {currencies.filter(c => c.rate_update_method === 'api_bcv' && c.is_active).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por código o nombre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
              />
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setFilterActive(null)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  filterActive === null
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setFilterActive(true)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  filterActive === true
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Activas
              </button>
              <button
                onClick={() => setFilterActive(false)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  filterActive === false
                    ? 'bg-gray-400 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Inactivas
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Currencies Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : filteredCurrencies.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 p-12 text-center">
          <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-light text-gray-900 mb-2">No hay monedas configuradas</h3>
          <p className="text-gray-500 mb-6">
            {searchQuery || filterActive !== null
              ? 'No se encontraron monedas con los filtros aplicados'
              : 'Comienza agregando tu primera moneda'}
          </p>
          {!searchQuery && filterActive === null && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all"
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear Moneda
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCurrencies.map((currency) => (
            <div
              key={currency.id}
              className={`bg-white/80 backdrop-blur-sm rounded-3xl border transition-all hover:shadow-lg ${
                currency.is_base_currency
                  ? 'border-green-200 shadow-md'
                  : currency.is_active
                  ? 'border-gray-100'
                  : 'border-gray-200 opacity-60'
              }`}
            >
              {/* Card Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-4xl">{getCurrencyFlag(currency.code)}</span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-xl font-semibold text-gray-900">{currency.code}</h3>
                        {currency.is_base_currency && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-green-100 text-green-700">
                            Base
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{currency.name}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleActive(currency)}
                    className={`p-2 rounded-xl transition-colors ${
                      currency.is_active
                        ? 'text-green-600 hover:bg-green-50'
                        : 'text-gray-400 hover:bg-gray-100'
                    }`}
                  >
                    {currency.is_active ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <XCircle className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {/* Current Rate */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Tasa Actual</span>
                    {getRateUpdateBadge(currency)}
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-light text-gray-900">
                      {parseFloat(currency.exchange_rate).toFixed(4)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {currency.is_base_currency ? '(Moneda Base)' : `por ${currency.code}`}
                    </span>
                  </div>
                  {currency.last_rate_update && (
                    <div className="flex items-center text-xs text-gray-500 mt-2">
                      <Calendar className="w-3 h-3 mr-1" />
                      Actualizada: {new Date(currency.last_rate_update).toLocaleDateString('es-VE')}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-4">
                {/* IGTF Info */}
                {currency.applies_igtf && (
                  <div className="flex items-start space-x-3 p-3 bg-orange-50/80 border border-orange-200 rounded-xl">
                    <Percent className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-orange-900">Aplica IGTF</p>
                      <p className="text-xs text-orange-700 mt-1">
                        Tasa: {currency.igtf_rate || 3}% | Mínimo: {currency.igtf_min_amount || 'N/A'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Conversion Method */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Método de Conversión</span>
                  <span className="font-medium text-gray-900 capitalize">
                    {currency.conversion_method || 'Directa'}
                  </span>
                </div>

                {/* Decimal Places */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Decimales</span>
                  <span className="font-medium text-gray-900">{currency.decimal_places}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 pt-4 border-t border-gray-100">
                  {!currency.is_base_currency && (
                    <button
                      onClick={() => handleUpdateRate(currency)}
                      disabled={!currency.is_active}
                      className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Actualizar Tasa
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setSelectedCurrency(currency);
                      setShowEditModal(true);
                    }}
                    disabled={!currency.is_active}
                    className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </button>

                  {!currency.is_base_currency && (
                    <button
                      onClick={() => handleDelete(currency)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Update Rate Modal */}
      {showRateModal && selectedCurrency && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-light text-gray-900">
                Actualizar Tasa - {selectedCurrency.code}
              </h3>
              <button
                onClick={() => setShowRateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <XCircle className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nueva Tasa
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={newRate}
                  onChange={(e) => setNewRate(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                  placeholder="Ej: 36.5000"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tasa actual: {parseFloat(selectedCurrency.exchange_rate).toFixed(4)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Razón del Cambio
                </label>
                <textarea
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none resize-none"
                  placeholder="Ej: Actualización BCV, Ajuste manual..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowRateModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={submitRateUpdate}
                  disabled={updating || !newRate}
                  className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? (
                    <RefreshCw className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    'Actualizar'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrenciesAdminPage;
