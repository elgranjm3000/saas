'use client'
import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
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
  ArrowUpRight
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuthProvider';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const menuItems = [
    { icon: Home, label: 'Dashboard', href: '/dashboard', active: pathname === '/dashboard' },
    { icon: Package, label: 'Productos', href: '/products', active: pathname.startsWith('/products') },    
    { icon: FileText, label: 'Facturas', href: '/invoices', active: pathname.startsWith('/invoices') },
    { icon: ShoppingCart, label: 'Compras', href: '/purchases', active: pathname.startsWith('/purchases') },
    { icon: Warehouse, label: 'Almacenes', href: '/warehouses', active: pathname.startsWith('/warehouses') },
    { icon: Users, label: 'Clientes', href: '/customers', active: pathname.startsWith('/customers') },
    { icon: Truck, label: 'Proveedores', href: '/suppliers', active: pathname.startsWith('/suppliers') },
    { icon: BarChart3, label: 'Reportes', href: '/reports', active: pathname.startsWith('/reports') },
    { icon: Settings, label: 'Configuración', href: '/settings', active: pathname.startsWith('/settings') },
  ];

  const handleUserMenuToggle = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  const handleLogout = () => {
    setUserMenuOpen(false);
    logout();
  };

  // Close user menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (userMenuOpen && !target.closest('[data-user-menu]')) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Background decorative elements */}
      <div className="fixed top-20 left-20 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      <div className="fixed bottom-20 right-20 w-80 h-80 bg-gray-100 rounded-full mix-blend-multiply filter blur-xl opacity-30"></div>
      
      {/* Sidebar */}
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
              <Link
                key={index}
                href={item.href}
                className={`group flex items-center px-4 py-3 text-sm font-medium rounded-2xl transition-all duration-200 ${
                  item.active 
                    ? 'bg-blue-50/80 text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:bg-gray-50/80 hover:text-gray-900'
                }`}
                onClick={() => setSidebarOpen(false)} // Close sidebar on mobile when navigating
              >
                <item.icon className={`mr-4 h-5 w-5 transition-colors ${
                  item.active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                }`} />
                <span className="font-light">{item.label}</span>
                {item.active && <ArrowUpRight className="ml-auto w-4 h-4 text-blue-400" />}
              </Link>
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
            </div>

            <div className="flex items-center space-x-4">
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
              <div className="relative" data-user-menu>
                <button
                  onClick={handleUserMenuToggle}
                  className="flex items-center space-x-3 text-sm bg-white/80 border border-gray-200/60 rounded-2xl px-4 py-3 hover:bg-white hover:border-gray-300 transition-all"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-light text-gray-700 max-w-32 truncate">
                    {user?.username || 'Usuario'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.username || 'Usuario'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {user?.email || 'usuario@empresa.com'}
                      </p>
                    </div>
                    
                    <Link 
                      href="/profile" 
                      className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50/80 transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User className="w-4 h-4 mr-3 text-gray-400" />
                      Mi Perfil
                    </Link>
                    
                    <Link 
                      href="/settings" 
                      className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50/80 transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Settings className="w-4 h-4 mr-3 text-gray-400" />
                      Configuración
                    </Link>
                    
                    <hr className="my-2 border-gray-100" />
                    
                    <button
                      onClick={handleLogout}
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
          {children}
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