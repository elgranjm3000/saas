'use client'
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Warehouse as WarehouseIcon,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  MapPin,
  Package,
  TrendingUp,
  BarChart3,
  List,
  ArrowUpDown,
  Download,
  Upload,
  Building2,
  AlertTriangle
} from 'lucide-react';
import { warehousesAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Warehouse } from '@/types/warehouse';
import { ListItemSkeleton } from '@/components/Skeleton';

const WarehousesPage = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedWarehouses, setSelectedWarehouses] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'address'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [lowStockData, setLowStockData] = useState<Record<number, number>>({});

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const response = await warehousesAPI.getAll();
      setWarehouses(response.data);

      // Fetch low stock data for each warehouse
      const lowStockCounts: Record<number, number> = {};
      await Promise.all(
        response.data.map(async (warehouse: Warehouse) => {
          try {
            const lowStockResponse = await warehousesAPI.getLowStock(warehouse.id, 10);
            lowStockCounts[warehouse.id] = lowStockResponse.data?.length || 0;
          } catch (error) {
            lowStockCounts[warehouse.id] = 0;
          }
        })
      );
      setLowStockData(lowStockCounts);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este almacén? Esta acción no se puede deshacer.')) {
      try {
        await warehousesAPI.delete(id);
        setWarehouses(warehouses.filter(w => w.id !== id));
      } catch (error) {
        console.error('Error deleting warehouse:', error);
        alert('Error al eliminar el almacén');
      }
    }
  };

  const filteredWarehouses = warehouses
    .filter(warehouse =>
      warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (warehouse.address && warehouse.address.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      const aValue = sortBy === 'address' ? (a.address || '') : a.name;
      const bValue = sortBy === 'address' ? (b.address || '') : b.name;
      const modifier = sortOrder === 'asc' ? 1 : -1;
      return aValue > bValue ? modifier : -modifier;
    });

  const stats = {
    total: warehouses.length,
    totalLowStock: Object.values(lowStockData).reduce((sum, count) => sum + count, 0)
  };

  const WarehouseCard = ({ warehouse }: { warehouse: Warehouse }) => {
    return (
      <div className="erp-card group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <div className="flex items-start justify-between mb-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'var(--color-success)' }}>
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <div className="flex items-center space-x-2">
            <Link
              href={`/warehouses/${warehouse.id}`}
              className="p-2 rounded-xl transition-colors hover:bg-[var(--color-primary)] hover:text-white"
              style={{ color: 'var(--color-text-light)' }}
            >
              <Eye className="w-4 h-4" />
            </Link>
            <Link
              href={`/warehouses/${warehouse.id}/edit`}
              className="p-2 rounded-xl transition-colors hover:bg-[var(--color-success)] hover:text-white"
              style={{ color: 'var(--color-text-light)' }}
            >
              <Edit className="w-4 h-4" />
            </Link>
            <button
              onClick={() => handleDelete(warehouse.id)}
              className="p-2 rounded-xl transition-colors hover:bg-[var(--color-danger)] hover:text-white"
              style={{ color: 'var(--color-text-light)' }}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--color-text)' }}>
            {warehouse.name}
          </h3>
          {warehouse.location && (
            <div className="flex items-center text-sm mb-3" style={{ color: 'var(--color-text-light)' }}>
              <MapPin className="w-4 h-4 mr-1" />
              {warehouse.location}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">ID</p>
            <p className="text-xl font-light text-gray-900">
              #{warehouse.id}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Stock Bajo</p>
            <p className="text-xl font-light text-orange-600">
              {lowStockData[warehouse.id] || 0}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Link
            href={`/warehouses/${warehouse.id}/products`}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Ver productos →
          </Link>
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
            <h1 className="text-3xl font-light text-gray-900 mb-3">Almacenes</h1>
            <p className="text-gray-500 font-light text-lg">
              Gestiona tus ubicaciones de almacenamiento e inventario
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
              href="/warehouses/new"
              className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-[1.02] shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="font-light">Nuevo Almacén</span>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Total Almacenes
                </p>
                <p className="text-2xl font-light text-gray-900">{stats.total}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Building2 className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Stock Bajo
                </p>
                <p className="text-2xl font-light text-orange-600">{stats.totalLowStock}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                <AlertTriangle className="w-7 h-7 text-white" />
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
                placeholder="Buscar almacenes por nombre o ubicación..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'address')}
              className="px-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
            >
              <option value="name">Ordenar por Nombre</option>
              <option value="address">Ordenar por Dirección</option>
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
                <BarChart3 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Warehouses Content */}
      {loading ? (
        <ListItemSkeleton count={6} />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredWarehouses.map((warehouse) => (
            <WarehouseCard key={warehouse.id} warehouse={warehouse} />
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
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Almacén</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Dirección</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">ID</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Stock Bajo</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredWarehouses.map((warehouse) => (
                  <tr key={warehouse.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mr-4">
                          <Building2 className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{warehouse.name}</p>
                          {warehouse.phone && (
                            <p className="text-sm text-gray-500">{warehouse.phone}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {warehouse.address ? (
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-gray-900">{warehouse.address}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-gray-900 font-mono text-sm">
                      #{warehouse.id}
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full">
                        {lowStockData[warehouse.id] || 0} productos
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/warehouses/${warehouse.id}`}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/warehouses/${warehouse.id}/edit`}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(warehouse.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="bg-gray-50/80 px-6 py-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 font-light">
                Mostrando <span className="font-medium">1</span> a <span className="font-medium">{filteredWarehouses.length}</span> de{' '}
                <span className="font-medium">{filteredWarehouses.length}</span> almacenes
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

      {filteredWarehouses.length === 0 && !loading && (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 p-12 text-center">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-light text-gray-900 mb-2">No hay almacenes</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm ? 'No se encontraron almacenes con ese término de búsqueda.' : 'Comienza agregando tu primer almacén.'}
          </p>
          <Link
            href="/warehouses/new"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-[1.02] shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="font-light">Agregar Almacén</span>
          </Link>
        </div>
      )}
    </div>
  );
};

export default WarehousesPage;