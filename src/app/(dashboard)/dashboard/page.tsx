'use client'
import React from 'react';
import Link from 'next/link';
import {
  Package,
  FileText,
  Users,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Plus,
  ArrowUpRight
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useDashboardStats } from '@/hooks/useDashboard';
import { useRealtime } from '@/hooks/useRealtime';
import DashboardLayout from '@/components/DashboardLayout';
import BCVRateWidget from '@/components/BCVRateWidget'; // ✅ MULTI-MONEDA
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const DashboardPage = () => {
  const { user } = useAuthStore();
  const { statsCards, recentActivity, categoryProductData, monthlySalesData, refreshData, isLoading, error } = useDashboardStats();

  useRealtime(['invoices', 'products', 'purchases', 'customers'], refreshData);

  // Colors for charts
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  const getIconForCard = (title: string) => {
    switch (title) {
      case 'Ventas del Mes': return DollarSign;
      case 'Productos': return Package;
      case 'Facturas Pendientes': return FileText;
      case 'Stock Bajo': return AlertTriangle;
      default: return Package;
    }
  };

  return (
    <div>
      <div className="p-6 lg:p-8">
        {/* Welcome Section con nuevo diseño */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-light mb-3" style={{ color: 'var(--color-primary)' }}>
                ¡Bienvenido de vuelta{user?.username ? `, ${user.username}` : ''}!
              </h1>
              <p className="font-light text-lg" style={{ color: 'var(--color-text-light)' }}>
                Aquí tienes un resumen de la actividad de tu empresa hoy.
              </p>
            </div>

            <button
              onClick={refreshData}
              disabled={isLoading}
              className="erp-card flex items-center px-4 py-3 transition-all disabled:opacity-50 hover:shadow-md"
              title="Actualizar datos"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} style={{ color: 'var(--color-primary)' }} />
              <span className="font-medium" style={{ color: 'var(--color-text)' }}>Actualizar</span>
            </button>
          </div>
        </div>

        {/* ✅ MULTI-MONEDA: BCV Rate Widget */}
        <div className="mb-10">
          <BCVRateWidget className="max-w-md" />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 erp-card p-4" style={{ borderLeftColor: 'var(--color-danger)' }}>
            <p className="text-sm" style={{ color: 'var(--color-danger)' }}>{error}</p>
            <button
              onClick={refreshData}
              className="mt-2 text-sm font-medium hover:underline"
              style={{ color: 'var(--color-danger)' }}
            >
              Intentar de nuevo
            </button>
          </div>
        )}

        {/* Stats Cards con nuevo diseño */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {statsCards.map((card, index) => {
            const Icon = getIconForCard(card.title);
            const borderColors = ['var(--color-primary)', 'var(--color-accent)', 'var(--color-success)', 'var(--color-warning)'];
            const iconColors = ['var(--color-primary)', 'var(--color-accent)', 'var(--color-success)', 'var(--color-warning)'];

            return (
              <div key={index} className="erp-stat-card group" style={{ borderLeftColor: borderColors[index % borderColors.length] }}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-light)' }}>
                      {card.title}
                    </p>
                    <div className="flex items-center mb-3">
                      {isLoading ? (
                        <div className="flex items-center">
                          <Loader2 className="w-6 h-6 animate-spin mr-2" style={{ color: 'var(--color-text-light)' }} />
                          <div className="w-16 h-6 rounded animate-pulse" style={{ background: 'var(--color-text-light)', opacity: 0.3 }}></div>
                        </div>
                      ) : (
                        <p className="erp-stat-value">
                          {card.value}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center">
                      <TrendingUp className={`w-4 h-4 mr-2 ${
                        card.changeType === 'positive' ? 'text-green-500' :
                        card.changeType === 'negative' ? 'text-red-500' : 'text-orange-500'
                      }}`} />
                      <span className={`text-sm font-medium ${
                        card.changeType === 'positive' ? 'text-green-600' :
                        card.changeType === 'negative' ? 'text-red-600' : 'text-orange-600'
                      }`}>
                        {card.change}
                      </span>
                    </div>
                  </div>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform" style={{ background: iconColors[index % iconColors.length] }}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts Section con nuevo diseño */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
          {/* Products by Category Chart */}
          <div className="erp-card overflow-hidden">
            <div className="p-6 border-b" style={{ borderColor: 'var(--color-neutral)' }}>
              <h3 className="text-xl font-light" style={{ color: 'var(--color-primary)' }}>Productos por Categoría</h3>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryProductData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: any) => `${entry.category}: ${entry.count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {categoryProductData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sales vs Purchases Chart */}
          <div className="xl:col-span-2 erp-card overflow-hidden">
            <div className="p-6 border-b" style={{ borderColor: 'var(--color-neutral)' }}>
              <h3 className="text-xl font-light" style={{ color: 'var(--color-primary)' }}>Ventas vs Compras (Mensual)</h3>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlySalesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number | undefined) => `$${(value || 0).toLocaleString()}`}
                  />
                  <Legend />
                  <Bar dataKey="ventas" fill="var(--color-primary)" name="Ventas" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="compras" fill="var(--color-accent)" name="Compras" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="xl:col-span-2">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-light text-gray-900">
                    Actividad Reciente
                  </h3>
                  {isLoading && (
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  )}
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {isLoading ? (
                    // Loading skeleton
                    Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="flex items-start space-x-4">
                        <div className="w-3 h-3 bg-gray-200 rounded-full mt-2 animate-pulse"></div>
                        <div className="flex-1">
                          <div className="w-3/4 h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                          <div className="w-1/4 h-3 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      </div>
                    ))
                  ) : recentActivity.length > 0 ? (
                    recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-4 group">
                        <div className="w-3 h-3 bg-blue-400 rounded-full mt-2 group-hover:scale-125 transition-transform"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            {activity.description}
                          </p>
                          <p className="text-xs text-gray-500 font-light">
                            {activity.time}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No hay actividad reciente</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Content */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-light text-gray-900">
                  Acciones Rápidas
                </h3>
              </div>
              <div className="p-6 space-y-3">
                <Link 
                  href="/invoices/new"
                  className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-[1.02] shadow-lg"
                >
                  <FileText className="w-4 h-4 mr-3" />
                  <span className="font-light">Nueva Factura</span>
                </Link>
                <Link 
                  href="/products/new"
                  className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-[1.02] shadow-lg"
                >
                  <Package className="w-4 h-4 mr-3" />
                  <span className="font-light">Agregar Producto</span>
                </Link>
                <Link 
                  href="/customers/new"
                  className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl hover:from-purple-600 hover:to-purple-700 transition-all transform hover:scale-[1.02] shadow-lg"
                >
                  <Users className="w-4 h-4 mr-3" />
                  <span className="font-light">Nuevo Cliente</span>
                </Link>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-light text-gray-900">
                  Resumen Rápido
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <Link 
                    href="/products"
                    className="flex items-center justify-between p-4 bg-gray-50/80 rounded-2xl hover:bg-white hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-center">
                      <Package className="w-5 h-5 text-blue-600 mr-3" />
                      <span className="text-sm font-medium text-gray-700">Productos</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-lg font-light text-gray-900 mr-2">124</span>
                      <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </Link>

                  <Link 
                    href="/invoices"
                    className="flex items-center justify-between p-4 bg-gray-50/80 rounded-2xl hover:bg-white hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-green-600 mr-3" />
                      <span className="text-sm font-medium text-gray-700">Facturas</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-lg font-light text-gray-900 mr-2">89</span>
                      <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-green-600 transition-colors" />
                    </div>
                  </Link>

                  <Link 
                    href="/customers"
                    className="flex items-center justify-between p-4 bg-gray-50/80 rounded-2xl hover:bg-white hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-center">
                      <Users className="w-5 h-5 text-purple-600 mr-3" />
                      <span className="text-sm font-medium text-gray-700">Clientes</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-lg font-light text-gray-900 mr-2">45</span>
                      <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-light text-gray-900">
                  Estado del Sistema
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 font-light">Base de Datos</span>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                      Conectado
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 font-light">API Status</span>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                      Operativo
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 font-light">Último Backup</span>
                    <span className="text-xs text-gray-500 font-light">Hace 2 horas</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 font-light">Empresa</span>
                    <span className="text-xs text-gray-700 font-medium">
                      {user?.company?.name || 'Mi Empresa'}
                    </span>
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

export default DashboardPage;