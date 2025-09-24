'use client'
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  Package,
  Calendar,
  DollarSign,
  Truck,
  Building2,
  List,
  ArrowUpDown,
  Download,
  Upload,
  Loader2,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { purchasesAPI } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Purchase {
  id: number;
  company_id: number;
  supplier_id: number;
  warehouse_id?: number;
  purchase_number: string;
  date: string;
  expected_delivery_date?: string;
  total_amount: number;
  status: 'pending' | 'approved' | 'received' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
  supplier?: {
    id: number;
    name: string;
    email: string;
  };
  items: PurchaseItem[];
}

interface PurchaseItem {
  id?: number;
  product_id: number;
  quantity: number;
  price_per_unit: number;
  total_price: number;
  product?: {
    id: number;
    name: string;
    sku: string;
  };
}

const PurchasesPage = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedPurchases, setSelectedPurchases] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<'purchase_number' | 'date' | 'total_amount' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    fetchPurchases();
  }, [statusFilter]);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const response = await purchasesAPI.getAll({
        status: statusFilter || undefined,
        limit: 100
      });
      setPurchases(response.data);
    } catch (error) {
      console.error('Error fetching purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta compra?')) {
      try {
        await purchasesAPI.delete(id);
        setPurchases(purchases.filter(p => p.id !== id));
      } catch (error) {
        console.error('Error deleting purchase:', error);
      }
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await purchasesAPI.updateStatus(id, newStatus);
      setPurchases(purchases.map(p => 
        p.id === id ? { ...p, status: newStatus as Purchase['status'] } : p
      ));
    } catch (error) {
      console.error('Error updating purchase status:', error);
    }
  };

  const getPurchaseStatus = (status: Purchase['status']) => {
    switch (status) {
      case 'pending':
        return { 
          status: 'pending', 
          color: 'text-yellow-600', 
          bg: 'bg-yellow-100', 
          icon: Clock,
          label: 'Pendiente' 
        };
      case 'approved':
        return { 
          status: 'approved', 
          color: 'text-blue-600', 
          bg: 'bg-blue-100', 
          icon: CheckCircle,
          label: 'Aprobada' 
        };
      case 'received':
        return { 
          status: 'received', 
          color: 'text-green-600', 
          bg: 'bg-green-100', 
          icon: Package,
          label: 'Recibida' 
        };
      case 'cancelled':
        return { 
          status: 'cancelled', 
          color: 'text-red-600', 
          bg: 'bg-red-100', 
          icon: XCircle,
          label: 'Cancelada' 
        };
      default:
        return { 
          status: 'unknown', 
          color: 'text-gray-600', 
          bg: 'bg-gray-100', 
          icon: Clock,
          label: 'Desconocido' 
        };
    }
  };

  const filteredPurchases = purchases
    .filter(purchase =>
      purchase.purchase_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.total_amount.toString().includes(searchTerm) ||
      (purchase.supplier?.name && purchase.supplier.name.toLowerCase().includes(searchTerm.toLowerCase()))
    )
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
    total: purchases.length,
    totalAmount: purchases.reduce((sum, p) => sum + p.total_amount, 0),
    pending: purchases.filter(p => p.status === 'pending').length,
    received: purchases.filter(p => p.status === 'received').length,
    thisMonth: purchases.filter(p => {
      const purchaseDate = new Date(p.date);
      const now = new Date();
      return purchaseDate.getMonth() === now.getMonth() && purchaseDate.getFullYear() === now.getFullYear();
    }).length
  };

  const PurchaseCard = ({ purchase }: { purchase: Purchase }) => {
    const status = getPurchaseStatus(purchase.status);
    const StatusIcon = status.icon;
    
    return (
      <div className="group bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-gray-100 hover:shadow-xl hover:shadow-gray-500/10 transition-all duration-300 hover:-translate-y-1">
        <div className="flex items-start justify-between mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center">
            <ShoppingCart className="w-8 h-8 text-purple-600" />
          </div>
          <div className="flex items-center space-x-2">
            <Link
              href={`/purchases/${purchase.id}`}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
            >
              <Eye className="w-4 h-4" />
            </Link>
            <Link
              href={`/purchases/${purchase.id}/edit`}
              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-colors"
            >
              <Edit className="w-4 h-4" />
            </Link>
            <button 
              onClick={() => handleDelete(purchase.id)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {purchase.purchase_number}
          </h3>
          <div className="space-y-1">
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="w-3 h-3 mr-2" />
              {formatDate(purchase.date)}
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <Package className="w-3 h-3 mr-2" />
              {purchase.items.length} productos
            </div>
            {purchase.supplier && (
              <div className="flex items-center text-sm text-gray-500">
                <Truck className="w-3 h-3 mr-2" />
                {purchase.supplier.name}
              </div>
            )}
          </div>
        </div>
        
        <div className="mb-4">
          <p className="text-2xl font-light text-gray-900">
            {formatCurrency(purchase.total_amount)}
          </p>
        </div>
        
        <div className="flex items-center justify-between">
          <span className={`flex items-center px-3 py-1 text-sm rounded-full ${status.bg} ${status.color}`}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {status.label}
          </span>
          
          {purchase.status === 'pending' && (
            <select
              onChange={(e) => handleStatusChange(purchase.id, e.target.value)}
              className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1"
              defaultValue=""
            >
              <option value="" disabled>Cambiar estado</option>
              <option value="approved">Aprobar</option>
              <option value="cancelled">Cancelar</option>
            </select>
          )}
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
            <h1 className="text-3xl font-light text-gray-900 mb-3">Compras</h1>
            <p className="text-gray-500 font-light text-lg">
              Gestiona tus órdenes de compra y proveedores
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
              href="/purchases/new"
              className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl hover:from-purple-600 hover:to-purple-700 transition-all transform hover:scale-[1.02] shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="font-light">Nueva Compra</span>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Total Compras
                </p>
                <p className="text-2xl font-light text-gray-900">{stats.total}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <ShoppingCart className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Monto Total
                </p>
                <p className="text-2xl font-light text-green-600">{formatCurrency(stats.totalAmount)}</p>
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
                <p className="text-2xl font-light text-yellow-600">{stats.pending}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Clock className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Este Mes
                </p>
                <p className="text-2xl font-light text-blue-600">{stats.thisMonth}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Calendar className="w-7 h-7 text-white" />
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
                placeholder="Buscar por número de compra, monto o proveedor..."
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
              <option value="pending">Pendientes</option>
              <option value="approved">Aprobadas</option>
              <option value="received">Recibidas</option>
              <option value="cancelled">Canceladas</option>
            </select>

            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
            >
              <option value="date">Ordenar por Fecha</option>
              <option value="purchase_number">Ordenar por Número</option>
              <option value="total_amount">Ordenar por Monto</option>
              <option value="status">Ordenar por Estado</option>
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
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-xl transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Purchases Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPurchases.map((purchase) => (
            <PurchaseCard key={purchase.id} purchase={purchase} />
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
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Número</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Fecha</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Proveedor</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Productos</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Total</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Estado</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPurchases.map((purchase) => {
                  const status = getPurchaseStatus(purchase.status);
                  const StatusIcon = status.icon;
                  return (
                    <tr key={purchase.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <input type="checkbox" className="rounded border-gray-300" />
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mr-4">
                            <ShoppingCart className="w-6 h-6 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{purchase.purchase_number}</p>
                            <p className="text-sm text-gray-500">ID: {purchase.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-900">
                        {formatDate(purchase.date)}
                      </td>
                      <td className="py-4 px-6 text-gray-900">
                        {purchase.supplier?.name || '-'}
                      </td>
                      <td className="py-4 px-6 text-gray-900">
                        {purchase.items.length} productos
                      </td>
                      <td className="py-4 px-6 font-medium text-gray-900">
                        {formatCurrency(purchase.total_amount)}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`flex items-center px-3 py-1 text-sm rounded-full ${status.bg} ${status.color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status.label}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <Link
                            href={`/purchases/${purchase.id}`}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/purchases/${purchase.id}/edit`}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button 
                            onClick={() => handleDelete(purchase.id)}
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
                Mostrando <span className="font-medium">1</span> a <span className="font-medium">{filteredPurchases.length}</span> de{' '}
                <span className="font-medium">{filteredPurchases.length}</span> compras
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

      {filteredPurchases.length === 0 && !loading && (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 p-12 text-center">
          <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-light text-gray-900 mb-2">No hay compras</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm ? 'No se encontraron compras con ese término de búsqueda.' : 'Comienza creando tu primera orden de compra.'}
          </p>
          <Link
            href="/purchases/new"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl hover:from-purple-600 hover:to-purple-700 transition-all transform hover:scale-[1.02] shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="font-light">Crear Compra</span>
          </Link>
        </div>
      )}
    </div>
  );
};

export default PurchasesPage;