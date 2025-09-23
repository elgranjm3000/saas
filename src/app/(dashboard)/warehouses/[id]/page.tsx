'use client'
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  Edit,
  Trash2,
  Building2,
  MapPin,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar,
  Hash,
  History,
  Loader2,
  Eye,
  Plus,
  BarChart3
} from 'lucide-react';
import { warehousesAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface Warehouse {
  id: number;
  name: string;
  location: string;
  company_id: number;
}

interface WarehouseProduct {
  warehouse_id: number;
  product_id: number;
  stock: number;
  product?: {
    id: number;
    name: string;
    sku: string;
    price: number;
  };
}

interface WarehouseDetailPageProps {
  params: {
    id: string;
  };
}

const WarehouseDetailPage = ({ params }: WarehouseDetailPageProps) => {
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [products, setProducts] = useState<WarehouseProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (params.id) {
      fetchWarehouse();
      fetchWarehouseProducts();
    }
  }, [params.id]);

  const fetchWarehouse = async () => {
    try {
      setLoading(true);
      const response = await warehousesAPI.getById(Number(params.id));
      setWarehouse(response.data);
    } catch (error: any) {
      console.error('Error fetching warehouse:', error);
      setError('Error al cargar el almacén');
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouseProducts = async () => {
    try {
      setProductsLoading(true);
      // Simulamos datos de productos ya que el endpoint puede no estar completamente implementado
      const mockProducts: WarehouseProduct[] = [
        {
          warehouse_id: Number(params.id),
          product_id: 1,
          stock: 150,
          product: {
            id: 1,
            name: 'Laptop Dell Inspiron 15',
            sku: 'PROD-001',
            price: 899.99
          }
        },
        {
          warehouse_id: Number(params.id),
          product_id: 2,
          stock: 5,
          product: {
            id: 2,
            name: 'Mouse Logitech MX Master',
            sku: 'PROD-002',
            price: 99.99
          }
        }
      ];
      setProducts(mockProducts);
    } catch (error: any) {
      console.error('Error fetching warehouse products:', error);
    } finally {
      setProductsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!warehouse) return;
    
    if (window.confirm('¿Estás seguro de que quieres eliminar este almacén? Esta acción no se puede deshacer.')) {
      try {
        await warehousesAPI.delete(warehouse.id);
        router.push('/warehouses');
      } catch (error) {
        console.error('Error deleting warehouse:', error);
        alert('Error al eliminar el almacén');
      }
    }
  };

  const getStockStatus = (stock: number) => {
    const minStock = 10;
    if (stock === 0) return { 
      status: 'out', 
      color: 'text-red-600', 
      bg: 'bg-red-100', 
      icon: TrendingDown,
      label: 'Agotado' 
    };
    if (stock <= minStock) return { 
      status: 'low', 
      color: 'text-orange-600', 
      bg: 'bg-orange-100', 
      icon: AlertTriangle,
      label: 'Stock Bajo' 
    };
    return { 
      status: 'good', 
      color: 'text-green-600', 
      bg: 'bg-green-100', 
      icon: TrendingUp,
      label: 'En Stock' 
    };
  };

  const warehouseStats = {
    totalProducts: products.length,
    totalStock: products.reduce((sum, p) => sum + p.stock, 0),
    lowStockItems: products.filter(p => p.stock <= 10).length,
    outOfStockItems: products.filter(p => p.stock === 0).length,
    totalValue: products.reduce((sum, p) => sum + (p.stock * (p.product?.price || 0)), 0)
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

  if (error || !warehouse) {
    return (
      <div className="p-6 lg:p-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 p-12 text-center">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-light text-gray-900 mb-2">Almacén no encontrado</h3>
          <p className="text-gray-500 mb-6">
            {error || 'El almacén que buscas no existe o fue eliminado.'}
          </p>
          <Link
            href="/warehouses"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-[1.02] shadow-lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="font-light">Volver a Almacenes</span>
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
              href="/warehouses"
              className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-2xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-light text-gray-900 mb-2">{warehouse.name}</h1>
              <p className="text-gray-500 font-light flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                {warehouse.location}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Link
              href={`/warehouses/${warehouse.id}/edit`}
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
          {/* Warehouse Info */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 overflow-hidden">
            <div className="p-8">
              <div className="flex flex-col md:flex-row md:items-start space-y-6 md:space-y-0 md:space-x-8">
                {/* Warehouse Icon */}
                <div className="w-full md:w-80 h-80 bg-gradient-to-br from-blue-100 to-blue-200 rounded-3xl flex items-center justify-center">
                  <Building2 className="w-20 h-20 text-blue-600" />
                </div>
                
                {/* Warehouse Info */}
                <div className="flex-1">
                  <div className="mb-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <h2 className="text-2xl font-light text-gray-900">{warehouse.name}</h2>
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                        Activo
                      </span>
                    </div>
                    
                    <div className="flex items-center text-gray-600 mb-4">
                      <MapPin className="w-5 h-5 mr-2" />
                      <span>{warehouse.location}</span>
                    </div>
                  </div>
                  
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center mb-2">
                        <Package className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-500">Productos</span>
                      </div>
                      <p className="text-2xl font-light text-gray-900">
                        {warehouseStats.totalProducts}
                      </p>
                    </div>
                    
                    <div>
                      <div className="flex items-center mb-2">
                        <BarChart3 className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-500">Stock Total</span>
                      </div>
                      <p className="text-2xl font-light text-gray-900">
                        {warehouseStats.totalStock}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Products in Warehouse */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-light text-gray-900">Productos en este Almacén</h3>
                <Link
                  href={`/warehouses/${warehouse.id}/products/add`}
                  className="flex items-center px-4 py-2 text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Agregar Producto</span>
                </Link>
              </div>
            </div>
            <div className="p-6">
              {productsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : products.length > 0 ? (
                <div className="space-y-4">
                  {products.map((item) => {
                    const stockStatus = getStockStatus(item.stock);
                    const StockIcon = stockStatus.icon;
                    
                    return (
                      <div key={item.product_id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-500" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{item.product?.name}</h4>
                            <p className="text-sm text-gray-500 font-mono">{item.product?.sku}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-6">
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Stock</p>
                            <div className="flex items-center">
                              <span className="font-medium text-gray-900 mr-2">{item.stock}</span>
                              <StockIcon className={`w-4 h-4 ${stockStatus.color}`} />
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Link
                              href={`/products/${item.product_id}`}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-colors">
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No hay productos en este almacén</p>
                  <Link
                    href={`/warehouses/${warehouse.id}/products/add`}
                    className="inline-flex items-center px-4 py-2 text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors mt-4"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">Agregar primer producto</span>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Additional Details */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-light text-gray-900">Detalles del Almacén</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center">
                  <Hash className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">ID del Almacén</p>
                    <p className="font-medium text-gray-900">{warehouse.id}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Building2 className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Empresa</p>
                    <p className="font-medium text-gray-900">#{warehouse.company_id}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Ubicación</p>
                    <p className="font-medium text-gray-900">{warehouse.location}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Estado</p>
                    <p className="font-medium text-green-600">Activo</p>
                  </div>
                </div>
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
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Total productos</span>
                  <span className="font-medium text-gray-900">{warehouseStats.totalProducts}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Stock total</span>
                  <span className="font-medium text-gray-900">{warehouseStats.totalStock}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Stock bajo</span>
                  <span className="font-medium text-orange-600">{warehouseStats.lowStockItems}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Sin stock</span>
                  <span className="font-medium text-red-600">{warehouseStats.outOfStockItems}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <span className="text-sm text-gray-500">Valor total</span>
                  <span className="font-medium text-gray-900">
                    ${warehouseStats.totalValue.toFixed(2)}
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
                href={`/warehouses/${warehouse.id}/products`}
                className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-[1.02] shadow-lg"
              >
                <Package className="w-4 h-4 mr-3" />
                <span className="font-light">Ver Productos</span>
              </Link>
              <button className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-[1.02] shadow-lg">
                <TrendingUp className="w-4 h-4 mr-3" />
                <span className="font-light">Transferir Stock</span>
              </button>
              <button className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl hover:from-purple-600 hover:to-purple-700 transition-all transform hover:scale-[1.02] shadow-lg">
                <BarChart3 className="w-4 h-4 mr-3" />
                <span className="font-light">Reporte de Stock</span>
              </button>
              <button className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl hover:from-orange-600 hover:to-orange-700 transition-all transform hover:scale-[1.02] shadow-lg">
                <History className="w-4 h-4 mr-3" />
                <span className="font-light">Ver Movimientos</span>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-light text-gray-900">Actividad Reciente</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Almacén creado</p>
                    <p className="text-xs text-gray-500">Hace 2 días</p>
                  </div>
                </div>
                
                <div className="text-center py-8">
                  <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
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

export default WarehouseDetailPage;