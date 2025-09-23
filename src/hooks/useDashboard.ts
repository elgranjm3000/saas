import { useState, useEffect } from 'react';
import { productsAPI, invoicesAPI } from '@/lib/api';

interface DashboardStats {
  totalProducts: number;
  totalSales: number;
  pendingInvoices: number;
  lowStockProducts: number;
  isLoading: boolean;
  error: string | null;
}

interface RecentActivity {
  id: number;
  type: string;
  description: string;
  time: string;
}

interface StatsCard {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'warning';
  gradient: string;
}

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalSales: 0,
    pendingInvoices: 0,
    lowStockProducts: 0,
    isLoading: true,
    error: null,
  });

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  const fetchDashboardData = async () => {
    try {
      setStats(prev => ({ ...prev, isLoading: true, error: null }));

      // Fetch data in parallel
      const [
        productsResponse,
        invoicesResponse, 
        lowStockResponse,
        pendingInvoicesResponse
      ] = await Promise.all([
        productsAPI.getAll({ limit: 1000 }),
        invoicesAPI.getAll({ limit: 100 }),
        productsAPI.getLowStock(10),
        invoicesAPI.getAll({ status: 'pendiente', limit: 100 })
      ]);

      // Calculate total sales from paid invoices
      const totalSales = invoicesResponse.data
        .filter((invoice: any) => invoice.status === 'pagada')
        .reduce((sum: number, invoice: any) => sum + invoice.total_amount, 0);

      setStats({
        totalProducts: productsResponse.data.length,
        totalSales,
        pendingInvoices: pendingInvoicesResponse.data.length,
        lowStockProducts: lowStockResponse.data.length,
        isLoading: false,
        error: null,
      });

      // Generate recent activity from API data
      const activities: RecentActivity[] = [];
      
      // Add recent invoices
      const recentInvoices = invoicesResponse.data
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 2);

      recentInvoices.forEach((invoice: any) => {
        activities.push({
          id: invoice.id,
          type: 'sale',
          description: `Nueva venta - Factura ${invoice.invoice_number}`,
          time: formatRelativeTime(invoice.date),
        });
      });

      // Add recent products
      const recentProducts = productsResponse.data.slice(0, 1);
      recentProducts.forEach((product: any) => {
        activities.push({
          id: product.id + 1000,
          type: 'product',
          description: `Producto "${product.name}" en el sistema`,
          time: '15 min ago',
        });
      });

      // Add low stock warning if any
      if (lowStockResponse.data.length > 0) {
        activities.push({
          id: 9999,
          type: 'warning',
          description: `Stock bajo en ${lowStockResponse.data.length} productos`,
          time: '1 hour ago',
        });
      }

      setRecentActivity(activities.slice(0, 4));

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setStats(prev => ({
        ...prev,
        isLoading: false,
        error: error.response?.data?.message || 'Error al cargar datos del dashboard'
      }));
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Format stats as cards
  const getStatsCards = (): StatsCard[] => [
    {
      title: 'Ventas del Mes',
      value: `$${stats.totalSales.toLocaleString()}`,
      change: '+12.5%',
      changeType: 'positive',
      gradient: 'from-green-400 to-green-500'
    },
    {
      title: 'Productos',
      value: stats.totalProducts.toLocaleString(),
      change: '+23',
      changeType: 'positive',
      gradient: 'from-blue-400 to-blue-500'
    },
    {
      title: 'Facturas Pendientes',
      value: stats.pendingInvoices.toString(),
      change: stats.pendingInvoices > 10 ? '+3' : '-2',
      changeType: stats.pendingInvoices > 10 ? 'warning' : 'positive',
      gradient: 'from-orange-400 to-orange-500'
    },
    {
      title: 'Stock Bajo',
      value: stats.lowStockProducts.toString(),
      change: stats.lowStockProducts > 5 ? '+2' : '0',
      changeType: stats.lowStockProducts > 5 ? 'warning' : 'positive',
      gradient: 'from-red-400 to-red-500'
    }
  ];

  return { 
    stats, 
    recentActivity, 
    statsCards: getStatsCards(),
    refreshData: fetchDashboardData,
    isLoading: stats.isLoading,
    error: stats.error
  };
};

// Utility function to format relative time
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Ahora mismo';
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
};