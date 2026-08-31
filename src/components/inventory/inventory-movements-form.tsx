'use client'
import React, { useState } from 'react';
import { Loader2, Package, Warehouse, TrendingUp, TrendingDown, RefreshCw, ArrowRight } from 'lucide-react';
import { inventoryMovementsAPI } from '@/lib/api';

interface Movement {
  company_id: number;
  warehouse_id: number;
  product_id: number;
  quantity: number;
  movement_type: 'ajuste' | 'merma' | 'conteo' | 'transferencia';
  description: string;
  reference?: string;
  notes?: string;
}

interface TransferMovement {
  company_id: number;
  from_warehouse_id: number;
  to_warehouse_id: number;
  product_id: number;
  quantity: number;
  notes?: string;
}

type MovementTab = 'ajuste' | 'merma' | 'transferencia' | 'conteo';

interface InventoryMovementsFormProps {
  companyId: number;
  warehouses: Array<{ id: number; name: string }>;
  products: Array<{ id: number; name: string; sku: string; stock?: number }>;
  onSuccess?: () => void;
}

export const InventoryMovementsForm: React.FC<InventoryMovementsFormProps> = ({
  companyId,
  warehouses,
  products,
  onSuccess
}) => {
  const [activeTab, setActiveTab] = useState<MovementTab>('ajuste');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [warehouseId, setWarehouseId] = useState<number | ''>('');
  const [fromWarehouseId, setFromWarehouseId] = useState<number | ''>('');
  const [toWarehouseId, setToWarehouseId] = useState<number | ''>('');
  const [productId, setProductId] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [actualQuantity, setActualQuantity] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validaciones
    if (activeTab === 'transferencia') {
      if (!fromWarehouseId || !toWarehouseId || !productId || !quantity) {
        setError('Todos los campos son requeridos');
        return;
      }
      if (fromWarehouseId === toWarehouseId) {
        setError('El almacén origen y destino deben ser diferentes');
        return;
      }
    } else if (activeTab === 'conteo') {
      if (!warehouseId || !productId || actualQuantity === '') {
        setError('Todos los campos son requeridos');
        return;
      }
    } else {
      if (!warehouseId || !productId || !quantity || !description) {
        setError('Todos los campos son requeridos');
        return;
      }
    }

    try {
      setLoading(true);

      let result;
      switch (activeTab) {
        case 'ajuste':
        case 'merma':
          result = await inventoryMovementsAPI.createManualMovement({
            company_id: companyId,
            warehouse_id: Number(warehouseId),
            product_id: Number(productId),
            quantity: Number(quantity),
            movement_type: activeTab,
            description,
            reference: reference || undefined,
            notes: notes || undefined
          });
          break;

        case 'conteo':
          result = await inventoryMovementsAPI.adjustStock({
            company_id: companyId,
            warehouse_id: Number(warehouseId),
            product_id: Number(productId),
            actual_quantity: Number(actualQuantity),
            reason: description,
            notes: notes || undefined
          });
          break;

        case 'transferencia':
          result = await inventoryMovementsAPI.transferStock({
            company_id: companyId,
            from_warehouse_id: Number(fromWarehouseId),
            to_warehouse_id: Number(toWarehouseId),
            product_id: Number(productId),
            quantity: Number(quantity),
            notes: notes || undefined
          });
          break;
      }

      if (result.error) throw result.error;

      setSuccess(`Movimiento de ${activeTab} registrado correctamente`);

      // Limpiar formulario
      setDescription('');
      setReference('');
      setNotes('');
      setQuantity('');
      setActualQuantity('');

      if (onSuccess) onSuccess();

    } catch (err: any) {
      setError(err.message || 'Error al procesar el movimiento');
    } finally {
      setLoading(false);
    }
  };

  const getMovementIcon = () => {
    switch (activeTab) {
      case 'ajuste': return <RefreshCw className="w-5 h-5" />;
      case 'merma': return <TrendingDown className="w-5 h-5 text-red-500" />;
      case 'conteo': return <Package className="w-5 h-5 text-blue-500" />;
      case 'transferencia': return <ArrowRight className="w-5 h-5 text-green-500" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Tabs */}
      <div className="border-b border-gray-100">
        <div className="flex">
          {[
            { key: 'ajuste' as MovementTab, label: 'Ajuste' },
            { key: 'merma' as MovementTab, label: 'Merma' },
            { key: 'conteo' as MovementTab, label: 'Conteo Físico' },
            { key: 'transferencia' as MovementTab, label: 'Transferencia' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center px-6 py-4 font-medium transition-colors ${
                activeTab === tab.key
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Error/Success Messages */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
            {success}
          </div>
        )}

        {/* Transferencia - campos especiales */}
        {activeTab === 'transferencia' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Almacén Origen */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Warehouse className="w-4 h-4 inline mr-2" />
                Almacén Origen
              </label>
              <select
                value={fromWarehouseId}
                onChange={(e) => setFromWarehouseId(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Seleccionar almacén origen</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>{wh.name}</option>
                ))}
              </select>
            </div>

            {/* Almacén Destino */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Warehouse className="w-4 h-4 inline mr-2" />
                Almacén Destino
              </label>
              <select
                value={toWarehouseId}
                onChange={(e) => setToWarehouseId(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Seleccionar almacén destino</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>{wh.name}</option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          /* Almacén único */
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Warehouse className="w-4 h-4 inline mr-2" />
              Almacén
            </label>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(Number(e.target.value))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Seleccionar almacén</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>{wh.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Producto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Package className="w-4 h-4 inline mr-2" />
            Producto
          </label>
          <select
            value={productId}
            onChange={(e) => setProductId(Number(e.target.value))}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Seleccionar producto</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.sku} - {p.name} {p.stock !== undefined ? `(Stock: ${p.stock})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Cantidad */}
        {activeTab === 'conteo' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cantidad Real (Conteo Físico)
            </label>
            <input
              type="number"
              value={actualQuantity}
              onChange={(e) => setActualQuantity(Number(e.target.value))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Cantidad encontrada en el conteo"
              required
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">
              El sistema calculará la diferencia automáticamente
            </p>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {activeTab === 'merma' ? 'Cantidad a Restar' : 'Cantidad'}
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Cantidad"
              required
              min="1"
            />
          </div>
        )}

        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descripción
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={
              activeTab === 'merma' ? 'Ej: Producto dañado, Caducado, etc.' :
              activeTab === 'ajuste' ? 'Ej: Corrección de error sistemático' :
              'Motivo del movimiento'
            }
            required={activeTab !== 'transferencia'}
          />
        </div>

        {/* Referencia (opcional) */}
        {(activeTab === 'ajuste' || activeTab === 'merma') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Referencia (Opcional)
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej: #DOC-12345"
            />
          </div>
        )}

        {/* Notas (opcional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notas Adicionales (Opcional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
            placeholder="Detalles adicionales sobre el movimiento..."
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                {getMovementIcon()}
                <span className="ml-2">
                  {activeTab === 'ajuste' && 'Registrar Ajuste'}
                  {activeTab === 'merma' && 'Registrar Merma'}
                  {activeTab === 'conteo' && 'Ajustar Stock'}
                  {activeTab === 'transferencia' && 'Transferir Stock'}
                </span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InventoryMovementsForm;
