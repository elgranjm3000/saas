'use client'
import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Filter,
  Loader2
} from 'lucide-react';
import { reportsAPI } from '@/lib/api';
import type {
  SalesBookReport,
  PurchaseBookReport,
  SalesSummaryReport,
  CashFlowReport
} from '@/types/api';

type ReportType = 'sales-book' | 'purchase-book' | 'sales-summary' | 'cash-flow';

const FiscalReportsPage = () => {
  const [reportType, setReportType] = useState<ReportType>('sales-book');
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month' | 'payment_method'>('month');

  const [salesBookData, setSalesBookData] = useState<SalesBookReport | null>(null);
  const [purchaseBookData, setPurchaseBookData] = useState<PurchaseBookReport | null>(null);
  const [salesSummaryData, setSalesSummaryData] = useState<SalesSummaryReport | null>(null);
  const [cashFlowData, setCashFlowData] = useState<CashFlowReport | null>(null);

  useEffect(() => {
    // Set default date range (current month)
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      fetchReport();
    }
  }, [reportType, startDate, endDate, groupBy]);

  const fetchReport = async () => {
    if (!startDate || !endDate) return;

    try {
      setLoading(true);

      switch (reportType) {
        case 'sales-book':
          const salesResponse = await reportsAPI.getSalesBook({
            start_date: startDate,
            end_date: endDate
          });
          setSalesBookData(salesResponse.data);
          break;

        case 'purchase-book':
          const purchaseResponse = await reportsAPI.getPurchaseBook({
            start_date: startDate,
            end_date: endDate
          });
          setPurchaseBookData(purchaseResponse.data);
          break;

        case 'sales-summary':
          const summaryResponse = await reportsAPI.getSalesSummary({
            start_date: startDate,
            end_date: endDate,
            group_by: groupBy
          });
          setSalesSummaryData(summaryResponse.data);
          break;

        case 'cash-flow':
          const cashFlowResponse = await reportsAPI.getCashFlow({
            start_date: startDate,
            end_date: endDate
          });
          setCashFlowData(cashFlowResponse.data);
          break;
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      alert('Error al cargar el reporte');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const exportToCSV = () => {
    // TODO: Implement CSV export
    alert('Función de exportación en desarrollo');
  };

  if (loading && (!salesBookData && !purchaseBookData && !salesSummaryData && !cashFlowData)) {
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
            <h1 className="text-3xl font-light text-gray-900 mb-3">Reportes Fiscales SENIAT</h1>
            <p className="text-gray-500 font-light text-lg">
              Libros de ventas, compras y reportes gerenciales
            </p>
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            Exportar
          </button>
        </div>

        {/* Report Type Tabs */}
        <div className="bg-white rounded-lg shadow p-2 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setReportType('sales-book')}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                reportType === 'sales-book'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Libro de Ventas
            </button>
            <button
              onClick={() => setReportType('purchase-book')}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                reportType === 'purchase-book'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Libro de Compras
            </button>
            <button
              onClick={() => setReportType('sales-summary')}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                reportType === 'sales-summary'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Resumen de Ventas
            </button>
            <button
              onClick={() => setReportType('cash-flow')}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                reportType === 'cash-flow'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Flujo de Caja
            </button>
          </div>
        </div>

        {/* Date Filters */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4 mb-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <h3 className="font-medium text-gray-900">Filtros</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Inicio
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Fin
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {reportType === 'sales-summary' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Agrupar Por
                </label>
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="day">Día</option>
                  <option value="week">Semana</option>
                  <option value="month">Mes</option>
                  <option value="payment_method">Forma de Pago</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            {/* Sales Book */}
            {reportType === 'sales-book' && salesBookData && (
              <SalesBookContent data={salesBookData} formatCurrency={formatCurrency} />
            )}

            {/* Purchase Book */}
            {reportType === 'purchase-book' && purchaseBookData && (
              <PurchaseBookContent data={purchaseBookData} formatCurrency={formatCurrency} />
            )}

            {/* Sales Summary */}
            {reportType === 'sales-summary' && salesSummaryData && (
              <SalesSummaryContent data={salesSummaryData} groupBy={groupBy} formatCurrency={formatCurrency} />
            )}

            {/* Cash Flow */}
            {reportType === 'cash-flow' && cashFlowData && (
              <CashFlowContent data={cashFlowData} formatCurrency={formatCurrency} />
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Sales Book Component
const SalesBookContent = ({ data, formatCurrency }: { data: SalesBookReport; formatCurrency: (amount: number) => string }) => {
  return (
    <div>
      {/* Header Info */}
      <div className="p-6 bg-gray-50 border-b">
        <h2 className="text-xl font-semibold mb-4">Libro de Ventas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium">Empresa:</span> {data.company.name}
          </div>
          <div>
            <span className="font-medium">RIF:</span> {data.company.tax_id}
          </div>
          <div>
            <span className="font-medium">Período:</span> {data.period_start} a {data.period_end}
          </div>
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-6 bg-blue-50">
        <div>
          <p className="text-xs text-gray-600 mb-1">Base Imponible</p>
          <p className="font-semibold">{formatCurrency(data.totals.taxable_base)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 mb-1">Exento</p>
          <p className="font-semibold">{formatCurrency(data.totals.exempt_amount)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 mb-1">IVA</p>
          <p className="font-semibold">{formatCurrency(data.totals.iva_amount)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 mb-1">Retención IVA</p>
          <p className="font-semibold">{formatCurrency(data.totals.iva_retention)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 mb-1">Total Ventas</p>
          <p className="font-semibold text-lg">{formatCurrency(data.totals.total_sales)}</p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Nro. Factura</th>
              <th className="px-4 py-3 text-left">Nro. Control</th>
              <th className="px-4 py-3 text-left">Fecha</th>
              <th className="px-4 py-3 text-left">Cliente</th>
              <th className="px-4 py-3 text-right">Base Imponible</th>
              <th className="px-4 py-3 text-right">Exento</th>
              <th className="px-4 py-3 text-right">IVA</th>
              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.invoices.map((invoice, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-4 py-3">{invoice.invoice_number}</td>
                <td className="px-4 py-3">{invoice.control_number}</td>
                <td className="px-4 py-3">{invoice.date}</td>
                <td className="px-4 py-3">
                  <div className="font-medium">{invoice.customer_name}</div>
                  <div className="text-xs text-gray-500">{invoice.customer_tax_id}</div>
                </td>
                <td className="px-4 py-3 text-right">{formatCurrency(invoice.taxable_base)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(invoice.exempt_amount)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(invoice.iva_amount)}</td>
                <td className="px-4 py-3 text-right font-medium">{formatCurrency(invoice.total_with_taxes)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Purchase Book Component
const PurchaseBookContent = ({ data, formatCurrency }: { data: PurchaseBookReport; formatCurrency: (amount: number) => string }) => {
  return (
    <div>
      {/* Header Info */}
      <div className="p-6 bg-gray-50 border-b">
        <h2 className="text-xl font-semibold mb-4">Libro de Compras</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium">Empresa:</span> {data.company.name}
          </div>
          <div>
            <span className="font-medium">RIF:</span> {data.company.tax_id}
          </div>
          <div>
            <span className="font-medium">Período:</span> {data.period_start} a {data.period_end}
          </div>
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-6 bg-green-50">
        <div>
          <p className="text-xs text-gray-600 mb-1">Base Imponible</p>
          <p className="font-semibold">{formatCurrency(data.totals.taxable_base)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 mb-1">Exento</p>
          <p className="font-semibold">{formatCurrency(data.totals.exempt_amount)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 mb-1">IVA</p>
          <p className="font-semibold">{formatCurrency(data.totals.iva_amount)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 mb-1">Retención IVA</p>
          <p className="font-semibold">{formatCurrency(data.totals.iva_retention)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 mb-1">Total Compras</p>
          <p className="font-semibold text-lg">{formatCurrency(data.totals.total_purchases)}</p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Nro. Factura</th>
              <th className="px-4 py-3 text-left">Nro. Control</th>
              <th className="px-4 py-3 text-left">Fecha</th>
              <th className="px-4 py-3 text-left">Proveedor</th>
              <th className="px-4 py-3 text-right">Base Imponible</th>
              <th className="px-4 py-3 text-right">Exento</th>
              <th className="px-4 py-3 text-right">IVA</th>
              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.purchases.map((purchase, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-4 py-3">{purchase.invoice_number}</td>
                <td className="px-4 py-3">{purchase.control_number}</td>
                <td className="px-4 py-3">{purchase.date}</td>
                <td className="px-4 py-3">
                  <div className="font-medium">{purchase.supplier_name}</div>
                  <div className="text-xs text-gray-500">{purchase.supplier_tax_id}</div>
                </td>
                <td className="px-4 py-3 text-right">{formatCurrency(purchase.taxable_base)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(purchase.exempt_amount)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(purchase.iva_amount)}</td>
                <td className="px-4 py-3 text-right font-medium">{formatCurrency(purchase.total_with_taxes)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Sales Summary Component
const SalesSummaryContent = ({
  data,
  groupBy,
  formatCurrency
}: {
  data: SalesSummaryReport;
  groupBy: string;
  formatCurrency: (amount: number) => string;
}) => {
  const getGroupLabel = (item: any) => {
    if (groupBy === 'payment_method') {
      return item.payment_method || 'N/A';
    }
    return item.period || 'N/A';
  };

  return (
    <div>
      {/* Header Info */}
      <div className="p-6 bg-gray-50 border-b">
        <h2 className="text-xl font-semibold mb-4">Resumen de Ventas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium">Empresa:</span> {data.company.name}
          </div>
          <div>
            <span className="font-medium">RIF:</span> {data.company.tax_id}
          </div>
          <div>
            <span className="font-medium">Período:</span> {data.period_start} a {data.period_end}
          </div>
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-6 bg-purple-50">
        <div>
          <p className="text-xs text-gray-600 mb-1">Total Facturas</p>
          <p className="font-semibold">{data.totals.total_invoices}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 mb-1">Monto Total</p>
          <p className="font-semibold">{formatCurrency(data.totals.total_amount)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 mb-1">IVA Total</p>
          <p className="font-semibold">{formatCurrency(data.totals.total_iva)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 mb-1">Retenciones</p>
          <p className="font-semibold">{formatCurrency(data.totals.total_retention)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 mb-1">Neto Total</p>
          <p className="font-semibold text-lg">{formatCurrency(data.totals.net_total)}</p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">
                {groupBy === 'payment_method' ? 'Forma de Pago' : 'Período'}
              </th>
              <th className="px-4 py-3 text-right">Facturas</th>
              <th className="px-4 py-3 text-right">Monto Total</th>
              <th className="px-4 py-3 text-right">IVA</th>
              <th className="px-4 py-3 text-right">Retenciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.data.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{getGroupLabel(item)}</td>
                <td className="px-4 py-3 text-right">{item.total_invoices}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(item.total_amount)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(item.total_iva)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(item.total_retention)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Cash Flow Component
const CashFlowContent = ({ data, formatCurrency }: { data: CashFlowReport; formatCurrency: (amount: number) => string }) => {
  return (
    <div>
      {/* Header Info */}
      <div className="p-6 bg-gray-50 border-b">
        <h2 className="text-xl font-semibold mb-4">Flujo de Caja</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium">Empresa:</span> {data.company.name}
          </div>
          <div>
            <span className="font-medium">RIF:</span> {data.company.tax_id}
          </div>
          <div>
            <span className="font-medium">Período:</span> {data.period_start} a {data.period_end}
          </div>
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-orange-50">
        <div>
          <p className="text-xs text-gray-600 mb-1">Total Ingresos</p>
          <p className="font-semibold text-green-700 text-lg">{formatCurrency(data.totals.total_in)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 mb-1">Total Egresos</p>
          <p className="font-semibold text-red-700 text-lg">{formatCurrency(data.totals.total_out)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 mb-1">Balance Neto</p>
          <p className={`font-semibold text-lg ${data.totals.net_balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {formatCurrency(data.totals.net_balance)}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Forma de Pago</th>
              <th className="px-4 py-3 text-right">Transacciones</th>
              <th className="px-4 py-3 text-right">Ingresos</th>
              <th className="px-4 py-3 text-right">Egresos</th>
              <th className="px-4 py-3 text-right">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.cash_flow.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{item.payment_method}</td>
                <td className="px-4 py-3 text-right">{item.transactions}</td>
                <td className="px-4 py-3 text-right text-green-700">{formatCurrency(item.total_in)}</td>
                <td className="px-4 py-3 text-right text-red-700">{formatCurrency(item.total_out)}</td>
                <td className={`px-4 py-3 text-right font-medium ${item.balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {formatCurrency(item.balance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FiscalReportsPage;
