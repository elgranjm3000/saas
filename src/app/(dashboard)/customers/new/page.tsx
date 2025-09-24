'use client'
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft,
  Save,
  Users,
  AlertCircle,
  CheckCircle,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Hash,
  Building2
} from 'lucide-react';
import { customersAPI } from '@/lib/api';

interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  tax_id: string;
  is_active: boolean;
}

interface Customer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  is_active?: boolean;
  created_at?: string;
}

const CustomerFormPage = () => {
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    tax_id: '',
    is_active: true
  });
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  
  const router = useRouter();
  const params = useParams();
  
  // Determinar si estamos editando o creando
  const isEdit = params?.id && params.id !== 'new';
  const customerId = isEdit ? Number(params.id) : null;

  useEffect(() => {
    if (isEdit && customerId) {
      fetchCustomer();
    }
  }, [isEdit, customerId]);

  const fetchCustomer = async () => {
    if (!customerId) return;
    
    try {
      setInitialLoading(true);
      const response = await customersAPI.getById(customerId);
      const customer: Customer = response.data;
      
      setFormData({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        tax_id: customer.tax_id || '',
        is_active: customer.is_active
      });
    } catch (error) {
      console.error('Error fetching customer:', error);
      setErrors({ general: 'Error al cargar el cliente' });
    } finally {
      setInitialLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
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
      newErrors.name = 'El nombre del cliente es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El formato del email no es válido';
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
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        tax_id: formData.tax_id.trim() || undefined
      };

      if (isEdit && customerId) {
        await customersAPI.update(customerId, submitData);
      } else {
        await customersAPI.create(submitData);
      }

      setSuccess(true);
      
      setTimeout(() => {
        if (isEdit) {
          router.push(`/customers/${customerId}`);
        } else {
          router.push('/customers');
        }
      }, 1500);

    } catch (error: any) {
      console.error('Error saving customer:', error.response?.data?.message || error.message);
      if (error.response?.data?.message) {
        setErrors({ general: error.response?.data?.message});
      } else {
        setErrors({ general: 'Error al guardar el cliente. Inténtalo de nuevo.' });
      }
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link
              href={isEdit ? `/customers/${customerId}` : '/customers'}
              className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-2xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-light text-gray-900 mb-2">
                {isEdit ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h1>
              <p className="text-gray-500 font-light">
                {isEdit ? 'Modifica la información del cliente' : 'Completa la información para crear un nuevo cliente'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-8 bg-green-50/80 border border-green-200 rounded-2xl p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
            <p className="text-green-600 font-medium">
              {isEdit ? 'Cliente actualizado correctamente' : 'Cliente creado correctamente'}
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
                <h3 className="text-xl font-light text-gray-900">Información Básica</h3>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Nombre del Cliente *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full pl-12 pr-4 py-3 bg-gray-50/80 border rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all outline-none ${
                        errors.name ? 'border-red-300 focus:border-red-400' : 'border-gray-200/60 focus:border-blue-300'
                      }`}
                      placeholder="Ej: Empresa ABC S.A."
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-2 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full pl-12 pr-4 py-3 bg-gray-50/80 border rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all outline-none ${
                        errors.email ? 'border-red-300 focus:border-red-400' : 'border-gray-200/60 focus:border-blue-300'
                      }`}
                      placeholder="contacto@empresa.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Teléfono
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Tax ID / RUC
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      name="tax_id"
                      value={formData.tax_id}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                      placeholder="123456789"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Dirección
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-4 text-gray-400 w-4 h-4" />
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none resize-none"
                      placeholder="Dirección completa del cliente..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-light text-gray-900">Estado</h3>
              </div>
              <div className="p-6">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                    Cliente activo
                  </label>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Los clientes inactivos no aparecerán en las listas principales
                </p>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4">
              <Link
                href={isEdit ? `/customers/${customerId}` : '/customers'}
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
                  {loading ? 'Guardando...' : isEdit ? 'Actualizar Cliente' : 'Crear Cliente'}
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
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl mx-auto flex items-center justify-center mb-4">
                  <Users className="w-12 h-12 text-blue-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-1">
                  {formData.name || 'Nombre del cliente'}
                </h4>
                <p className="text-sm text-gray-500">
                  {formData.email || 'email@cliente.com'}
                </p>
              </div>
              
              <div className="space-y-3">
                {formData.phone && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Teléfono</span>
                    <span className="font-medium text-gray-900">
                      {formData.phone}
                    </span>
                  </div>
                )}
                {formData.tax_id && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Tax ID</span>
                    <span className="font-medium text-gray-900">
                      {formData.tax_id}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-3 border-t border-gray-100">
                  <span className="text-sm text-gray-500">Estado</span>
                  <span className={`font-medium ${formData.is_active ? 'text-green-600' : 'text-red-600'}`}>
                    {formData.is_active ? 'Activo' : 'Inactivo'}
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
                    <p className="text-sm font-medium text-gray-900">Información completa</p>
                    <p className="text-xs text-gray-500">
                      Completa todos los campos posibles para facilitar la facturación
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email válido</p>
                    <p className="text-xs text-gray-500">
                      Asegúrate de que el email sea correcto para enviar documentos
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Tax ID</p>
                    <p className="text-xs text-gray-500">
                      El Tax ID es importante para la facturación legal
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

export default CustomerFormPage;