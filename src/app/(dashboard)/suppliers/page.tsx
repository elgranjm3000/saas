'use client'
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Truck, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  Mail,
  Phone,
  MapPin,
  Hash,
  List,
  ArrowUpDown,
  Download,
  Upload,
  Loader2,
  Building2,
  UserCheck,
  UserX,
  Contact
} from 'lucide-react';
import { suppliersAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface Supplier {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  contact_person?: string;
  company_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const SuppliersPage = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedSuppliers, setSelectedSuppliers] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'created_at'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await suppliersAPI.getAll();
      setSuppliers(response.data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este proveedor?')) {
      try {
        await suppliersAPI.delete(id);
        setSuppliers(suppliers.filter(s => s.id !== id));
      } catch (error) {
        console.error('Error deleting supplier:', error);
      }
    }
  };

  const filteredSuppliers = suppliers
    .filter(supplier => {
      const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (supplier.tax_id && supplier.tax_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (supplier.contact_person && supplier.contact_person.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === '' || 
                           (statusFilter === 'active' && supplier.is_active) ||
                           (statusFilter === 'inactive' && !supplier.is_active);
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];
      
      if (sortBy === 'created_at') {
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
      }
      
      const modifier = sortOrder === 'asc' ? 1 : -1;
      return aValue > bValue ? modifier : -modifier;
    });

  const stats = {
    total: suppliers.length,
    active: suppliers.filter(s => s.is_active).length,
    inactive: suppliers.filter(s => !s.is_active).length,
    thisMonth: suppliers.filter(s => {
      const supplierDate = new Date(s.created_at);
      const now = new Date();
      return supplierDate.getMonth() === now.getMonth() && supplierDate.getFullYear() === now.getFullYear();
    }).length
  };

  const SupplierCard = ({ supplier }: { supplier: Supplier }) => {
    return (
      <div className="group bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-gray-100 hover:shadow-xl hover:shadow-gray-500/10 transition-all duration-300 hover:-translate-y-1">
        <div className="flex items-start justify-between mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center">
            <Truck className="w-8 h-8 text-orange-600" />
          </div>
          <div className="flex items-center space-x-2">
            <Link
              href={`/suppliers/${supplier.id}`}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
            >
              <Eye className="w-4 h-4" />
            </Link>
            <Link
              href={`/suppliers/${supplier.id}/edit`}
              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-colors"
            >
              <Edit className="w-4 h-4" />
            </Link>
            <button 
              onClick={() => handleDelete(supplier.id)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900 mb-2 line-clamp-2">
            {supplier.name}
          </h3>
          <div className="space-y-1">
            <div className="flex items-center text-sm text-gray-500">
              <Mail className="w-3 h-3 mr-2" />
              {supplier.email}
            </div>
            {supplier.phone && (
              <div className="flex items-center text-sm text-gray-500">
                <Phone className="w-3 h-3 mr-2" />
                {supplier.phone}
              </div>
            )}
            {supplier.contact_person && (
              <div className="flex items-center text-sm text-gray-500">
                <Contact className="w-3 h-3 mr-2" />
                {supplier.contact_person}
              </div>
            )}
            {supplier.tax_id && (
              <div className="flex items-center text-sm text-gray-500">
                <Hash className="w-3 h-3 mr-2" />
                {supplier.tax_id}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className={`flex items-center px-3 py-1 text-sm rounded-full ${
            supplier.is_active 
              ? 'bg-green-100 text-green-600' 
              : 'bg-red-100 text-red-600'
          }`}>
            {supplier.is_active ? (
              <>
                <UserCheck className="w-3 h-3 mr-1" />
                Activo
              </>
            ) : (
              <>
                <UserX className="w-3 h-3 mr-1" />
                Inactivo
              </>
            )}
          </span>
          <span className="text-xs text-gray-500">
            {formatDate(supplier.created_at)}
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
            <h1 className="text-3xl font-light text-gray-900 mb-3">Proveedores</h1>
            <p className="text-gray-500 font-light text-lg">
              Gestiona tu red de proveedores y contactos comerciales
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
              href="/suppliers/new"
              className="flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl hover:from-orange-600 hover:to-orange-700 transition-all transform hover:scale-[1.02] shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="font-light">Nuevo Proveedor</span>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Total Proveedores
                </p>
                <p className="text-2xl font-light text-gray-900">{stats.total}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Truck className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Proveedores Activos
                </p>
                <p className="text-2xl font-light text-green-600">{stats.active}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                <UserCheck className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Proveedores Inactivos
                </p>
                <p className="text-2xl font-light text-red-600">{stats.inactive}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                <UserX className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Este Mes
                </p>
                <p className="text-2xl font-light text-purple-600">{stats.thisMonth}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Building2 className="w-7 h-7 text-white" />
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
                placeholder="Buscar por nombre, email, contacto o tax ID..."
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
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>

            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'email' | 'created_at')}
              className="px-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
            >
              <option value="name">Ordenar por Nombre</option>
              <option value="email">Ordenar por Email</option>
              <option value="created_at">Ordenar por Fecha</option>
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
                <Truck className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Suppliers Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredSuppliers.map((supplier) => (
            <SupplierCard key={supplier.id} supplier={supplier} />
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
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Proveedor</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Email</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Teléfono</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Contacto</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Tax ID</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Estado</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center mr-4">
                          <Truck className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{supplier.name}</p>
                          <p className="text-sm text-gray-500">ID: {supplier.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-900">
                      {supplier.email}
                    </td>
                    <td className="py-4 px-6 text-gray-900">
                      {supplier.phone || '-'}
                    </td>
                    <td className="py-4 px-6 text-gray-900">
                      {supplier.contact_person || '-'}
                    </td>
                    <td className="py-4 px-6 text-gray-900 font-mono text-sm">
                      {supplier.tax_id || '-'}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`flex items-center px-3 py-1 text-sm rounded-full ${
                        supplier.is_active 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {supplier.is_active ? (
                          <>
                            <UserCheck className="w-3 h-3 mr-1" />
                            Activo
                          </>
                        ) : (
                          <>
                            <UserX className="w-3 h-3 mr-1" />
                            Inactivo
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/suppliers/${supplier.id}`}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/suppliers/${supplier.id}/edit`}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => handleDelete(supplier.id)}
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
                Mostrando <span className="font-medium">1</span> a <span className="font-medium">{filteredSuppliers.length}</span> de{' '}
                <span className="font-medium">{filteredSuppliers.length}</span> proveedores
              </p>
              <div className="flex items-center space-x-2">
                <button className="px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-light">
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {filteredSuppliers.length === 0 && !loading && (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 p-12 text-center">
          <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-light text-gray-900 mb-2">No hay proveedores</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm ? 'No se encontraron proveedores con ese término de búsqueda.' : 'Comienza agregando tu primer proveedor.'}
          </p>
          <Link
            href="/suppliers/new"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl hover:from-orange-600 hover:to-orange-700 transition-all transform hover:scale-[1.02] shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="font-light">Agregar Proveedor</span>
          </Link>
        </div>
      )}
    </div>
  );
};

export default SuppliersPage;