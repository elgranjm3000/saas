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
      {/* Header con nuevo diseño */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-light mb-3" style={{ color: 'var(--color-primary)' }}>Departamentos</h1>
            <p className="font-light text-lg" style={{ color: 'var(--color-text-light)' }}>
              Gestiona los departamentos de tus productos
            </p>
          </div>
          <Link
            href="/departamentos/new"
            className="btn-primary flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span>Nuevo Departamento</span>
          </Link>
        </div>

        {/* Stats Cards con nuevo diseño */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="erp-stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-light)' }}>
                  Total Departamentos
                </p>
                <p className="erp-stat-value">{stats.total}</p>
              </div>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'var(--color-primary)' }}>
                <FolderKanban className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="erp-stat-card" style={{ borderLeftColor: 'var(--color-accent)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-light)' }}>
                  Con Productos
                </p>
                <p className="erp-stat-value">{stats.withProducts}</p>
              </div>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'var(--color-accent)' }}>
                <FolderKanban className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="erp-card p-6 mb-8">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-light)' }} />
          <input
            type="text"
            placeholder="Buscar departamentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="erp-input w-full pl-12"
          />
        </div>
      </div>

      {/* Categories Table */}
      <div className="erp-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Departamento</th>
                <th>Descripción</th>
                <th>Productos</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCategories.map((category) => (
                <tr key={category.id}>
                  <td className="py-4 px-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mr-4" style={{ background: 'var(--color-primary)' }}>
                        <FolderKanban className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-medium" style={{ color: 'var(--color-text)' }}>{category.name}</p>
                        <p className="text-sm" style={{ color: 'var(--color-text-light)' }}>ID: {category.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6" style={{ color: 'var(--color-text-light)' }}>
                    {category.description || '-'}
                  </td>
                  <td className="py-4 px-6">
                    <span className="erp-badge success">
                      {productCounts[category.id] || 0} productos
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/departamentos/${category.id}`}
                        className="p-2 rounded-xl transition-colors hover:bg-[var(--color-primary)] hover:text-white"
                        style={{ color: 'var(--color-text-light)' }}
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/departamentos/${category.id}/edit`}
                        className="p-2 rounded-xl transition-colors hover:bg-[var(--color-success)] hover:text-white"
                        style={{ color: 'var(--color-text-light)' }}
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="p-2 rounded-xl transition-colors hover:bg-[var(--color-danger)] hover:text-white"
                        style={{ color: 'var(--color-text-light)' }}
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
            <FolderKanban className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--color-text-light)' }} />
            <h3 className="text-xl font-light mb-2" style={{ color: 'var(--color-text)' }}>No hay departamentos</h3>
            <p className="mb-6" style={{ color: 'var(--color-text-light)' }}>
              {searchTerm ? 'No se encontraron departamentos con ese término de búsqueda.' : 'Comienza agregando tu primer departamento.'}
            </p>
            <Link
              href="/departamentos/new"
              className="btn-primary inline-flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span>Agregar Departamento</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoriesPage;
