'use client'
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
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
  UserX
} from 'lucide-react';
import { customersAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface Customer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  company_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const CustomersPage = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedCustomers, setSelectedCustomers] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'created_at'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await customersAPI.getAll();
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
      try {
        await customersAPI.delete(id);
        setCustomers(customers.filter(c => c.id !== id));
      } catch (error) {
        console.error('Error deleting customer:', error);
      }
    }
  };

  const filteredCustomers = customers
    .filter(customer => {
      const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (customer.tax_id && customer.tax_id.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === '' || 
                           (statusFilter === 'active' && customer.is_active) ||
                           (statusFilter === 'inactive' && !customer.is_active);
      
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
    total: customers.length,
    active: customers.filter(c => c.is_active).length,
    inactive: customers.filter(c => !c.is_active).length,
    thisMonth: customers.filter(c => {
      const customerDate = new Date(c.created_at);
      const now = new Date();
      return customerDate.getMonth() === now.getMonth() && customerDate.getFullYear() === now.getFullYear();
    }).length
  };

  const CustomerCard = ({ customer }: { customer: Customer }) => {
    return (
      <div className="group bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-gray-100 hover:shadow-xl hover:shadow-gray-500/10 transition-all duration-300 hover:-translate-y-1">
        <div className="flex items-start justify-between mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <div className="flex items-center space-x-2">
            <Link
              href={`/customers/${customer.id}`}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
            >
              <Eye className="w-4 h-4" />
            </Link>
            <Link
              href={`/customers/${customer.id}/edit`}
              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-colors"
            >
              <Edit className="w-4 h-4" />
            </Link>
            <button 
              onClick={() => handleDelete(customer.id)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900 mb-2 line-clamp-2">
            {customer.name}
          </h3>
          <div className="space-y-1">
            <div className="flex items-center text-sm text-gray-500">
              <Mail className="w-3 h-3 mr-2" />
              {customer.email}
            </div>
            {customer.phone && (
              <div className="flex items-center text-sm text-gray-500">
                <Phone className="w-3 h-3 mr-2" />
                {customer.phone}
              </div>
            )}
            {customer.tax_id && (
              <div className="flex items-center text-sm text-gray-500">
                <Hash className="w-3 h-3 mr-2" />
                {customer.tax_id}
              </div>
            )}
          </div>
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
            <h1 className="text-3xl font-light text-gray-900 mb-3">Clientes</h1>
            <p className="text-gray-500 font-light text-lg">
              Gestiona tu base de clientes y contactos
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
              href="/customers/new"
              className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-[1.02] shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="font-light">Nuevo Cliente</span>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Total Clientes
                </p>
                <p className="text-2xl font-light text-gray-900">{stats.total}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Users className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Clientes Activos
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
                  Clientes Inactivos
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
                placeholder="Buscar por nombre, email o tax ID..."
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
                <Users className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Customers Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCustomers.map((customer) => (
            <CustomerCard key={customer.id} customer={customer} />
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
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Cliente</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Email</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Teléfono</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Tax ID</th>
                  
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mr-4">
                          <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{customer.name}</p>
                          <p className="text-sm text-gray-500">ID: {customer.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-900">
                      {customer.email}
                    </td>
                    <td className="py-4 px-6 text-gray-900">
                      {customer.phone || '-'}
                    </td>
                    <td className="py-4 px-6 text-gray-900 font-mono text-sm">
                      {customer.tax_id || '-'}
                    </td>
                   
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/customers/${customer.id}`}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/customers/${customer.id}/edit`}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => handleDelete(customer.id)}
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
                Mostrando <span className="font-medium">1</span> a <span className="font-medium">{filteredCustomers.length}</span> de{' '}
                <span className="font-medium">{filteredCustomers.length}</span> clientes
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

      {filteredCustomers.length === 0 && !loading && (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-light text-gray-900 mb-2">No hay clientes</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm ? 'No se encontraron clientes con ese término de búsqueda.' : 'Comienza agregando tu primer cliente.'}
          </p>
          <Link
            href="/customers/new"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-[1.02] shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="font-light">Agregar Cliente</span>
          </Link>
        </div>
      )}
    </div>
  );
};

export default CustomersPage;