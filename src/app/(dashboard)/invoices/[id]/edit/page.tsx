'use client'
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2,
  Plus,
  Trash2,
  User,
  Calendar,
  DollarSign,
  Percent,
  Package,
  X,
  Search,
  ChevronDown
} from 'lucide-react';
import { invoicesAPI, customersAPI, productsAPI, warehousesAPI, warehouseProductsAPI } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { extractErrorMessage } from '@/lib/errorHandler';

interface InvoiceItem {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  tax_percent: number; // 16, 8, 0
  is_exempt: boolean; // Productos exentos
}

interface InvoiceFormData {
  customer_id: number | null;
  warehouse_id: number | null;
  discount: number;
  date: string;
  due_date: string;
  items: InvoiceItem[];
  notes: string;

  // Venezuela SENIAT
  transaction_type: 'contado' | 'credito';
  payment_method: string;
  credit_days: number;
  iva_percentage: number; // 16, 8, 0
  customer_phone?: string;
  customer_address?: string;
}

interface Customer {
  id: number;
  name: string;
  email: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  warehouse_id?: number;
}

interface Warehouse {
  id: number;
  name: string;
  location: string;
}

const InvoiceFormPage = () => {
  const [formData, setFormData] = useState<InvoiceFormData>({
    customer_id: null,
    warehouse_id: null,
    discount: 0,
    date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    items: [],
    notes: '',

    // Venezuela - valores por defecto
    transaction_type: 'contado',
    payment_method: 'efectivo',
    credit_days: 0,
    iva_percentage: 16
  });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showWarehouseDropdown, setShowWarehouseDropdown] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [selectedCustomerName, setSelectedCustomerName] = useState('');
  const [selectedWarehouseName, setSelectedWarehouseName] = useState('');

  const router = useRouter();
  const params = useParams();

  const isEdit = params?.id && params.id !== 'new';
  const invoiceId = isEdit ? Number(params.id) : null;

  useEffect(() => {
    const loadData = async () => {
      await fetchCustomers();
      await fetchWarehouses();

      if (isEdit && invoiceId) {
        await fetchInvoice();
      }
    };

    loadData();
  }, [isEdit, invoiceId]);

  // Fetch products for selected warehouse
  useEffect(() => {
    if (formData.warehouse_id) {
      console.log('🔍 Warehouse seleccionado:', formData.warehouse_id);
      fetchProductsForWarehouse(formData.warehouse_id);
    } else {
      console.log('⚠️ No warehouse seleccionado, limpiando productos');
      setProducts([]);
    }
  }, [formData.warehouse_id]);

  const fetchCustomers = async () => {
    try {
      const response = await customersAPI.getAll();
      setCustomers(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching customers:', error);
      return [];
    }
  };

  const fetchProductsForWarehouse = async (warehouseId: number) => {
    try {
      console.log('📦 Buscando productos para almacén:', warehouseId);

      // Get warehouse-products: [{warehouse_id, product_id, stock}, ...]
      const warehouseProductsResponse = await warehousesAPI.getProducts(warehouseId);
      const warehouseProducts = warehouseProductsResponse.data || [];

      console.log('📦 Respuesta warehouse-products:', warehouseProducts);
      console.log('📦 Cantidad de productos encontrados:', warehouseProducts.length);

      // Fetch complete product details for each product_id
      const productsWithStock = await Promise.all(
        warehouseProducts.map(async (wp: any) => {
          try {
            console.log('📦 Obteniendo detalles del producto:', wp.product_id);
            const productResponse = await productsAPI.getById(wp.product_id);
            const product = productResponse.data;

            // Combine product details with warehouse stock
            return {
              ...product,
              stock_quantity: wp.stock, // Use warehouse stock
              warehouse_id: wp.warehouse_id
            };
          } catch (error) {
            console.error(`❌ Error fetching product ${wp.product_id}:`, error);
            return null;
          }
        })
      );

      // Filter out null values and set products
      const validProducts = productsWithStock.filter(p => p !== null);
      console.log('✅ Productos válidos:', validProducts);
      console.log('✅ Total de productos a mostrar:', validProducts.length);
      setProducts(validProducts);
    } catch (error) {
      console.error('❌ Error fetching products for warehouse:', error);
      setProducts([]);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await warehousesAPI.getAll();
      setWarehouses(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      return [];
    }
  };

  const fetchInvoice = async () => {
    if (!invoiceId) return;
    try {
      setInitialLoading(true);
      const response = await invoicesAPI.getById(invoiceId);
      const invoice = response.data;

      // Mapear items desde el formato del backend al formato del frontend
      // Backend: price_per_unit, tax_rate -> Frontend: unit_price, tax_percent
      const mappedItems = (invoice.items || []).map((item: any) => ({
        product_id: item.product_id,
        product_name: item.product_name || `Producto ${item.product_id}`, // Backend puede no incluir nombre
        quantity: item.quantity,
        unit_price: item.price_per_unit || item.unit_price || 0, // Backend usa price_per_unit
        tax_percent: item.tax_rate !== undefined ? item.tax_rate : (item.tax_percent || 16), // Backend usa tax_rate
        is_exempt: item.is_exempt || false
      }));

      setFormData({
        customer_id: invoice.customer_id,
        warehouse_id: invoice.warehouse_id || null,
        discount: invoice.discount || 0,
        date: invoice.date || new Date().toISOString().split('T')[0],
        due_date: invoice.due_date || '',
        items: mappedItems,
        notes: invoice.notes || '',

        // Venezuela SENIAT - cargar desde la factura
        transaction_type: invoice.transaction_type || 'contado',
        payment_method: invoice.payment_method || 'efectivo',
        credit_days: invoice.credit_days || 0,
        iva_percentage: invoice.iva_percentage || 16,
        customer_phone: invoice.customer_phone || '',
        customer_address: invoice.customer_address || ''
      });

      // Obtener cliente individualmente
      console.log('🔍 Obteniendo cliente ID:', invoice.customer_id);
      try {
        const customerResponse = await customersAPI.getById(invoice.customer_id);
        const customer = customerResponse.data;
        console.log('✅ Cliente obtenido:', customer);
        setSelectedCustomerName(customer.name);

        // Agregar a la lista de clientes si no existe
        if (!customers.find(c => c.id === customer.id)) {
          setCustomers(prev => [...prev, customer]);
        }
      } catch (error) {
        console.error('❌ Error obteniendo cliente:', error);
      }

      // Obtener almacén individualmente
      console.log('🔍 Obteniendo almacén ID:', invoice.warehouse_id);
      try {
        const warehouseResponse = await warehousesAPI.getById(invoice.warehouse_id);
        const warehouse = warehouseResponse.data;
        console.log('✅ Almacén obtenido:', warehouse);
        setSelectedWarehouseName(warehouse.name);

        // Agregar a la lista de almacenes si no existe
        if (!warehouses.find(w => w.id === warehouse.id)) {
          setWarehouses(prev => [...prev, warehouse]);
        }
      } catch (error) {
        console.error('❌ Error obteniendo almacén:', error);
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      setErrors({ general: 'Error al cargar la factura' });
    } finally {
      setInitialLoading(false);
    }
  };

  const selectCustomer = (customer: Customer) => {
    setFormData(prev => ({
      ...prev,
      customer_id: customer.id
    }));
    setSelectedCustomerName(customer.name);
    setShowCustomerDropdown(false);
  };

  const selectWarehouse = (warehouse: Warehouse) => {
    setFormData(prev => ({
      ...prev,
      warehouse_id: warehouse.id,
      // Clear all items when switching warehouses since products are warehouse-specific
      items: []
    }));
    setSelectedWarehouseName(warehouse.name);
    setShowWarehouseDropdown(false);
  };

  const addItem = (product: Product) => {
    const newItem: InvoiceItem = {
      product_id: product.id,
      product_name: product.name,
      quantity: 1,
      unit_price: product.price,
      tax_percent: 16, // Por defecto 16%
      is_exempt: false // Por defecto no exento
    };
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
    setShowProductSearch(false);
    setProductSearch('');
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        [field]: value
      };
      return { ...prev, items: newItems };
    });
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let taxableBase = 0;
    let exemptAmount = 0;
    let tax = 0;

    formData.items.forEach(item => {
      const itemSubtotal = item.quantity * item.unit_price;

      if (item.is_exempt) {
        // Producto exento - no lleva IVA
        exemptAmount += itemSubtotal;
      } else {
        // Producto gravado
        const itemTax = itemSubtotal * (item.tax_percent / 100);
        taxableBase += itemSubtotal;
        tax += itemTax;
      }

      subtotal += itemSubtotal;
    });

    return {
      subtotal,
      taxableBase,
      exemptAmount,
      tax,
      total: subtotal + tax
    };
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.customer_id) {
      newErrors.customer = 'Debes seleccionar un cliente';
    }

    if (!formData.warehouse_id) {
      newErrors.warehouse = 'Debes seleccionar un almacén';
    }

    if (formData.items.length === 0) {
      newErrors.items = 'Debes agregar al menos un producto';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const submitData = {
        customer_id: formData.customer_id,
        warehouse_id: formData.warehouse_id,
        discount: formData.discount,
        date: formData.date,
        due_date: formData.due_date,
        items: formData.items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          tax_rate: item.tax_percent,
          is_exempt: item.is_exempt
        })),
        notes: formData.notes,

        // Venezuela SENIAT
        transaction_type: formData.transaction_type,
        payment_method: formData.payment_method,
        credit_days: formData.credit_days,
        iva_percentage: formData.iva_percentage,
        customer_phone: formData.customer_phone,
        customer_address: formData.customer_address
      };

      // LOG DETALLADO - Ver exactamente qué se envía
      console.log('=== DATOS SIENDO ENVIADOS ===');
      console.log('customer_id:', submitData.customer_id, `(tipo: ${typeof submitData.customer_id})`);
      console.log('warehouse_id:', submitData.warehouse_id, `(tipo: ${typeof submitData.warehouse_id})`);
      console.log('discount:', submitData.discount, `(tipo: ${typeof submitData.discount})`);
      console.log('date:', submitData.date, `(tipo: ${typeof submitData.date})`);
      console.log('due_date:', submitData.due_date, `(tipo: ${typeof submitData.due_date})`);
      console.log('items:', submitData.items, `(cantidad: ${submitData.items.length})`);
      console.log('notes:', submitData.notes, `(tipo: ${typeof submitData.notes})`);
      console.log('payment_terms:', submitData.payment_terms, `(tipo: ${typeof submitData.payment_terms})`);
      console.log('JSON completo:', JSON.stringify(submitData, null, 2));
      console.log('============================');

      if (isEdit && invoiceId) {
        await invoicesAPI.update(invoiceId, submitData);
      } else {
        await invoicesAPI.create(submitData);
      }

      setSuccess(true);

      // Update stock for each product
      if (formData.warehouse_id) {
        console.log('Updating stock for products...');
        for (const item of formData.items) {
          await updateProductStock(
            item.product_id,
            formData.warehouse_id,
            item.quantity
          );
        }
      }

      setTimeout(() => {
        router.push('/invoices');
      }, 1500);
    } catch (error: any) {
      console.error('Error saving invoice:', error);
      setErrors({ general: extractErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(productSearch.toLowerCase())
  );

  const updateProductStock = async (productId: number, warehouseId: number, quantitySold: number) => {
    try {
      // Get current stock
      const currentStockResponse = await warehouseProductsAPI.getByWarehouseAndProduct(warehouseId, productId);
      const currentStock = currentStockResponse.data;

      // Calculate new stock
      const newQuantity = (currentStock?.quantity || 0) - quantitySold;

      // Update stock using POST /api/v1/warehouse-products
      await warehouseProductsAPI.createOrUpdate({
        warehouse_id: warehouseId,
        product_id: productId,
        stock: newQuantity
      });

      console.log(`Stock updated: Product ${productId}, Warehouse ${warehouseId}, New quantity: ${newQuantity}`);
    } catch (error) {
      console.error('Error updating product stock:', error);
      // Don't throw error, just log it - invoice creation should still succeed
    }
  };

  if (initialLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
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
              href="/invoices"
              className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-2xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-light text-gray-900 mb-2">
                {isEdit ? 'Editar Factura' : 'Nueva Factura'}
              </h1>
              <p className="text-gray-500 font-light">
                {isEdit ? 'Modifica la información de la factura' : 'Crea una nueva factura de venta'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-8 bg-green-50/80 border border-green-200 rounded-2xl p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
            <p className="text-green-600 font-medium">
              {isEdit ? 'Factura actualizada correctamente' : 'Factura creada correctamente'}
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errors.general && (
        <div className="mb-8 bg-red-50/80 border border-red-200 rounded-2xl p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
            <p className="text-red-600">{errors.general}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="xl:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Customer & Dates */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-light text-gray-900">Información General</h3>
              </div>
              <div className="p-6 space-y-6">
                {/* Customer Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Cliente *
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
                      className={`w-full px-4 py-3 text-left bg-gray-50/80 border rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all outline-none flex items-center justify-between ${
                        errors.customer ? 'border-red-300' : 'border-gray-200/60 focus:border-blue-300'
                      }`}
                    >
                      <span className={selectedCustomerName ? 'text-gray-900' : 'text-gray-400'}>
                        {selectedCustomerName || 'Seleccionar cliente...'}
                      </span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    
                    {showCustomerDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-lg z-10 max-h-60 overflow-y-auto">
                        {customers.map(customer => (
                          <button
                            key={customer.id}
                            type="button"
                            onClick={() => selectCustomer(customer)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors"
                          >
                            <p className="font-medium text-gray-900">{customer.name}</p>
                            <p className="text-sm text-gray-500">{customer.email}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {errors.customer && (
                    <p className="mt-2 text-sm text-red-600">{errors.customer}</p>
                  )}
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Fecha de Emisión *
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Fecha de Vencimiento
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="date"
                        value={formData.due_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Warehouse Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Almacén *
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowWarehouseDropdown(!showWarehouseDropdown)}
                      className={`w-full px-4 py-3 text-left bg-gray-50/80 border rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all outline-none flex items-center justify-between ${
                        errors.warehouse ? 'border-red-300' : 'border-gray-200/60 focus:border-blue-300'
                      }`}
                    >
                      <span className={selectedWarehouseName ? 'text-gray-900' : 'text-gray-400'}>
                        {selectedWarehouseName || 'Seleccionar almacén...'}
                      </span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    
                    {showWarehouseDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-lg z-10 max-h-60 overflow-y-auto">
                        {warehouses.map(warehouse => (
                          <button
                            key={warehouse.id}
                            type="button"
                            onClick={() => selectWarehouse(warehouse)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors"
                          >
                            <p className="font-medium text-gray-900">{warehouse.name}</p>
                            <p className="text-sm text-gray-500">{warehouse.location}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {errors.warehouse && (
                    <p className="mt-2 text-sm text-red-600">{errors.warehouse}</p>
                  )}
                </div>

                {/* Discount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Descuento (%)
                  </label>
                  <div className="relative">
                    <Percent className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="number"
                      value={formData.discount}
                      onChange={(e) => setFormData(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                      min="0"
                      max="100"
                      step="0.01"
                      className="w-full pl-12 pr-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Venezuela SENIAT Fields */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">Campos Venezuela (SENIAT)</h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Tipo de Transacción */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Tipo Transacción *
                      </label>
                      <select
                        value={formData.transaction_type}
                        onChange={(e) => setFormData(prev => ({ ...prev, transaction_type: e.target.value as 'contado' | 'credito' }))}
                        className="w-full px-3 py-2 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all outline-none text-sm"
                      >
                        <option value="contado">Contado</option>
                        <option value="credito">Crédito</option>
                      </select>
                    </div>

                    {/* Forma de Pago */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Forma de Pago
                      </label>
                      <select
                        value={formData.payment_method}
                        onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all outline-none text-sm"
                      >
                        <option value="efectivo">Efectivo</option>
                        <option value="transferencia">Transferencia</option>
                        <option value="debito">Tarjeta Débito</option>
                        <option value="credito">Tarjeta Crédito</option>
                        <option value="zelle">Zelle</option>
                        <option value="pago_movil">Pago Móvil</option>
                      </select>
                    </div>

                    {/* Días de Crédito */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Días Crédito
                      </label>
                      <input
                        type="number"
                        value={formData.credit_days}
                        onChange={(e) => setFormData(prev => ({ ...prev, credit_days: parseInt(e.target.value) || 0 }))}
                        min="0"
                        className="w-full px-3 py-2 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all outline-none text-sm"
                        disabled={formData.transaction_type === 'contado'}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    {/* Porcentaje IVA */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        IVA General (%)
                      </label>
                      <select
                        value={formData.iva_percentage}
                        onChange={(e) => setFormData(prev => ({ ...prev, iva_percentage: parseFloat(e.target.value) }))}
                        className="w-full px-3 py-2 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all outline-none text-sm"
                      >
                        <option value={16}>16% (General)</option>
                        <option value={8}>8% (Reducido)</option>
                        <option value={0}>0% (Exento)</option>
                      </select>
                    </div>

                    {/* Teléfono Cliente */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Teléfono Cliente
                      </label>
                      <input
                        type="text"
                        value={formData.customer_phone || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all outline-none text-sm"
                        placeholder="+58 414-000-0000"
                      />
                    </div>
                  </div>

                  {/* Dirección Cliente */}
                  <div className="mt-6">
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Dirección Cliente
                    </label>
                    <input
                      type="text"
                      value={formData.customer_address || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, customer_address: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all outline-none text-sm"
                      placeholder="Av. Principal con calle..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Products/Items */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-light text-gray-900">Productos</h3>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowProductSearch(!showProductSearch)}
                      className="flex items-center px-4 py-2 text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      <span className="text-sm font-medium">Agregar Producto</span>
                    </button>

                    {showProductSearch && (
                      <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-lg z-10">
                        <div className="p-3 border-b border-gray-100">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                              type="text"
                              placeholder="Buscar productos..."
                              value={productSearch}
                              onChange={(e) => setProductSearch(e.target.value)}
                              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                              autoFocus
                            />
                          </div>
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                          {filteredProducts.length > 0 ? (
                            filteredProducts.map(product => (
                              <button
                                key={product.id}
                                type="button"
                                onClick={() => addItem(product)}
                                className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors"
                              >
                                <p className="font-medium text-gray-900">{product.name}</p>
                                <div className="flex items-center justify-between text-sm text-gray-500">
                                  <span>{product.sku}</span>
                                  <span className="font-medium text-gray-900">${product.price}</span>
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="p-4 text-center text-gray-500">
                              No se encontraron productos
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6">
                {errors.items && (
                  <div className="mb-4 text-sm text-red-600">{errors.items}</div>
                )}

                {formData.items.length > 0 ? (
                  <div className="space-y-4">
                    {formData.items.map((item, index) => (
                      <div key={index} className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.product_name}</p>
                            <p className="text-sm text-gray-500">Producto ID: {item.product_id}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-5 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Cantidad
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Precio Unitario
                            </label>
                            <div className="relative">
                              <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                              <input
                                type="number"
                                step="0.01"
                                value={item.unit_price}
                                onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value))}
                                className="w-full pl-7 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              IVA %
                            </label>
                            <select
                              value={item.tax_percent}
                              onChange={(e) => updateItem(index, 'tax_percent', parseFloat(e.target.value))}
                              disabled={item.is_exempt}
                              className={`w-full px-3 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                item.is_exempt ? 'border-gray-200 bg-gray-50 text-gray-400' : 'border-gray-200'
                              }`}
                            >
                              <option value={16}>16%</option>
                              <option value={8}>8%</option>
                              <option value={0}>0%</option>
                            </select>
                          </div>

                          <div className="flex items-end">
                            <label className="flex items-center space-x-2 mb-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={item.is_exempt}
                                onChange={(e) => updateItem(index, 'is_exempt', e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                              />
                              <span className="text-xs font-medium text-gray-700">Exento</span>
                            </label>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Subtotal
                            </label>
                            <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm">
                              <span className={`font-medium ${item.is_exempt ? 'text-green-700' : 'text-gray-900'}`}>
                                ${(item.quantity * item.unit_price).toFixed(2)}
                              </span>
                              {item.is_exempt && (
                                <span className="block text-xs text-green-600">Exento</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No hay productos agregados</p>
                    <p className="text-sm text-gray-400 mt-1">Haz clic en &quot;Agregar Producto&quot; para comenzar</p>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-light text-gray-900">Notas y Términos</h3>
              </div>
              <div className="p-6">
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Notas adicionales, términos especiales, etc..."
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none resize-none"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4">
              <Link
                href="/invoices"
                className="px-6 py-3 text-gray-600 bg-white/80 border border-gray-200/60 rounded-2xl hover:bg-white hover:border-gray-300 transition-all font-light"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                <span className="font-light">
                  {loading ? 'Guardando...' : isEdit ? 'Actualizar Factura' : 'Crear Factura'}
                </span>
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar - Invoice Preview */}
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 overflow-hidden sticky top-8">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-light text-gray-900">Resumen</h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {/* Subtotal */}
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(totals.subtotal)}
                  </span>
                </div>

                {/* Venezuela - Base Imponible */}
                {totals.taxableBase > 0 && (
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Base Imponible</span>
                    <span className="text-sm text-gray-700">
                      {formatCurrency(totals.taxableBase)}
                    </span>
                  </div>
                )}

                {/* Venezuela - Monto Exento */}
                {totals.exemptAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-xs text-green-600">Monto Exento</span>
                    <span className="text-sm text-green-700">
                      {formatCurrency(totals.exemptAmount)}
                    </span>
                  </div>
                )}

                {/* IVA */}
                <div className="flex justify-between">
                  <span className="text-gray-600">IVA ({formData.iva_percentage}%)</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(totals.tax)}
                  </span>
                </div>

                {/* Total */}
                <div className="flex justify-between pt-3 border-t border-gray-200">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="text-2xl font-light text-blue-600">
                    {formatCurrency(totals.total)}
                  </span>
                </div>
              </div>

              {/* Venezuela Info */}
              {(totals.taxableBase > 0 || totals.exemptAmount > 0) && (
                <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-600 mb-2 font-medium">Desglose IVA (Venezuela):</p>
                  <div className="space-y-1">
                    {totals.taxableBase > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Operaciones gravadas:</span>
                        <span className="text-gray-700">{formatCurrency(totals.taxableBase)}</span>
                      </div>
                    )}
                    {totals.exemptAmount > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-green-600">Operaciones exentas:</span>
                        <span className="text-green-700">{formatCurrency(totals.exemptAmount)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-4 p-4 bg-blue-50 rounded-2xl">
                <p className="text-sm text-blue-900">
                  <span className="font-medium">Items:</span> {formData.items.length}
                </p>
              </div>
            </div>
          </div>

          {/* Help Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-light text-gray-900">Consejos</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Cliente requerido</p>
                    <p className="text-xs text-gray-500">
                      Selecciona el cliente antes de guardar
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Productos únicos</p>
                    <p className="text-xs text-gray-500">
                      Cada producto debe agregarse una sola vez
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Impuestos flexibles</p>
                    <p className="text-xs text-gray-500">
                      Puedes ajustar el % de impuesto por producto
                    </p>
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

export default InvoiceFormPage;