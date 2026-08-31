'use client'
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle, Building2 } from 'lucide-react';
import { Product } from '@/types/api';
import ProductForm from '@/components/forms/product-form';

const NewProductPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [initialWarehouse, setInitialWarehouse] = useState<{ id: number; name: string } | null>(null);

  useEffect(() => {
    // Leer parámetros de query para warehouse preseleccionado
    const warehouseId = searchParams.get('warehouse_id');
    const warehouseName = searchParams.get('warehouse_name');

    if (warehouseId) {
      setInitialWarehouse({
        id: parseInt(warehouseId),
        name: warehouseName || 'Almacén'
      });
    }
  }, [searchParams]);

  const handleSuccess = (product: Product) => {
    // Si venimos de un almacén específico, redirigir de vuelta al almacén
    if (initialWarehouse) {
      setTimeout(() => {
        router.push(`/warehouses/${initialWarehouse.id}`);
      }, 1500);
    } else {
      // Redirigir a la página del producto creado
      setTimeout(() => {
        router.push(`/products/${product.id}`);
      }, 1500);
    }
  };

  const handleCancel = () => {
    // Si venimos de un almacén, regresar al almacén
    if (initialWarehouse) {
      router.push(`/warehouses/${initialWarehouse.id}`);
    } else {
      router.push('/products');
    }
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-6">
          <Link
            href={initialWarehouse ? `/warehouses/${initialWarehouse.id}` : "/products"}
            className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-2xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-light text-gray-900 mb-2">
              {initialWarehouse ? `Agregar Producto a ${initialWarehouse.name}` : 'Nuevo Producto'}
            </h1>
            <p className="text-gray-500 font-light">
              {initialWarehouse
                ? `Este producto será asociado automáticamente al almacén "${initialWarehouse.name}"`
                : 'Completa la información para crear un nuevo producto con todos los campos del sistema Desktop ERP'
              }
            </p>
          </div>
        </div>

        {/* Indicador de almacén */}
        {initialWarehouse && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center">
            <Building2 className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">
                Producto se agregará a: <span className="font-semibold">{initialWarehouse.name}</span>
              </p>
              <p className="text-xs text-blue-700">
                Puedes cambiar el almacén en el formulario si lo prefieres
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Formulario */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 p-8">
        <ProductForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          initialWarehouseId={initialWarehouse?.id?.toString()}
        />
      </div>
    </div>
  );
};

export default NewProductPage;
