'use client';

import React, { useState, useEffect } from 'react';
import { Product, Customer, InvoicePreviewResponse, InvoiceTotalsResponse } from '@/types/api';
import { productsAPI, customersAPI, invoicesAPI, referencePricesAPI } from '@/lib/api';
import BCVRateWidget from '@/components/BCVRateWidget';

interface InvoiceItem {
  product_id: number;
  quantity: number;
  product?: Product;
}

interface InvoiceFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('transferencia');
  const [igtfExempt, setIgtfExempt] = useState(false);
  const [manualRate, setManualRate] = useState<number | null>(null);
  const [preview, setPreview] = useState<InvoicePreviewResponse | null>(null);
  // ✅ REF System state
  const [refTotals, setRefTotals] = useState<InvoiceTotalsResponse | null>(null);
  const [useREFSystem, setUseREFSystem] = useState(true); // Default to REF
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productsAPI.list();
      setProducts(response.data);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await customersAPI.list();
      setCustomers(response.data);
    } catch (err) {
      console.error('Error fetching customers:', err);
    }
  };

  // Auto-generar preview cuando cambien los items
  useEffect(() => {
    if (items.length > 0 && selectedCustomer) {
      if (useREFSystem) {
        generateREFPreview();
      } else {
        generatePreview();
      }
    } else {
      setPreview(null);
      setRefTotals(null);
    }
  }, [items, selectedCustomer, paymentMethod, igtfExempt, manualRate, useREFSystem]);

  const generateREFPreview = async () => {
    if (!selectedCustomer || items.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      // ✅ Usar sistema REF
      const response = await referencePricesAPI.calculateInvoiceTotals(
        items.map(item => ({ product_id: item.product_id, quantity: item.quantity })),
        selectedCustomer,
        paymentMethod,
        manualRate,
        undefined // discount_percentage
      );

      setRefTotals(response.data);
      setPreview(null); // Limpiar preview viejo
    } catch (err: any) {
      console.error('Error generating REF preview:', err);
      setError(err.response?.data?.message || 'Error al generar preview REF');
    } finally {
      setLoading(false);
    }
  };

  const generatePreview = async () => {
    if (!selectedCustomer || items.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const response = await invoicesAPI.preview({
        items: items.map(item => ({ product_id: item.product_id, quantity: item.quantity })),
        customer_id: selectedCustomer,
        payment_method: paymentMethod,
        manual_exchange_rate: manualRate,
        igtf_exempt: igtfExempt,
        iva_percentage: 16.0,
        reference_currency_code: 'USD',
        payment_currency_code: 'VES',
      });
      setPreview(response.data);
      setRefTotals(null); // Limpiar REF totals
    } catch (err: any) {
      console.error('Error generating preview:', err);
      setError(err.response?.data?.message || 'Error al generar preview');
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    if (products.length > 0) {
      setItems([...items, { product_id: products[0].id, quantity: 1 }]);
    }
  };

  const updateItem = (index: number, field: 'product_id' | 'quantity', value: any) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedCustomer || items.length === 0) {
      setError('Debes seleccionar un cliente y agregar al menos un producto');
      return;
    }

    setLoading(true);

    try {
      // ✅ Usar sistema REF para crear factura
      const invoiceData = {
        customer_id: selectedCustomer,
        payment_method: paymentMethod,
        items: items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity
        })),
        notes: 'Factura creada con sistema REF',
        // Si hay tasa manual, se puede incluir
        manual_exchange_rate: manualRate
      };

      await invoicesAPI.create(invoiceData);

      // ✅ Factura creada exitosamente
      alert('✅ Factura creada exitosamente con sistema REF!');

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Error creating invoice:', err);
      setError(err.response?.data?.message || 'Error al crear factura');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: currency === 'USD' ? 'USD' : 'VES',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Columna Izquierda: Formulario */}
      <div className="lg:col-span-2 space-y-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Crear Factura</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800">
              {error}
            </div>
          )}

          {/* Cliente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cliente *
            </label>
            <select
              required
              value={selectedCustomer || ''}
              onChange={(e) => setSelectedCustomer(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar cliente...</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          {/* Método de Pago */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Método de Pago *
            </label>
            <select
              required
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="zelle">Zelle</option>
              <option value="pago_movil">Pago Móvil</option>
              <option value="tarjeta_credito">Tarjeta de Crédito</option>
              <option value="tarjeta_debito">Tarjeta de Débito</option>
            </select>
          </div>

          {/* Items */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Productos *
              </label>
              <button
                type="button"
                onClick={addItem}
                className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                + Agregar Producto
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="flex gap-2 items-start p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 mb-1">Producto</label>
                    <select
                      required
                      value={item.product_id}
                      onChange={(e) => updateItem(index, 'product_id', parseInt(e.target.value))}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    >
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} - ${product.price_usd || product.price} USD
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-24">
                    <label className="block text-xs text-gray-600 mb-1">Cantidad</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="mt-5 text-red-600 hover:text-red-800"
                  >
                    🗑️
                  </button>
                </div>
              ))}

              {items.length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  No hay productos agregados. Haz clic en &quot;+ Agregar Producto&quot;.
                </p>
              )}
            </div>
          </div>

          {/* Opciones Adicionales */}
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={igtfExempt}
                onChange={(e) => setIgtfExempt(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Exento de IGTF</span>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tasa Manual (opcional)
              </label>
              <input
                type="number"
                step="0.01"
                value={manualRate || ''}
                onChange={(e) => setManualRate(e.target.value ? parseFloat(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Dejar vacío para usar tasa BCV"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={(!refTotals && !preview) || loading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-50 font-semibold shadow-lg"
            >
              {loading ? 'Procesando...' : '✅ Crear Factura con Sistema REF'}
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Columna Derecha: Preview y Tasa BCV */}
      <div className="space-y-6">
        {/* Widget de Tasa BCV */}
        <BCVRateWidget onRateChange={() => useREFSystem ? generateREFPreview() : generatePreview()} />

        {/* ✅ Preview REF (Sistema nuevo) */}
        {refTotals && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">
                💵 Preview REF (Sistema Actualizado)
              </h3>
              <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                Activo
              </span>
            </div>

            {/* USD Reference Total */}
            <div className="bg-white rounded-xl p-4 mb-4 border-2 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-blue-800">Total Referencia (USD)</p>
                  <p className="text-xs text-blue-600">Moneda estable</p>
                </div>
                <p className="text-2xl font-black text-blue-600">
                  ${refTotals.subtotal_reference.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </p>
              </div>
            </div>

            {/* VES Breakdown */}
            <div className="space-y-2">
              {refTotals.exchange_rate && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Tasa BCV ({refTotals.rate_date}):</span>
                  <span className="font-mono font-semibold text-gray-800">
                    {refTotals.exchange_rate.toFixed(2)} Bs/USD
                  </span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal VES:</span>
                <span className="font-medium">
                  Bs. {refTotals.subtotal_target.toLocaleString('es-VE', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">IVA (16%):</span>
                <span className="font-medium text-indigo-700">
                  + Bs. {refTotals.iva_amount.toLocaleString('es-VE', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </span>
              </div>

              {refTotals.igtf_amount > 0 && (
                <div className="flex justify-between text-sm bg-orange-50 px-2 py-1 rounded">
                  <span className="text-orange-700 font-medium">IGTF (3%):</span>
                  <span className="font-bold text-orange-700">
                    + Bs. {refTotals.igtf_amount.toLocaleString('es-VE', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </span>
                </div>
              )}

              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 mt-3">
                <div className="flex items-end justify-between text-white">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide opacity-90">Total a Pagar</p>
                    <p className="text-xs opacity-75">
                      {paymentMethod === 'efectivo' ? '✅ Sin IGTF' : '⚠️ Incluye IGTF 3%'}
                    </p>
                  </div>
                  <p className="text-3xl font-black">
                    Bs. {refTotals.total_amount.toLocaleString('es-VE', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preview de Factura (Sistema antiguo - fallback) */}
        {preview && !refTotals && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Preview de Factura</h3>

            <div className="space-y-3">
              {/* Items */}
              <div className="border-b pb-3">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Productos</h4>
                <div className="space-y-2">
                  {preview.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.product_name} x{item.quantity}
                      </span>
                      <span className="font-medium">
                        {formatCurrency(item.total_payment, 'VES')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totales */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal USD:</span>
                  <span className="font-medium">
                    {formatCurrency(preview.totals.subtotal_reference, 'USD')}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal VES:</span>
                  <span className="font-medium">
                    {formatCurrency(preview.totals.subtotal_payment, 'VES')}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">IVA ({preview.totals.iva_percentage}%):</span>
                  <span className="font-medium">
                    {formatCurrency(preview.totals.iva_amount, 'VES')}
                  </span>
                </div>

                {preview.totals.igtf_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">IGTF ({preview.totals.igtf_percentage}%):</span>
                    <span className="font-medium text-orange-600">
                      {formatCurrency(preview.totals.igtf_amount, 'VES')}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span className="text-gray-800">TOTAL:</span>
                  <span className="text-blue-600">
                    {formatCurrency(preview.totals.total_amount, 'VES')}
                  </span>
                </div>
              </div>

              {/* Tasa Usada */}
              <div className="bg-blue-50 rounded p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tasa usada:</span>
                  <span className="font-medium">
                    {preview.exchange_rate.rate.toFixed(2)} VES/USD
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Fuente: {preview.exchange_rate.source}</span>
                  <span>{new Date(preview.exchange_rate.rate_date).toLocaleDateString('es-VE')}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceForm;
