'use client'
import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
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
  Search,
  User,
  LogOut,
  Building2,
  Home,
  FolderTree,
  DollarSign,
  Ruler,
  Receipt,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const pathname = usePathname();

  const menuItems = [
    { icon: Home, label: 'Dashboard', href: '/dashboard', active: pathname === '/dashboard' },
    { icon: FolderTree, label: 'Departamentos', href: '/departamentos', active: pathname.startsWith('/departamentos') },
    { icon: Warehouse, label: 'Almacenes', href: '/warehouses', active: pathname.startsWith('/warehouses') },
    { icon: Package, label: 'Productos', href: '/products', active: pathname.startsWith('/products') },
    { icon: Users, label: 'Clientes', href: '/customers', active: pathname.startsWith('/customers') },
    { icon: FileText, label: 'Facturas', href: '/invoices', active: pathname.startsWith('/invoices') },
    { icon: Truck, label: 'Proveedores', href: '/suppliers', active: pathname.startsWith('/suppliers') },
    { icon: ShoppingCart, label: 'Compras', href: '/purchases', active: pathname.startsWith('/purchases') },
    { icon: DollarSign, label: 'Monedas', href: '/currencies', active: pathname.startsWith('/currencies') },
    { icon: Ruler, label: 'Unidades', href: '/units', active: pathname.startsWith('/units') },
    { icon: BarChart3, label: 'Reportes', href: '/reports', active: pathname.startsWith('/reports') },
    { icon: Receipt, label: 'Reportes SENIAT', href: '/fiscal-reports', active: pathname.startsWith('/fiscal-reports') },
    { icon: Settings, label: 'Configuración', href: '/settings', active: pathname.startsWith('/settings') },
  ];

  const handleUserMenuToggle = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  const handleLogout = () => {
    setUserMenuOpen(false);
    logout();
    router.push('/login');
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
    <div className="flex min-h-screen bg-[var(--color-neutral)]">
      {/* Sidebar con nuevo diseño */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 erp-sidebar
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0 lg:z-auto
      `}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-white/20">
          <div className="flex items-center">
            <img
              src="/logo.webp"
              alt="Chrystal Software Administrativo"
              className="h-12 w-auto object-contain"
            />
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 overflow-y-auto">
          <div className="space-y-1">
            {menuItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className={`erp-sidebar-item flex items-center px-3 py-2 text-sm rounded-lg transition-all ${
                  item.active ? 'active' : ''
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className={`mr-3 h-4 w-4 ${
                  item.active ? 'text-white' : 'text-white/80'
                }`} />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>

        {/* Company Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/20">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center mr-3">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">
                {user?.company?.name || 'Mi Empresa'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header con nuevo diseño */}
        <header className="currency-header sticky top-0 z-30">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-gray-500 hover:text-gray-700 lg:hidden mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center space-x-3">
              {/* Search Bar */}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-gray-300 focus:ring-1 focus:ring-gray-200 transition-all w-64 text-sm outline-none"
                />
              </div>

              {/* User Menu */}
              <div className="relative" data-user-menu>
                <button
                  onClick={handleUserMenuToggle}
                  className="flex items-center space-x-2 text-sm hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors"
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                  <span className="hidden md:block text-gray-700 max-w-24 truncate">
                    {user?.username || 'Usuario'}
                  </span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-sm border border-gray-200 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.username || 'Usuario'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user?.email || 'usuario@empresa.com'}
                      </p>
                    </div>

                    <Link
                      href="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User className="w-4 h-4 mr-2 text-gray-400" />
                      Perfil
                    </Link>

                    <Link
                      href="/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Settings className="w-4 h-4 mr-2 text-gray-400" />
                      Configuración
                    </Link>

                    <hr className="my-1 border-gray-100" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default DashboardLayout;