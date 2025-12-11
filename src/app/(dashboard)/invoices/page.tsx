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
  Loader2,
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
import { invoicesAPI } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Invoice {
  id: number;
  invoice_number: string;
  customer_id: number;
  customer?: {
    id: number;
    name: string;
    email: string;
  };
  issue_date: string;
  due_date?: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: 'presupuesto' | 'pendiente' | 'pagada' | 'vencida' | 'cancelada';
  company_id: number;
  created_at: string;
  updated_at: string;
}

const InvoicesPage = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState<'invoice_number' | 'issue_date' | 'total_amount'>('issue_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await invoicesAPI.getAll();
      setInvoices(response.data);
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

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { color: string; bg: string; icon: any; label: string }> = {
      'presupuesto': { color: 'text-blue-600', bg: 'bg-blue-100', icon: FileText, label: 'Presupuesto' },
      'pendiente': { color: 'text-orange-600', bg: 'bg-orange-100', icon: Clock, label: 'Pendiente' },
      'pagada': { color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle, label: 'Pagada' },
      'vencida': { color: 'text-red-600', bg: 'bg-red-100', icon: AlertTriangle, label: 'Vencida' },
      'cancelada': { color: 'text-gray-600', bg: 'bg-gray-100', icon: FileText, label: 'Cancelada' }
    };
    return statusMap[status] || statusMap['pendiente'];
  };

  const filteredInvoices = invoices
    .filter(invoice => {
      const matchesSearch = 
        invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customer?.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === '' || invoice.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];
      
      if (sortBy === 'issue_date') {
        aValue = new Date(a.issue_date).getTime();
        bValue = new Date(b.issue_date).getTime();
      }
      
      const modifier = sortOrder === 'asc' ? 1 : -1;
      return aValue > bValue ? modifier : -modifier;
    });

  const stats = {
    total: invoices.length,
    totalAmount: invoices.reduce((sum, inv) => sum + inv.total_amount, 0),
    pending: invoices.filter(inv => inv.status === 'pendiente').length,
    overdue: invoices.filter(inv => inv.status === 'vencida').length,
    paid: invoices.filter(inv => inv.status === 'pagada').length,
    quotes: invoices.filter(inv => inv.status === 'presupuesto').length,
  };

  const InvoiceCard = ({ invoice }: { invoice: Invoice }) => {
    const statusInfo = getStatusInfo(invoice.status);
    const StatusIcon = statusInfo.icon;
    
    return (
      <div className="group bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-gray-100 hover:shadow-xl hover:shadow-gray-500/10 transition-all duration-300 hover:-translate-y-1">
        <div className="flex items-start justify-between mb-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center">
            <FileText className="w-7 h-7 text-blue-600" />
          </div>
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors opacity-0 group-hover:opacity-100">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
        
        <div className="mb-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {invoice.invoice_number}
              </h3>
              <p className="text-sm text-gray-500">
                {invoice.customer?.name || 'Cliente'}
              </p>
            </div>
            <span className={`px-3 py-1 text-sm rounded-full ${statusInfo.bg} ${statusInfo.color} flex items-center`}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusInfo.label}
            </span>
          </div>
        </div>
        
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              {formatDate(invoice.issue_date)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Total</span>
            <span className="text-xl font-light text-gray-900">
              {formatCurrency(invoice.total_amount)}
            </span>
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
            <button className="flex items-center px-4 py-3 text-gray-600 bg-white/80 border border-gray-200/60 rounded-2xl hover:bg-white hover:border-gray-300 transition-all">
              <Upload className="w-4 h-4 mr-2" />
              <span className="font-light">Importar</span>
            </button>
            <button className="flex items-center px-4 py-3 text-gray-600 bg-white/80 border border-gray-200/60 rounded-2xl hover:bg-white hover:border-gray-300 transition-all">
              <Download className="w-4 h-4 mr-2" />
              <span className="font-light">Exportar</span>
            </button>
            <Link
              href="/invoices/new"
              className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-[1.02] shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="font-light">Nueva Factura</span>
            </Link>
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
                <p className="text-2xl font-light text-gray-900">{formatCurrency(stats.totalAmount)}</p>
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
                  Pendientes
                </p>
                <p className="text-2xl font-light text-orange-600">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
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

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Pagadas
                </p>
                <p className="text-2xl font-light text-green-600">{stats.paid}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 p-6 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 min-w-80">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por número, cliente o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
            >
              <option value="">Todos los estados</option>
              <option value="presupuesto">Presupuesto</option>
              <option value="pendiente">Pendiente</option>
              <option value="pagada">Pagada</option>
              <option value="vencida">Vencida</option>
              <option value="cancelada">Cancelada</option>
            </select>

            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
            >
              <option value="issue_date">Ordenar por Fecha</option>
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
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
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
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Estado</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredInvoices.map((invoice) => {
                  const statusInfo = getStatusInfo(invoice.status);
                  const StatusIcon = statusInfo.icon;
                  
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
                        <div>
                          <p className="font-medium text-gray-900">{invoice.customer?.name || '-'}</p>
                          <p className="text-sm text-gray-500">{invoice.customer?.email || '-'}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-900">
                        {formatDate(invoice.issue_date)}
                      </td>
                      <td className="py-4 px-6 text-gray-900">
                        {invoice.due_date ? formatDate(invoice.due_date) : '-'}
                      </td>
                      <td className="py-4 px-6 font-medium text-gray-900">
                        {formatCurrency(invoice.total_amount)}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 text-sm rounded-full ${statusInfo.bg} ${statusInfo.color} inline-flex items-center`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusInfo.label}
                        </span>
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
            href="/invoices/new"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-[1.02] shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="font-light">Nueva Factura</span>
          </Link>
        </div>
      )}
    </div>
  );
};

export default InvoicesPage;