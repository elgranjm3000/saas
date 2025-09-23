'use client'
import React, { useState } from 'react';
import { 
  BarChart3, 
  Package, 
  FileText, 
  ShoppingCart, 
  Warehouse, 
  Users, 
  Truck,
  Settings, 
  Menu, 
  X, 
  Bell, 
  Search, 
  User,
  LogOut,
  Building2,
  ChevronDown,
  Home,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  ArrowUpRight,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuthProvider';
import { useDashboardStats } from '@/hooks/useDashboard';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { statsCards, recentActivity, refreshData, isLoading, error } = useDashboardStats();

  const menuItems = [
    { icon: Home, label: 'Dashboard', href: '/dashboard', active: true },
    { icon: Package, label: 'Productos', href: '/products' },
    { icon: FileText, label: 'Facturas', href: '/invoices' },
    { icon: ShoppingCart, label: 'Compras', href: '/purchases' },
    { icon: Warehouse, label: 'Almacenes', href: '/warehouses' },
    { icon: Users, label: 'Clientes', href: '/customers' },
    { icon: Truck, label: 'Proveedores', href: '/suppliers' },
    { icon: BarChart3, label: 'Reportes', href: '/reports' },
    { icon: Settings, label: 'Configuración', href: '/settings' },
  ];

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
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Background decorative elements */}
      <div className="fixed top-20 left-20 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      <div className="fixed bottom-20 right-20 w-80 h-80 bg-gray-100 rounded-full mix-blend-multiply filter blur-xl opacity-30"></div>
      
      {/* Sidebar - Minimalist */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white/80 backdrop-blur-xl border-r border-gray-100
        transform transition-all duration-500 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0 lg:z-auto
        shadow-xl shadow-gray-500/5
      `}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-gray-100">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-light text-gray-900">ERP System</span>
              <p className="text-xs text-gray-500 font-light">Gestión empresarial</p>
            </div>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 mt-8 px-4 pb-20 overflow-y-auto">
          <div className="space-y-2">
            {menuItems.map((item, index) => (
              <a
                key={index}
                href="#"
                className={`group flex items-center px-4 py-3 text-sm font-medium rounded-2xl transition-all duration-200 ${
                  item.active 
                    ? 'bg-blue-50/80 text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:bg-gray-50/80 hover:text-gray-900'
                }`}
              >
                <item.icon className={`mr-4 h-5 w-5 transition-colors ${
                  item.active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                }`} />
                <span className="font-light">{item.label}</span>
                {item.active && <ArrowUpRight className="ml-auto w-4 h-4 text-blue-400" />}
              </a>
            ))}
          </div>
        </nav>

        {/* Company Info */}
        <div className="absolute bottom-6 left-4 right-4">
          <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-200 rounded-2xl flex items-center justify-center mr-4">
                <Building2 className="w-6 h-6 text-gray-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.company?.name || 'Mi Empresa S.A.'}
                </p>
                <p className="text-xs text-gray-500 font-light">Plan Professional</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-30">
          <div className="flex items-center justify-between h-20 px-6">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-gray-500 hover:text-gray-700 lg:hidden mr-4 p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-light text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-500 font-light">Resumen de actividad</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Refresh Button */}
              <button
                onClick={refreshData}
                disabled={isLoading}
                className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-2xl transition-colors disabled:opacity-50"
                title="Actualizar datos"
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>

              {/* Search Bar */}
              <div className="relative hidden md:block">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="pl-12 pr-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all w-64 text-sm outline-none"
                />
              </div>

              {/* Notifications */}
              <button className="relative p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-2xl transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 h-2 w-2 bg-red-400 rounded-full animate-pulse"></span>
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-3 text-sm bg-white/80 border border-gray-200/60 rounded-2xl px-4 py-3 hover:bg-white hover:border-gray-300 transition-all"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-light text-gray-700 max-w-32 truncate">
                    {user?.username || 'Usuario'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                    <a href="#" className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50/80 transition-colors">
                      <User className="w-4 h-4 mr-3 text-gray-400" />
                      Mi Perfil
                    </a>
                    <a href="#" className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50/80 transition-colors">
                      <Settings className="w-4 h-4 mr-3 text-gray-400" />
                      Configuración
                    </a>
                    <hr className="my-2 border-gray-100" />
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50/80 transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-8">
            {/* Welcome Section */}
            <div className="mb-10">
              <h2 className="text-3xl font-light text-gray-900 mb-3">
                ¡Bienvenido de vuelta{user?.username ? `, ${user.username}` : ''}!
              </h2>
              <p className="text-gray-500 font-light text-lg">
                Aquí tienes un resumen de la actividad de tu empresa hoy.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-8 bg-red-50/80 border border-red-200 rounded-2xl p-4">
                <p className="text-red-600 text-sm">{error}</p>
                <button 
                  onClick={refreshData}
                  className="mt-2 text-red-700 hover:text-red-800 text-sm font-medium"
                >
                  Intentar de nuevo
                </button>
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              {statsCards.map((card, index) => {
                const Icon = getIconForCard(card.title);
                return (
                  <div key={index} className="group bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-gray-100 hover:shadow-xl hover:shadow-gray-500/10 transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                          {card.title}
                        </p>
                        <div className="flex items-center mb-3">
                          {isLoading ? (
                            <div className="flex items-center">
                              <Loader2 className="w-6 h-6 animate-spin text-gray-400 mr-2" />
                              <div className="w-16 h-6 bg-gray-200 rounded animate-pulse"></div>
                            </div>
                          ) : (
                            <p className="text-2xl font-light text-gray-900">
                              {card.value}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center">
                          <TrendingUp className={`w-4 h-4 mr-2 ${
                            card.changeType === 'positive' ? 'text-green-500' : 
                            card.changeType === 'negative' ? 'text-red-500' : 'text-orange-500'
                          }`} />
                          <span className={`text-sm font-medium ${
                            card.changeType === 'positive' ? 'text-green-600' : 
                            card.changeType === 'negative' ? 'text-red-600' : 'text-orange-600'
                          }`}>
                            {card.change}
                          </span>
                        </div>
                      </div>
                      <div className={`w-14 h-14 bg-gradient-to-br ${card.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                    </div>
                  </div>
                );
              })}
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
                        <p className="text-gray-500 text-center py-8">
                          No hay actividad reciente
                        </p>
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
                    <button className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-[1.02] shadow-lg">
                      <FileText className="w-4 h-4 mr-3" />
                      <span className="font-light">Nueva Factura</span>
                    </button>
                    <button className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-[1.02] shadow-lg">
                      <Package className="w-4 h-4 mr-3" />
                      <span className="font-light">Agregar Producto</span>
                    </button>
                    <button className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl hover:from-purple-600 hover:to-purple-700 transition-all transform hover:scale-[1.02] shadow-lg">
                      <Users className="w-4 h-4 mr-3" />
                      <span className="font-light">Nuevo Cliente</span>
                    </button>
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
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden transition-all duration-300"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default DashboardLayout;