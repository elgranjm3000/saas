'use client'
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Ruler,
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { unitsAPI } from '@/lib/api';
import type { Unit } from '@/types/api';

const UnitsPage = () => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    abbreviation: '',
    description: ''
  });

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    try {
      setLoading(true);
      const response = await unitsAPI.getAll({ active_only: true });
      setUnits(response.data || []);
    } catch (error) {
      console.error('Error fetching units:', error);
      alert('Error al cargar unidades de medida');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingUnit) {
        await unitsAPI.update(editingUnit.id, formData);
        alert('Unidad actualizada exitosamente');
      } else {
        await unitsAPI.create(formData);
        alert('Unidad creada exitosamente');
      }

      await fetchUnits();
      handleCancel();
    } catch (error: any) {
      console.error('Error saving unit:', error);
      alert(error.response?.data?.detail || 'Error al guardar unidad');
    }
  };

  const handleEdit = (unit: Unit) => {
    setEditingUnit(unit);
    setFormData({
      name: unit.name,
      abbreviation: unit.abbreviation,
      description: unit.description || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta unidad de medida?')) {
      try {
        await unitsAPI.delete(id);
        await fetchUnits();
        alert('Unidad eliminada exitosamente');
      } catch (error: any) {
        console.error('Error deleting unit:', error);
        alert(error.response?.data?.detail || 'Error al eliminar unidad');
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingUnit(null);
    setFormData({
      name: '',
      abbreviation: '',
      description: ''
    });
  };

  const filteredUnits = units.filter(unit =>
    unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.abbreviation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: units.length,
    active: units.filter(u => u.is_active).length
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
            <h1 className="text-3xl font-light text-gray-900 mb-3">Unidades de Medida</h1>
            <p className="text-gray-500 font-light text-lg">
              Gestiona las unidades de medida de tus productos
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nueva Unidad
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Unidades</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
              <Ruler className="w-10 h-10 text-blue-500 opacity-20" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Unidades Activas</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.active}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500 opacity-20" />
            </div>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-4">
              {editingUnit ? 'Editar Unidad' : 'Nueva Unidad'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Kilogramo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Abreviatura
                </label>
                <input
                  type="text"
                  required
                  value={formData.abbreviation}
                  onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="KG"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción (opcional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Descripción de la unidad de medida"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingUnit ? 'Actualizar' : 'Crear'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o abreviatura..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Abreviatura
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Descripción
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredUnits.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No hay unidades de medida registradas
                </td>
              </tr>
            ) : (
              filteredUnits.map((unit) => (
                <tr key={unit.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {unit.abbreviation}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {unit.name}
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">
                    {unit.description || '-'}
                  </td>
                  <td className="px-6 py-4">
                    {unit.is_active ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Activa
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        <XCircle className="w-3 h-3 mr-1" />
                        Inactiva
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(unit)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <Edit className="w-4 h-4 inline" />
                    </button>
                    <button
                      onClick={() => handleDelete(unit.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UnitsPage;
