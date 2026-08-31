'use client'
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AddProductToWarehousePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Extraer warehouse_id de los parámetros de query
    const warehouseId = searchParams.get('warehouse_id');
    const warehouseName = searchParams.get('warehouse_name');

    if (warehouseId) {
      // Redirigir a la página de crear producto con el almacén preseleccionado
      // Usamos query params para comunicar el almacén seleccionado
      router.push(`/products/new?warehouse_id=${warehouseId}&warehouse_name=${encodeURIComponent(warehouseName || 'Almacén')}`);
    } else {
      // Si no hay warehouse_id, redirigir a productos normal
      router.push('/products/new');
    }
  }, [router, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Redirigiendo al formulario de producto...</p>
      </div>
    </div>
  );
}