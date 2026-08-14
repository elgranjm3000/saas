'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  TrendingUp,
  Calculator,
  Settings,
  History,
  RefreshCw,
} from 'lucide-react';
import { useCurrencyStore, getBaseCurrency, getActiveCurrencies } from '@/store/currency-store';
import {
  CurrencyForm,
  RateUpdateModal,
  RateHistory,
  CurrencyConverter,
  IGTFCalculator,
} from '@/components/currencies';
import { BCVRateWidget } from '@/components/BCVRateWidget';

const CurrenciesPage = () => {
  const {
    currencies,
    selectedCurrency,
    isLoading,
    fetchCurrencies,
    deleteCurrency,
    selectCurrency,
    error,
  } = useCurrencyStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<any>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState<'list' | 'converter' | 'igtf'>('list');

  useEffect(() => {
    fetchCurrencies({ is_active: true });
  }, [fetchCurrencies]);

  const handleEdit = (currency: any) => {
    setEditingCurrency(currency);
    setShowForm(true);
  };

  const handleUpdateRate = (currency: any) => {
    selectCurrency(currency);
    setShowRateModal(true);
  };

  const handleViewHistory = (currency: any) => {
    selectCurrency(currency);
    setShowHistory(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta moneda?')) {
      try {
        await deleteCurrency(id);
        alert('Moneda eliminada exitosamente');
      } catch (error: any) {
        alert(error.response?.data?.detail || 'Error al eliminar moneda');
      }
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingCurrency(null);
    fetchCurrencies({ is_active: true });
  };

  const handleRateModalSuccess = () => {
    setShowRateModal(false);
    fetchCurrencies({ is_active: true });
  };

  const filteredCurrencies = currencies.filter((currency) =>
    currency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    currency.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const baseCurrency = getBaseCurrency({ currencies });
  const activeCurrencies = getActiveCurrencies({ currencies });

  const stats = {
    total: activeCurrencies.length,
    baseCurrency: baseCurrency?.name || 'No definida',
    igtfCurrencies: activeCurrencies.filter((c) => c.applies_igtf).length,
  };

  if (isLoading && currencies.length === 0) {
    return (
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-light text-gray-900 mb-3">
              Sistema de Monedas
            </h1>
            <p className="text-gray-500 font-light text-lg">
              Gestión completa de monedas con soporte venezolano (IGTF, BCV)
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nueva Moneda
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'list'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <DollarSign className="w-4 h-4 inline mr-2" />
            Monedas
          </button>
          <button
            onClick={() => setActiveTab('converter')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'converter'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Calculator className="w-4 h-4 inline mr-2" />
            Conversor
          </button>
          <button
            onClick={() => setActiveTab('igtf')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'igtf'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Settings className="w-4 h-4 inline mr-2" />
            IGTF
          </button>
        </div>

        {/* Stats */}
        {activeTab === 'list' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Total Monedas</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats.total}
                    </p>
                  </div>
                  <DollarSign className="w-10 h-10 text-blue-500 opacity-20" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Moneda Base</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {stats.baseCurrency}
                    </p>
                  </div>
                  <CheckCircle className="w-10 h-10 text-green-500 opacity-20" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Con IGTF</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats.igtfCurrencies}
                    </p>
                  </div>
                  <Settings className="w-10 h-10 text-orange-500 opacity-20" />
                </div>
              </div>
            </div>

            {/* ✅ BCV Rate Widget - Integración con sistema REF */}
            <div className="mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                <p className="text-sm font-semibold text-blue-800">
                  💵 Tasa BCV para Sistema de Precios REF
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Esta tasa se usa automáticamente para calcular precios de referencia (USD → VES) en productos y facturas.
                  <a href="/products/new" className="underline font-semibold ml-1">Ver productos →</a>
                </p>
              </div>
              <BCVRateWidget fromCurrency="USD" toCurrency="VES" />
            </div>
          </>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'list' && (
        <>
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tasa de Cambio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Base
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IGTF
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCurrencies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No hay monedas registradas
                    </td>
                  </tr>
                ) : (
                  filteredCurrencies.map((currency) => (
                    <tr key={currency.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono font-semibold">
                          {currency.code}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium">{currency.name}</span>
                          <span className="text-sm text-gray-500">
                            {currency.symbol}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-mono font-semibold">
                            {parseFloat(currency.exchange_rate).toFixed(4)}
                          </span>
                          {currency.last_rate_update && (
                            <span className="text-xs text-gray-500">
                              Actualizado: {new Date(currency.last_rate_update).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {currency.is_base_currency ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Sí
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            No
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {currency.applies_igtf ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            {parseFloat(currency.igtf_rate || '0').toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleUpdateRate(currency)}
                          className="text-green-600 hover:text-green-900 mr-2"
                          title="Actualizar tasa"
                        >
                          <RefreshCw className="w-4 h-4 inline" />
                        </button>
                        <button
                          onClick={() => handleViewHistory(currency)}
                          className="text-purple-600 hover:text-purple-900 mr-2"
                          title="Ver historial"
                        >
                          <History className="w-4 h-4 inline" />
                        </button>
                        <button
                          onClick={() => handleEdit(currency)}
                          className="text-blue-600 hover:text-blue-900 mr-2"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4 inline" />
                        </button>
                        <button
                          onClick={() => handleDelete(currency.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'converter' && (
        <div className="max-w-4xl mx-auto">
          <CurrencyConverter />
        </div>
      )}

      {activeTab === 'igtf' && (
        <div className="max-w-4xl mx-auto">
          <IGTFCalculator />
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl my-8">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">
                {editingCurrency ? 'Editar Moneda' : 'Nueva Moneda'}
              </h2>
            </div>
            <div className="p-6">
              <CurrencyForm
                onSuccess={handleFormSuccess}
                initialData={editingCurrency}
                currencyId={editingCurrency?.id}
              />
            </div>
          </div>
        </div>
      )}

      {showRateModal && selectedCurrency && (
        <RateUpdateModal
          currencyId={selectedCurrency.id}
          currencyCode={selectedCurrency.code}
          currentRate={selectedCurrency.exchange_rate}
          onClose={() => setShowRateModal(false)}
          onSuccess={handleRateModalSuccess}
        />
      )}

      {showHistory && selectedCurrency && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl my-8">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Historial de Tasas</h2>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <RateHistory
                currencyId={selectedCurrency.id}
                currencyCode={selectedCurrency.code}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrenciesPage;
