'use client'
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  FolderKanban,
  AlertCircle,
  CheckCircle,
  Loader2,
  FileText
} from 'lucide-react';
import { categoriesAPI } from '@/lib/api';
import { extractErrorMessage } from '@/lib/errorHandler';

interface CategoryFormData {
  name: string;
  description: string;
}

interface Category {
  id: number;
  name: string;
  description?: string;
}

const CategoryFormPage = () => {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: ''
  });

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const router = useRouter();
  const params = useParams();

  const isEdit = params?.id && params.id !== 'new';
  const categoryId = isEdit ? Number(params.id) : null;

  useEffect(() => {
    if (isEdit && categoryId) {
      fetchCategory();
    }
  }, [isEdit, categoryId]);

  const fetchCategory = async () => {
    if (!categoryId) return;

    try {
      setInitialLoading(true);
      const response = await categoriesAPI.getById(categoryId);
      const category: Category = response.data;

      setFormData({
        name: category.name || '',
        description: category.description || ''
      });
    } catch (error) {
      console.error('Error fetching category:', error);
      setErrors({ general: 'Error al cargar el departamento' });
    } finally {
      setInitialLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del departamento es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const submitData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined
      };

      if (isEdit && categoryId) {
        await categoriesAPI.update(categoryId, submitData);
      } else {
        await categoriesAPI.create(submitData);
      }

      setSuccess(true);

      setTimeout(() => {
        if (isEdit) {
          router.push(`/departamentos/${categoryId}`);
        } else {
          router.push('/departamentos');
        }
      }, 1500);

    } catch (error: any) {
      console.error('Error saving category:', error);
      setErrors({ general: extractErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
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
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-6">
          <Link
            href={isEdit ? `/departamentos/${categoryId}` : '/departamentos'}
            className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-2xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-light text-gray-900 mb-2">
              {isEdit ? 'Editar Departamento' : 'Nuevo Departamento'}
            </h1>
            <p className="text-gray-500 font-light">
              {isEdit ? 'Modifica la información del departamento' : 'Completa la información para crear un nuevo departamento'}
            </p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-8 bg-green-50/80 border border-green-200 rounded-2xl p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
            <p className="text-green-600 font-medium">
              {isEdit ? 'Departamento actualizado correctamente' : 'Departamento creado correctamente'}
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errors.general && (
        <div className="mb-8 bg-red-50/80 border border-red-200 rounded-2xl p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
            <p className="text-red-600">{errors.general}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="xl:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-light text-gray-900">Información del Departamento</h3>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Nombre del Departamento *
                  </label>
                  <div className="relative">
                    <FolderKanban className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full pl-12 pr-4 py-3 bg-gray-50/80 border rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all outline-none ${
                        errors.name ? 'border-red-300 focus:border-red-400' : 'border-gray-200/60 focus:border-blue-300'
                      }`}
                      placeholder="Ej: Electrónicos"
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-2 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Descripción
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-4 text-gray-400 w-4 h-4" />
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none resize-none"
                      placeholder="Descripción del departamento..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4">
              <Link
                href={isEdit ? `/departamentos/${categoryId}` : '/departamentos'}
                className="px-6 py-3 text-gray-600 bg-white/80 border border-gray-200/60 rounded-2xl hover:bg-white hover:border-gray-300 transition-all font-light"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                <span className="font-light">
                  {loading ? 'Guardando...' : isEdit ? 'Actualizar Departamento' : 'Crear Departamento'}
                </span>
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Preview Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-light text-gray-900">Vista Previa</h3>
            </div>
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl mx-auto flex items-center justify-center mb-4">
                  <FolderKanban className="w-12 h-12 text-gray-400" />
                </div>
                <h4 className="font-medium text-gray-900 mb-1">
                  {formData.name || 'Nombre del departamento'}
                </h4>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Nombre</span>
                  <span className="font-medium text-gray-900">
                    {formData.name || '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Descripción</span>
                  <span className="font-medium text-gray-900 text-right">
                    {formData.description ? (formData.description.length > 30 ? formData.description.substring(0, 30) + '...' : formData.description) : '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Help Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-light text-gray-900">Consejos</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Nombre claro</p>
                    <p className="text-xs text-gray-500">
                      Usa un nombre descriptivo que identifique el tipo de productos
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Descripción útil</p>
                    <p className="text-xs text-gray-500">
                      Agrega detalles que ayuden a entender qué productos contiene
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Organización</p>
                    <p className="text-xs text-gray-500">
                      Los departamentos ayudan a organizar mejor tu inventario
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryFormPage;
