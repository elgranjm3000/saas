'use client'
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FolderKanban,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { categoriesAPI } from '@/lib/api';

interface Category {
  id: number;
  name: string;
  description?: string;
  product_count?: number;
  created_at: string;
}

const CategoriesPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [productCounts, setProductCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoriesAPI.getAll();
      const categoriesData = response.data || [];
      setCategories(categoriesData);

      // Fetch product count for each category
      const counts: Record<number, number> = {};
      await Promise.all(
        categoriesData.map(async (category: Category) => {
          try {
            const productsResponse = await categoriesAPI.getProducts(category.id);
            counts[category.id] = productsResponse.data?.length || 0;
          } catch (error) {
            console.error(`Error fetching products for category ${category.id}:`, error);
            counts[category.id] = 0;
          }
        })
      );
      setProductCounts(counts);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este departamento?')) {
      try {
        await categoriesAPI.delete(id);
        setCategories(categories.filter(c => c.id !== id));
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Error al eliminar el departamento');
      }
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: categories.length,
    withProducts: categories.filter(c => productCounts[c.id] && productCounts[c.id] > 0).length
  };

  if (loading) {
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
            <h1 className="text-3xl font-light text-gray-900 mb-3">Departamentos</h1>
            <p className="text-gray-500 font-light text-lg">
              Gestiona los departamentos de tus productos
            </p>
          </div>
          <Link
            href="/departamentos/new"
            className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-[1.02] shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="font-light">Nuevo Departamento</span>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Total Departamentos
                </p>
                <p className="text-2xl font-light text-gray-900">{stats.total}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <FolderKanban className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Con Productos
                </p>
                <p className="text-2xl font-light text-gray-900">{stats.withProducts}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <FolderKanban className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 p-6 mb-8">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar departamentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
          />
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/80 border-b border-gray-100">
              <tr>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Departamento</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Descripción</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Productos</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCategories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mr-4">
                        <FolderKanban className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{category.name}</p>
                        <p className="text-sm text-gray-500">ID: {category.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-gray-600">
                    {category.description || '-'}
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                      {productCounts[category.id] || 0} productos
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/departamentos/${category.id}`}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/departamentos/${category.id}/edit`}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(category.id)}
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

        {filteredCategories.length === 0 && !loading && (
          <div className="p-12 text-center">
            <FolderKanban className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-light text-gray-900 mb-2">No hay departamentos</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm ? 'No se encontraron departamentos con ese término de búsqueda.' : 'Comienza agregando tu primer departamento.'}
            </p>
            <Link
              href="/departamentos/new"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-[1.02] shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="font-light">Agregar Departamento</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoriesPage;
