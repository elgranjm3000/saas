'use client'
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Calendar,
  User,
  ArrowUpDown,
  MoreVertical,
  Printer,
  Send
} from 'lucide-react';
import { invoicesAPI, customersAPI } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ListItemSkeleton } from '@/components/Skeleton';
import { Invoice as InvoiceType } from '@/types/invoice';
import { Customer } from '@/types/customer';
import { CurrencyBadge, CurrencyAmount } from '@/components/ui/CurrencyBadge';
import { CurrencyConverterSelector } from '@/components/currencies/CurrencyConverterSelector';
import { useCurrencyStore, getBaseCurrency } from '@/store/currency-store';

interface Invoice extends InvoiceType {
  customer_name?: string;
}

const InvoicesPage = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState<'invoice_number' | 'date' | 'total_amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [baseCurrencyId, setBaseCurrencyId] = useState<number | null>(null);

  const { currencies, fetchCurrencies } = useCurrencyStore();

  useEffect(() => {
    fetchInvoices();
    fetchCurrencies({ is_active: true });
  }, []);

  // Obtener moneda base cuando se cargan las monedas
  useEffect(() => {
    if (currencies.length > 0) {
      const baseCurrency = getBaseCurrency({ currencies });
      if (baseCurrency) {
        setBaseCurrencyId(baseCurrency.id);
      }
    }
  }, [currencies]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await invoicesAPI.getAll();
      const invoicesData = response.data;

      // Obtener nombres de clientes únicos
      const uniqueCustomerIds = Array.from(new Set(invoicesData.map((inv: Invoice) => inv.customer_id))) as number[];

      // Crear un mapa de customer_id -> customer_name
      const customerMap = new Map<number, string>();

      // Obtener datos de cada cliente
      await Promise.all(
        uniqueCustomerIds.map(async (customerId: number) => {
          try {
            const customerResponse = await customersAPI.getById(customerId);
            const customer: Customer = customerResponse.data;
            customerMap.set(customerId, customer.name);
          } catch (error) {
            console.error(`Error fetching customer ${customerId}:`, error);
            customerMap.set(customerId, `Cliente #${customerId}`);
          }
        })
      );

      // Agregar customer_name a cada factura
      const invoicesWithNames = invoicesData.map((inv: Invoice) => ({
        ...inv,
        customer_name: customerMap.get(inv.customer_id) || `Cliente #${inv.customer_id}`
      }));

      setInvoices(invoicesWithNames);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta factura?')) {
      try {
        await invoicesAPI.delete(id);
        setInvoices(invoices.filter(inv => inv.id !== id));
      } catch (error) {
        console.error('Error deleting invoice:', error);
      }
    }
  };

  // Calcular fecha de vencimiento basada en la fecha de la factura + días de crédito
  const getDueDate = (invoice: Invoice): string | null => {
    if (!invoice.date) return null;
    if (invoice.transaction_type === 'contado') {
      // Si es contado, vence el mismo día
      return invoice.date;
    }
    if (invoice.credit_days && invoice.credit_days > 0) {
      // Calcular fecha de vencimiento = fecha + días de crédito
      const invoiceDate = new Date(invoice.date);
      const dueDate = new Date(invoiceDate);
      dueDate.setDate(dueDate.getDate() + invoice.credit_days);
      return dueDate.toISOString().split('T')[0];
    }
    return null;
  };

  // Verificar si una factura está vencida
  const isOverdue = (invoice: Invoice): boolean => {
    // Solo verificar vencimiento para facturas de crédito
    if (invoice.transaction_type === 'contado') return false;

    const dueDate = getDueDate(invoice);
    if (!dueDate) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dueDate) < today;
  };

  const filteredInvoices = invoices
    .filter(invoice => {
      const matchesSearch =
        invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (invoice.customer_name && invoice.customer_name.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesSearch;
    })
    .sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];

      if (sortBy === 'date') {
        aValue = new Date(a.date).getTime();
        bValue = new Date(b.date).getTime();
      }

      const modifier = sortOrder === 'asc' ? 1 : -1;
      return aValue > bValue ? modifier : -modifier;
    });

  const stats = {
    total: invoices.length,
    totalAmount: invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0),
    overdue: invoices.filter(inv => isOverdue(inv)).length,
    credit: invoices.filter(inv => inv.transaction_type === 'credito').length,
    cash: invoices.filter(inv => inv.transaction_type === 'contado').length,
  };

  const InvoiceCard = ({ invoice }: { invoice: Invoice }) => {
    const dueDate = getDueDate(invoice);
    const overdue = isOverdue(invoice);

    return (
      <div className="erp-card group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-medium" style={{ color: 'var(--color-text)' }}>
                {invoice.invoice_number}
              </h3>
              <CurrencyBadge currencyId={invoice.currency_id || null} size="sm" />
            </div>
            <p className="text-sm" style={{ color: 'var(--color-text-light)' }}>
              {invoice.customer_name || `Cliente #${invoice.customer_id}`}
            </p>
          </div>
          <button className="p-2 rounded-xl transition-colors opacity-0 group-hover:opacity-100 hover:bg-[var(--color-neutral)]" style={{ color: 'var(--color-text-light)' }}>
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm flex items-center" style={{ color: 'var(--color-text-light)' }}>
              <Calendar className="w-4 h-4 mr-2" />
              {formatDate(invoice.date)}
            </span>
            <span className={`erp-badge ${
              invoice.status === 'pagada' ? 'success' :
              invoice.status === 'pendiente' ? 'warning' : 'success'
            }`}>
              {invoice.status}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--color-text-light)' }}>Vencimiento</span>
            <span className={`text-sm ${overdue ? 'font-medium' : ''} ${overdue ? 'text-red-600' : ''}`} style={{ color: overdue ? 'var(--color-danger)' : 'var(--color-text)' }}>
              {dueDate ? formatDate(dueDate) : '-'}
            </span>
          </div>

          {/* IGTF Badge */}
          {invoice.igtf_amount && invoice.igtf_amount > 0 && (
            <div className="flex items-center justify-between p-2 bg-orange-50 rounded-xl">
              <span className="text-xs text-orange-700 font-medium">IGTF</span>
              <CurrencyAmount
                amount={invoice.igtf_amount}
                currencyId={invoice.currency_id || null}
                showConverted={false}
                className="text-sm font-semibold text-orange-900"
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span className="text-sm font-medium text-gray-700">Total</span>
            <CurrencyAmount
              amount={invoice.total_amount}
              currencyId={invoice.currency_id || null}
              showConverted={true}
              className="text-xl font-light text-gray-900"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 pt-4 border-t border-gray-100">
          <Link
            href={`/invoices/${invoice.id}`}
            className="flex-1 flex items-center justify-center px-3 py-2 text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors text-sm"
          >
            <Eye className="w-4 h-4 mr-1" />
            Ver
          </Link>
          <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
            <Printer className="w-4 h-4" />
          </button>
          <Link
            href={`/invoices/${invoice.id}/edit`}
            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-colors"
          >
            <Edit className="w-4 h-4" />
          </Link>
          <button
            onClick={() => handleDelete(invoice.id)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-light text-gray-900 mb-3">Facturas</h1>
            <p className="text-gray-500 font-light text-lg">
              Gestiona y controla todas tus facturas de venta
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              href="/invoices/pos"
              className="flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-[1.02] shadow-lg"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              <span className="font-light">POS</span>
            </Link>
            <button className="flex items-center px-4 py-3 text-gray-600 bg-white/80 border border-gray-200/60 rounded-2xl hover:bg-white hover:border-gray-300 transition-all">
              <Upload className="w-4 h-4 mr-2" />
              <span className="font-light">Importar</span>
            </button>
            <button className="flex items-center px-4 py-3 text-gray-600 bg-white/80 border border-gray-200/60 rounded-2xl hover:bg-white hover:border-gray-300 transition-all">
              <Download className="w-4 h-4 mr-2" />
              <span className="font-light">Exportar</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Total Facturas
                </p>
                <p className="text-2xl font-light text-gray-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Monto Total
                </p>
                {baseCurrencyId ? (
                  <CurrencyAmount
                    amount={stats.totalAmount}
                    currencyId={baseCurrencyId}
                    showConverted={false}
                    className="text-2xl font-light text-gray-900"
                  />
                ) : (
                  <p className="text-2xl font-light text-gray-900">{formatCurrency(stats.totalAmount)}</p>
                )}
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Crédito
                </p>
                <p className="text-2xl font-light text-blue-600">{stats.credit}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Contado
                </p>
                <p className="text-2xl font-light text-green-600">{stats.cash}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Vencidas
                </p>
                <p className="text-2xl font-light text-red-600">{stats.overdue}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Currency Converter - Convertir monto total a diferentes monedas */}
      {stats.totalAmount > 0 && baseCurrencyId && (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-medium text-gray-900">Convertir Monto Total</h3>
          </div>
          <CurrencyConverterSelector
            amount={stats.totalAmount}
            fromCurrencyId={baseCurrencyId}
            label="Ver total en"
            showConversionDetails={true}
          />
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 p-6 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 min-w-80">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por número o cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
            >
              <option value="date">Ordenar por Fecha</option>
              <option value="invoice_number">Ordenar por Número</option>
              <option value="total_amount">Ordenar por Monto</option>
            </select>
            
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-2xl transition-colors"
            >
              <ArrowUpDown className="w-5 h-5" />
            </button>

            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center px-4 py-3 text-gray-600 bg-gray-50/80 border border-gray-200/60 rounded-2xl hover:bg-white hover:border-gray-300 transition-all"
            >
              <Filter className="w-4 h-4 mr-2" />
              <span className="font-light">Filtros</span>
            </button>
          </div>
        </div>
      </div>

      {/* Invoices Content */}
      {loading ? (
        <ListItemSkeleton count={10} />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInvoices.map((invoice) => (
            <InvoiceCard key={invoice.id} invoice={invoice} />
          ))}
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Factura</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Cliente</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Fecha</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Vencimiento</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Monto</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredInvoices.map((invoice) => {
                  const dueDate = getDueDate(invoice);
                  const overdue = isOverdue(invoice);

                  return (
                    <tr key={invoice.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mr-3">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{invoice.invoice_number}</p>
                            <p className="text-sm text-gray-500">ID: {invoice.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-400 mr-2" />
                          <p className="font-medium text-gray-900">{invoice.customer_name || `Cliente #${invoice.customer_id}`}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-900">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          {formatDate(invoice.date)}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className={`flex items-center ${overdue ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                          <Calendar className="w-4 h-4 mr-2" />
                          {dueDate ? formatDate(dueDate) : '-'}
                          {overdue && <AlertTriangle className="w-4 h-4 ml-2 text-red-600" />}
                        </div>
                      </td>
                      <td className="py-4 px-6 font-medium text-gray-900">
                        <CurrencyAmount
                          amount={invoice.total_amount || 0}
                          currencyId={invoice.currency_id || null}
                          showConverted={false}
                        />
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <Link
                            href={`/invoices/${invoice.id}`}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
                            <Printer className="w-4 h-4" />
                          </button>
                          <Link
                            href={`/invoices/${invoice.id}/edit`}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(invoice.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="bg-gray-50/80 px-6 py-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 font-light">
                Mostrando <span className="font-medium">1</span> a <span className="font-medium">{filteredInvoices.length}</span> de{' '}
                <span className="font-medium">{filteredInvoices.length}</span> facturas
              </p>
              <div className="flex items-center space-x-2">
                <button className="px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-light">
                  Anterior
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-xl font-light">
                  1
                </button>
                <button className="px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-light">
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {filteredInvoices.length === 0 && !loading && (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-light text-gray-900 mb-2">No hay facturas</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm ? 'No se encontraron facturas con ese término de búsqueda.' : 'Comienza creando tu primera factura.'}
          </p>
          <Link
            href="/invoices/pos"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-[1.02] shadow-lg"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            <span className="font-light">POS</span>
          </Link>
        </div>
      )}
    </div>
  );
};

export default InvoicesPage;