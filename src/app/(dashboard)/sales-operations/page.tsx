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
  Printer,
  Send,
  RefreshCw,
  Package,
  ShoppingCart,
  Truck,
  Receipt,
  FileCode,
  FileMinus
} from 'lucide-react';
import { salesOperationsAPI, customersAPI } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ListItemSkeleton } from '@/components/Skeleton';
import { SalesOperation, OperationType } from '@/types/sales-operation';

// ✅ SISTEMA ESCRITORIO: Configuración de tipos de documentos
const OPERATION_TYPES: { type: OperationType; label: string; icon: any; color: string; bgColor: string }[] = [
  { type: 'BUDGET', label: 'Presupuesto', icon: FileCode, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  { type: 'ORDER', label: 'Pedido', icon: ShoppingCart, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  { type: 'DELIVERYNOTE', label: 'Entrega', icon: Truck, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  { type: 'BILL', label: 'Factura', icon: Receipt, color: 'text-green-600', bgColor: 'bg-green-100' },
  { type: 'CREDITNOTE', label: 'NC', icon: FileMinus, color: 'text-red-600', bgColor: 'bg-red-100' },
  { type: 'DEBITNOTE', label: 'ND', icon: FileText, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
];

// ✅ SISTEMA ESCRITORIO: Flujo de conversión
const CONVERSION_FLOW: Record<OperationType, OperationType[]> = {
  'BUDGET': ['ORDER', 'BILL'],
  'ORDER': ['DELIVERYNOTE', 'BILL'],
  'DELIVERYNOTE': ['BILL'],
  'BILL': ['CREDITNOTE', 'DEBITNOTE'],
  'CREDITNOTE': [],
  'DEBITNOTE': [],
};

const SalesOperationsPage = () => {
  const [operations, setOperations] = useState<SalesOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<OperationType | 'ALL'>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState<'date' | 'total' | 'document_no'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchOperations();
  }, []);

  const fetchOperations = async () => {
    try {
      setLoading(true);
      const response = await salesOperationsAPI.getAll();
      setOperations(response.data || []);
    } catch (error) {
      console.error('Error fetching sales operations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta operación?')) {
      try {
        await salesOperationsAPI.delete(id);
        setOperations(operations.filter(op => op.id !== id));
      } catch (error) {
        console.error('Error deleting operation:', error);
      }
    }
  };

  // ✅ SISTEMA ESCRITORIO: Convertir operación a otro tipo
  const handleConvert = async (id: number, targetType: OperationType) => {
    if (!window.confirm(`¿Convertir este documento a ${OPERATION_TYPES.find(t => t.type === targetType)?.label}?`)) {
      return;
    }

    try {
      const response = await salesOperationsAPI.convert(id, targetType);
      // Actualizar la lista
      fetchOperations();
      alert(`Documento convertido exitosamente a ${OPERATION_TYPES.find(t => t.type === targetType)?.label}`);
    } catch (error: any) {
      console.error('Error converting operation:', error);
      alert(`Error al convertir: ${error.response?.data?.detail || 'Error desconocido'}`);
    }
  };

  // ✅ SISTEMA ESCRITORIO: Obtener información del tipo
  const getOperationTypeInfo = (type: OperationType) => {
    return OPERATION_TYPES.find(t => t.type === type) || OPERATION_TYPES[0];
  };

  // ✅ SISTEMA ESCRITORIO: Verificar si se puede convertir
  const canConvertTo = (currentType: OperationType): OperationType[] => {
    return CONVERSION_FLOW[currentType] || [];
  };

  // ✅ SISTEMA ESCRITORIO: Obtener estado del documento
  const getStatusInfo = (operation: SalesOperation) => {
    if (operation.canceled) {
      return { label: 'Anulado', color: 'text-red-600', bg: 'bg-red-100' };
    }
    if (operation.delivered) {
      return { label: 'Entregado', color: 'text-green-600', bg: 'bg-green-100' };
    }
    if (operation.pending) {
      return { label: 'Pendiente', color: 'text-orange-600', bg: 'bg-orange-100' };
    }
    if (operation.wait) {
      return { label: 'En Espera', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    }
    return { label: 'Procesado', color: 'text-blue-600', bg: 'bg-blue-100' };
  };

  const filteredOperations = operations
    .filter(operation => {
      const matchesSearch =
        operation.document_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (operation.client_name && operation.client_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        operation.id.toString().includes(searchTerm);

      const matchesType = selectedType === 'ALL' || operation.operation_type === selectedType;

      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortBy === 'date') {
        aValue = new Date(a.emission_date).getTime();
        bValue = new Date(b.emission_date).getTime();
      } else if (sortBy === 'total') {
        aValue = a.total;
        bValue = b.total;
      } else {
        aValue = a.document_no || '';
        bValue = b.document_no || '';
      }

      const modifier = sortOrder === 'asc' ? 1 : -1;
      return aValue > bValue ? modifier : -modifier;
    });

  const stats = {
    total: operations.length,
    budgets: operations.filter(op => op.operation_type === 'BUDGET').length,
    orders: operations.filter(op => op.operation_type === 'ORDER').length,
    deliveryNotes: operations.filter(op => op.operation_type === 'DELIVERYNOTE').length,
    bills: operations.filter(op => op.operation_type === 'BILL').length,
    pending: operations.filter(op => op.pending).length,
    delivered: operations.filter(op => op.delivered).length,
    totalAmount: operations.reduce((sum, op) => sum + (op.total || 0), 0),
  };

  const OperationCard = ({ operation }: { operation: SalesOperation }) => {
    const typeInfo = getOperationTypeInfo(operation.operation_type);
    const statusInfo = getStatusInfo(operation);
    const Icon = typeInfo.icon;
    const convertToOptions = canConvertTo(operation.operation_type);

    return (
      <div className="group bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-gray-100 hover:shadow-xl hover:shadow-gray-500/10 transition-all duration-300 hover:-translate-y-1">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-16 h-16 ${typeInfo.bgColor} rounded-2xl flex items-center justify-center`}>
            <Icon className={`w-8 h-8 ${typeInfo.color}`} />
          </div>
          <div className="flex items-center space-x-2">
            <Link
              href={`/sales-operations/${operation.id}`}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
            >
              <Eye className="w-4 h-4" />
            </Link>
            <Link
              href={`/sales-operations/${operation.id}/edit`}
              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-colors"
            >
              <Edit className="w-4 h-4" />
            </Link>
            {!operation.canceled && convertToOptions.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => {}}
                  className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-colors"
                  title="Convertir documento"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                {convertToOptions.length === 1 && (
                  <button
                    onClick={() => handleConvert(operation.id, convertToOptions[0])}
                    className="absolute top-8 right-0 z-10 px-2 py-1 bg-white shadow-lg rounded-lg text-xs whitespace-nowrap hover:bg-gray-50"
                  >
                    Convertir a {OPERATION_TYPES.find(t => t.type === convertToOptions[0])?.label}
                  </button>
                )}
              </div>
            )}
            <button
              onClick={() => handleDelete(operation.id)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className={`px-2 py-1 ${typeInfo.bgColor} ${typeInfo.color} text-xs rounded-full font-medium`}>
              {typeInfo.label}
            </span>
            <span className={`px-2 py-1 ${statusInfo.bg} ${statusInfo.color} text-xs rounded-full`}>
              {statusInfo.label}
            </span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {operation.document_no || `DOC-${operation.id}`}
          </h3>
          <div className="space-y-1">
            <div className="flex items-center text-sm text-gray-500">
              <User className="w-3 h-3 mr-2" />
              {operation.client_name || `Cliente #${operation.client_id}`}
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="w-3 h-3 mr-2" />
              {formatDate(operation.emission_date)}
            </div>
          </div>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(operation.total || 0)}
              </p>
            </div>
            {operation.total_tax > 0 && (
              <div className="text-right text-xs text-gray-500">
                <p>IVA: {formatCurrency(operation.total_tax)}</p>
                <p>Neto: {formatCurrency(operation.total_net || 0)}</p>
              </div>
            )}
          </div>
        </div>

        {/* ✅ SISTEMA ESCRITORIO: Opciones de conversión */}
        {!operation.canceled && convertToOptions.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {convertToOptions.map(targetType => {
              const targetInfo = OPERATION_TYPES.find(t => t.type === targetType);
              const TargetIcon = targetInfo?.icon;
              return (
                <button
                  key={targetType}
                  onClick={() => handleConvert(operation.id, targetType)}
                  className="flex items-center space-x-1 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors text-xs"
                  title={`Convertir a ${targetInfo?.label}`}
                >
                  <TargetIcon className="w-3 h-3" />
                  <span>{targetInfo?.label}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            #{operation.correlative}
          </span>
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
            <h1 className="text-3xl font-light text-gray-900 mb-3">Operaciones de Venta</h1>
            <p className="text-gray-500 font-light text-lg">
              Gestiona presupuestos, pedidos, entregas y facturas
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
              href="/sales-operations/new"
              className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-[1.02] shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="font-light">Nueva Operación</span>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Total Operaciones
                </p>
                <p className="text-2xl font-light text-gray-900">{stats.total}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <FileText className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Valor Total
                </p>
                <p className="text-2xl font-light text-gray-900">{formatCurrency(stats.totalAmount)}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                <DollarSign className="w-7 h-7 text-white" />
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
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Clock className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Entregadas
                </p>
                <p className="text-2xl font-light text-green-600">{stats.delivered}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats by Type */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {OPERATION_TYPES.map(({ type, label, icon: Icon, color, bgColor }) => {
            const count = operations.filter(op => op.operation_type === type).length;
            return (
              <div key={type} className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{label}</p>
                    <p className="text-xl font-semibold text-gray-900">{count}</p>
                  </div>
                  <div className={`w-10 h-10 ${bgColor} rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                </div>
              </div>
            );
          })}
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
                placeholder="Buscar por documento o cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as OperationType | 'ALL')}
              className="px-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
            >
              <option value="ALL">Todos los Tipos</option>
              {OPERATION_TYPES.map(({ type, label }) => (
                <option key={type} value={type}>{label}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'total' | 'document_no')}
              className="px-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
            >
              <option value="date">Ordenar por Fecha</option>
              <option value="total">Ordenar por Total</option>
              <option value="document_no">Ordenar por Documento</option>
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

            <div className="flex items-center space-x-1 bg-gray-50/80 rounded-2xl p-1 border border-gray-200/60">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-xl transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <FileText className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-xl transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Package className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Operations Content */}
      {loading ? (
        <ListItemSkeleton count={8} />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredOperations.map((operation) => (
            <OperationCard key={operation.id} operation={operation} />
          ))}
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">
                    <input type="checkbox" className="rounded border-gray-300" />
                  </th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Documento</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Tipo</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Cliente</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Fecha</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Total</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Estado</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOperations.map((operation) => {
                  const typeInfo = getOperationTypeInfo(operation.operation_type);
                  const statusInfo = getStatusInfo(operation);
                  const Icon = typeInfo.icon;
                  const convertToOptions = canConvertTo(operation.operation_type);

                  return (
                    <tr key={operation.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <input type="checkbox" className="rounded border-gray-300" />
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <div className={`w-10 h-10 ${typeInfo.bgColor} rounded-xl flex items-center justify-center mr-3`}>
                            <Icon className={`w-5 h-5 ${typeInfo.color}`} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {operation.document_no || `DOC-${operation.id}`}
                            </p>
                            <p className="text-xs text-gray-500">#{operation.correlative}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-1 ${typeInfo.bgColor} ${typeInfo.color} text-xs rounded-full`}>
                          {typeInfo.label}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-900 text-sm">
                        {operation.client_name || `Cliente #${operation.client_id}`}
                      </td>
                      <td className="py-4 px-6 text-gray-900 text-sm">
                        {formatDate(operation.emission_date)}
                      </td>
                      <td className="py-4 px-6 font-medium text-gray-900">
                        {formatCurrency(operation.total || 0)}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 text-sm rounded-full ${statusInfo.bg} ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <Link
                            href={`/sales-operations/${operation.id}`}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/sales-operations/${operation.id}/edit`}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          {!operation.canceled && convertToOptions.length > 0 && (
                            <button
                              onClick={() => {
                                if (convertToOptions.length === 1) {
                                  handleConvert(operation.id, convertToOptions[0]);
                                }
                              }}
                              className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-colors"
                              title={convertToOptions.length === 1 ? `Convertir a ${OPERATION_TYPES.find(t => t.type === convertToOptions[0])?.label}` : 'Opciones de conversión'}
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(operation.id)}
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
                Mostrando <span className="font-medium">1</span> a <span className="font-medium">{filteredOperations.length}</span> de{' '}
                <span className="font-medium">{filteredOperations.length}</span> operaciones
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

      {filteredOperations.length === 0 && !loading && (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-light text-gray-900 mb-2">No hay operaciones</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || selectedType !== 'ALL'
              ? 'No se encontraron operaciones con los filtros aplicados.'
              : 'Comienza agregando tu primera operación de venta.'}
          </p>
          <Link
            href="/sales-operations/new"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-[1.02] shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="font-light">Nueva Operación</span>
          </Link>
        </div>
      )}
    </div>
  );
};

export default SalesOperationsPage;
