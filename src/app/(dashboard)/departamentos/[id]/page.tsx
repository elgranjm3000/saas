'use client'
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Edit,
  Trash2,
  FolderKanban,
  Calendar,
  Package,
  Loader2
} from 'lucide-react';
import { categoriesAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface Category {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

interface CategoryDetailPageProps {
  params: {
    id: string;
  };
}

const CategoryDetailPage = ({ params }: CategoryDetailPageProps) => {
  const [category, setCategory] = useState<Category | null>(null);
  const [productCount, setProductCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (params.id) {
      fetchCategory();
    }
  }, [params.id]);

  const fetchCategory = async () => {
    try {
      setLoading(true);
      const response = await categoriesAPI.getById(Number(params.id));
      setCategory(response.data);

      // Fetch product count using the correct endpoint
      try {
        const productsResponse = await categoriesAPI.getProducts(Number(params.id));
        setProductCount(productsResponse.data?.length || 0);
      } catch (error) {
        console.error('Error fetching product count:', error);
        setProductCount(0);
      }
    } catch (error: any) {
      console.error('Error fetching category:', error);
      setError('Error al cargar el departamento');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!category) return;

    if (window.confirm('¿Estás seguro de que quieres eliminar este departamento? Esta acción no se puede deshacer.')) {
      try {
        await categoriesAPI.delete(category.id);
        router.push('/departamentos');
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Error al eliminar el departamento');
      }
    }
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

  if (error || !category) {
    return (
      <div className="p-6 lg:p-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 p-12 text-center">
          <FolderKanban className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-light text-gray-900 mb-2">Departamento no encontrado</h3>
          <p className="text-gray-500 mb-6">
            {error || 'El departamento que buscas no existe o fue eliminado.'}
          </p>
          <Link
            href="/departamentos"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-[1.02] shadow-lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="font-light">Volver a Departamentos</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link
              href="/departamentos"
              className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-2xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-light text-gray-900 mb-2">{category.name}</h1>
              <p className="text-gray-500 font-light">ID: {category.id}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href={`/departamentos/${category.id}/edit`}
              className="flex items-center px-4 py-3 text-white bg-gradient-to-r from-green-500 to-green-600 rounded-2xl hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-[1.02] shadow-lg"
            >
              <Edit className="w-4 h-4 mr-2" />
              <span className="font-light">Editar</span>
            </Link>
            <button
              onClick={handleDelete}
              className="flex items-center px-4 py-3 text-white bg-gradient-to-r from-red-500 to-red-600 rounded-2xl hover:from-red-600 hover:to-red-700 transition-all transform hover:scale-[1.02] shadow-lg"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              <span className="font-light">Eliminar</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="xl:col-span-2 space-y-8">
          {/* Category Info */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 overflow-hidden">
            <div className="p-8">
              <div className="flex items-start space-x-6">
                {/* Category Icon */}
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-3xl flex items-center justify-center">
                  <FolderKanban className="w-12 h-12 text-blue-600" />
                </div>

                {/* Category Info */}
                <div className="flex-1">
                  <div className="mb-4">
                    <h2 className="text-2xl font-light text-gray-900 mb-2">{category.name}</h2>
                  </div>

                  {category.description && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Descripción</h3>
                      <p className="text-gray-600 leading-relaxed">
                        {category.description}
                      </p>
                    </div>
                  )}

                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-gray-50/80 rounded-2xl p-4">
                      <div className="flex items-center mb-2">
                        <Package className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-500">Productos</span>
                      </div>
                      <p className="text-2xl font-light text-gray-900">
                        {productCount}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-light text-gray-900">Detalles del Departamento</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center">
                  <FolderKanban className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">ID del Departamento</p>
                    <p className="font-medium text-gray-900">{category.id}</p>
                  </div>
                </div>

                {category.created_at && (
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Fecha de Creación</p>
                      <p className="font-medium text-gray-900">
                        {formatDate(category.created_at, 'long')}
                      </p>
                    </div>
                  </div>
                )}

                {category.updated_at && (
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Última Actualización</p>
                      <p className="font-medium text-gray-900">
                        {formatDate(category.updated_at, 'long')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-light text-gray-900">Estadísticas</h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Productos asociados</span>
                  <span className="font-medium text-gray-900">
                    {productCount}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-light text-gray-900">Acciones Rápidas</h3>
            </div>
            <div className="p-6 space-y-3">
              <Link
                href={`/departamentos/${category.id}/edit`}
                className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-[1.02] shadow-lg"
              >
                <Edit className="w-4 h-4 mr-3" />
                <span className="font-light">Editar Departamento</span>
              </Link>
              <Link
                href="/products"
                className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-[1.02] shadow-lg"
              >
                <Package className="w-4 h-4 mr-3" />
                <span className="font-light">Ver Productos</span>
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-light text-gray-900">Actividad</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Departamento creado</p>
                    <p className="text-xs text-gray-500">
                      {category.created_at ? formatDate(category.created_at) : 'Fecha no disponible'}
                    </p>
                  </div>
                </div>

                <div className="text-center py-8">
                  <FolderKanban className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">
                    No hay más actividad registrada
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryDetailPage;
