'use client'
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2,
  Plus,
  Trash2,
  Truck,
  Calendar,
  DollarSign,
  Package,
  X,
  Search,
  Building2
} from 'lucide-react';
import { purchasesAPI, suppliersAPI, warehousesAPI, warehouseProductsAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { extractErrorMessage } from '@/lib/errorHandler';

interface PurchaseItem {
  product_id: number;
  product_name: string;
  quantity: number;
  price_per_unit: number;
  tax_rate?: number;
  is_exempt?: boolean;
}

interface PurchaseFormData {
  supplier_id: number | null;
  warehouse_id: number | null;
  date: string;
  expected_delivery_date: string;
  items: PurchaseItem[];
  notes: string;
  // ✅ VENEZUELA: SENIAT fiscal fields
  invoice_number?: string;
  control_number?: string;
  transaction_type?: 'contado' | 'credito';
  payment_method?: string;
  credit_days?: number;
  iva_percentage?: number;
  iva_retention_percentage?: number;
  islr_retention_percentage?: number;
  stamp_tax?: number;
  supplier_phone?: string;
  supplier_address?: string;
}

interface Supplier {
  id: number;
  name: string;
  email: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  stock_quantity?: number;
  warehouse_id?: number;
}

interface Warehouse {
  id: number;
  name: string;
  location: string;
}

const NewPurchasePage = () => {
  const [formData, setFormData] = useState<PurchaseFormData>({
    supplier_id: null,
    warehouse_id: null,
    date: new Date().toISOString().split('T')[0],
    expected_delivery_date: '',
    items: [],
    notes: '',
    // ✅ VENEZUELA: Default SENIAT values
    transaction_type: 'contado',
    payment_method: 'transferencia',
    iva_percentage: 16,
    iva_retention_percentage: 0,
    islr_retention_percentage: 0,
    stamp_tax: 0
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [showWarehouseDropdown, setShowWarehouseDropdown] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [selectedSupplierName, setSelectedSupplierName] = useState('');
  const [selectedWarehouseName, setSelectedWarehouseName] = useState('');

  const router = useRouter();

  useEffect(() => {
    fetchSuppliers();
    fetchWarehouses();
  }, []);

  // Fetch products for selected warehouse
  useEffect(() => {
    if (formData.warehouse_id) {
      fetchProductsForWarehouse(formData.warehouse_id);
    }
  }, [formData.warehouse_id]);

  const fetchSuppliers = async () => {
    try {
      const response = await suppliersAPI.getAll();
      setSuppliers(response.data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchProductsForWarehouse = async (warehouseId: number) => {
    try {
      console.log('🔄 [PURCHASES] Fetching products for warehouse:', warehouseId);

      // Get warehouse-products with product details already included
      const warehouseProductsResponse = await warehousesAPI.getProducts(warehouseId);
      const warehouseProducts = warehouseProductsResponse.data || [];

      console.log('📦 [PURCHASES] Warehouse products response:', warehouseProducts);

      // Process products - data already includes nested product details
      const productsWithStock = warehouseProducts
        .map((wp: any) => {
          // The join returns the product under the "product" key; skip if missing
          if (!wp.product) {
            console.warn(`⚠️ [PURCHASES] Product ${wp.product_id} not found`);
            return null;
          }

          // Combine warehouse product data with product details
          return {
            id: wp.product.id,
            name: wp.product.name,
            sku: wp.product.sku,
            price: wp.product.price_usd || wp.product.price || 0,
            stock_quantity: wp.stock || 0,
            warehouse_id: wp.warehouse_id,
            description: wp.product.description,
            category_id: wp.product.category_id
          };
        })
        .filter(p => p !== null);

      console.log('✅ [PURCHASES] Valid products loaded:', productsWithStock.length);
      console.log('📋 [PURCHASES] Products:', productsWithStock);

      setProducts(productsWithStock);

      // Show helpful message if no products
      if (productsWithStock.length === 0) {
        console.warn('⚠️ [PURCHASES] No products found for warehouse:', warehouseId);
      }
    } catch (error) {
      console.error('❌ [PURCHASES] Error fetching products for warehouse:', error);
      setProducts([]);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await warehousesAPI.getAll();
      setWarehouses(response.data || []);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const selectSupplier = (supplier: Supplier) => {
    setFormData(prev => ({
      ...prev,
      supplier_id: supplier.id
    }));
    setSelectedSupplierName(supplier.name);
    setShowSupplierDropdown(false);
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
    // Check if product already exists in items
    const existingItem = formData.items.find(item => item.product_id === product.id);
    if (existingItem) {
      setErrors({ items: 'Este producto ya está en la lista. Edita la cantidad si necesitas más.' });
      return;
    }

    const newItem: PurchaseItem = {
      product_id: product.id,
      product_name: product.name,
      quantity: 1,
      price_per_unit: product.price || 0, // Use product's base price as default
      tax_rate: formData.iva_percentage || 16, // Default IVA
      is_exempt: false // Default to taxable
    };
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
    setShowProductSearch(false);
    setProductSearch('');
    setErrors({});
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
    let ivaAmount = 0;

    formData.items.forEach(item => {
      const itemSubtotal = item.quantity * item.price_per_unit;
      subtotal += itemSubtotal;

      if (item.is_exempt) {
        exemptAmount += itemSubtotal;
      } else {
        taxableBase += itemSubtotal;
        const itemIva = itemSubtotal * (item.tax_rate || formData.iva_percentage || 16) / 100;
        ivaAmount += itemIva;
      }
    });

    // Calculate retentions
    const ivaRetention = taxableBase * (formData.iva_retention_percentage || 0) / 100;
    const islrRetention = taxableBase * (formData.islr_retention_percentage || 0) / 100;
    const stampTax = formData.stamp_tax || 0;

    const totalWithTaxes = subtotal + ivaAmount + stampTax - ivaRetention - islrRetention;

    return {
      subtotal,
      taxableBase,
      exemptAmount,
      ivaAmount,
      ivaRetention,
      islrRetention,
      stampTax,
      total: totalWithTaxes,
      itemCount: formData.items.length
    };
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.supplier_id) {
      newErrors.supplier = 'Debes seleccionar un proveedor';
    }

    if (!formData.warehouse_id) {
      newErrors.warehouse = 'Debes seleccionar un almacén';
    }

    if (formData.items.length === 0) {
      newErrors.items = 'Debes agregar al menos un producto';
    }

    formData.items.forEach((item, index) => {
      if (item.quantity <= 0) {
        newErrors[`item_${index}_quantity`] = 'La cantidad debe ser mayor a 0';
      }
      if (item.price_per_unit <= 0) {
        newErrors[`item_${index}_price`] = 'El precio debe ser mayor a 0';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateProductStock = async (productId: number, warehouseId: number, quantityReceived: number) => {
    try {
      console.log(`Updating stock for product ${productId} in warehouse ${warehouseId}, adding ${quantityReceived}`);

      // Get current stock
      const currentStockResponse = await warehouseProductsAPI.getByWarehouseAndProduct(warehouseId, productId);
      const currentStock = currentStockResponse.data;

      // Calculate new stock (INCREASE for purchases)
      const newQuantity = (currentStock?.stock || 0) + quantityReceived;

      console.log(`Current stock: ${currentStock?.stock || 0}, New stock: ${newQuantity}`);

      // Update stock
      await warehouseProductsAPI.createOrUpdate({
        warehouse_id: warehouseId,
        product_id: productId,
        stock: newQuantity
      });

      console.log(`Stock updated successfully for product ${productId}`);
    } catch (error: any) {
      // If 404, the warehouse-product doesn't exist yet, create it
      if (error.response?.status === 404) {
        console.log(`Warehouse-product not found, creating new entry for product ${productId}`);

        await warehouseProductsAPI.createOrUpdate({
          warehouse_id: warehouseId,
          product_id: productId,
          stock: quantityReceived
        });

        console.log(`Warehouse-product created successfully for product ${productId}`);
      } else {
        console.error(`Error updating stock for product ${productId}:`, error);
        throw error;
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Verificar explícitamente que los campos requeridos no sean null
    if (!formData.supplier_id || !formData.warehouse_id) {
      setErrors({ general: 'Por favor selecciona un proveedor y un almacén' });
      return;
    }

    try {
      setLoading(true);

      const totals = calculateTotals();

      const submitData: any = {
        supplier_id: Number(formData.supplier_id),
        warehouse_id: Number(formData.warehouse_id),
        date: new Date(formData.date).toISOString(),
        status: 'pending',
        items: formData.items.map(item => ({
          product_id: Number(item.product_id),
          quantity: Number(item.quantity),
          price_per_unit: Number(item.price_per_unit),
          tax_rate: item.is_exempt ? 0 : (item.tax_rate || formData.iva_percentage || 16),
          is_exempt: item.is_exempt || false
        })),
        // ✅ VENEZUELA: SENIAT fields
        invoice_number: formData.invoice_number || null,
        control_number: formData.control_number || null,
        transaction_type: formData.transaction_type || 'contado',
        payment_method: formData.payment_method || 'transferencia',
        credit_days: formData.transaction_type === 'credito' ? (formData.credit_days || 30) : 0,
        iva_percentage: formData.iva_percentage || 16,
        iva_amount: totals.ivaAmount,
        taxable_base: totals.taxableBase,
        exempt_amount: totals.exemptAmount,
        iva_retention: totals.ivaRetention,
        iva_retention_percentage: formData.iva_retention_percentage || 0,
        islr_retention: totals.islrRetention,
        islr_retention_percentage: formData.islr_retention_percentage || 0,
        stamp_tax: totals.stampTax,
        subtotal: totals.subtotal,
        total_with_taxes: totals.total,
        supplier_phone: formData.supplier_phone || null,
        supplier_address: formData.supplier_address || null
      };

      // Agregar expected_delivery_date y notes solo si tienen valores
      if (formData.expected_delivery_date) {
        submitData.expected_delivery_date = new Date(formData.expected_delivery_date).toISOString();
      }
      if (formData.notes) {
        submitData.notes = formData.notes;
      }

      console.log('Creating purchase with data:', submitData);

      const purchaseResponse = await purchasesAPI.create(submitData);

      console.log('Purchase created successfully, updating warehouse stock...');

      // Update warehouse stock for each item
      if (formData.warehouse_id) {
        for (const item of formData.items) {
          await updateProductStock(
            item.product_id,
            formData.warehouse_id,
            item.quantity
          );
        }
      }

      console.log('All stock updates completed');

      setSuccess(true);

      setTimeout(() => {
        router.push('/purchases');
      }, 1500);
    } catch (error: any) {
      console.error('Error creating purchase:', error);
      setErrors({ general: extractErrorMessage(error) });
    } finally {
      setLoading(false);
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

  const totals = calculateTotals();

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    supplier.email.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.sku.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Link
            href="/purchases"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-light text-gray-900">Nueva Compra</h1>
            <p className="text-gray-500 font-light">Crea una nueva orden de compra</p>
          </div>
        </div>
      </div>

      {success ? (
        <div className="bg-green-50 border border-green-200 rounded-3xl p-12 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-light text-green-900 mb-2">¡Compra creada!</h2>
          <p className="text-green-700 mb-6">La orden de compra se ha creado correctamente.</p>
          <Loader2 className="w-6 h-6 animate-spin text-green-500 mx-auto" />
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form (2/3) */}
            <div className="lg:col-span-2 space-y-6">
              {/* General Error */}
              {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-red-900">Error</h3>
                    <p className="text-sm text-red-700 mt-1">{errors.general}</p>
                  </div>
                </div>
              )}

              {/* Information Card */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-6">Información de la Compra</h2>

                <div className="space-y-4">
                  {/* Supplier Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Proveedor <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowSupplierDropdown(!showSupplierDropdown)}
                        className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none text-left flex items-center justify-between"
                      >
                        <span className={selectedSupplierName ? 'text-gray-900' : 'text-gray-400'}>
                          {selectedSupplierName || 'Seleccionar proveedor...'}
                        </span>
                        <Building2 className="w-5 h-5 text-gray-400" />
                      </button>

                      {showSupplierDropdown && (
                        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-lg max-h-60 overflow-y-auto">
                          <div className="p-2">
                            <input
                              type="text"
                              placeholder="Buscar proveedor..."
                              value={productSearch}
                              onChange={(e) => setProductSearch(e.target.value)}
                              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100"
                            />
                          </div>
                          {filteredSuppliers.length > 0 ? (
                            filteredSuppliers.map((supplier) => (
                              <button
                                key={supplier.id}
                                type="button"
                                onClick={() => selectSupplier(supplier)}
                                className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                              >
                                <div className="font-medium text-gray-900">{supplier.name}</div>
                                <div className="text-sm text-gray-500">{supplier.email}</div>
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-sm text-gray-500 text-center">
                              No se encontraron proveedores
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {errors.supplier && (
                      <p className="mt-1 text-sm text-red-600">{errors.supplier}</p>
                    )}
                  </div>

                  {/* Warehouse Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Almacén <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowWarehouseDropdown(!showWarehouseDropdown)}
                        className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none text-left flex items-center justify-between"
                      >
                        <span className={selectedWarehouseName ? 'text-gray-900' : 'text-gray-400'}>
                          {selectedWarehouseName || 'Seleccionar almacén...'}
                        </span>
                        <Package className="w-5 h-5 text-gray-400" />
                      </button>

                      {showWarehouseDropdown && (
                        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-lg max-h-60 overflow-y-auto">
                          {warehouses.length > 0 ? (
                            warehouses.map((warehouse) => (
                              <button
                                key={warehouse.id}
                                type="button"
                                onClick={() => selectWarehouse(warehouse)}
                                className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                              >
                                <div className="font-medium text-gray-900">{warehouse.name}</div>
                                <div className="text-sm text-gray-500">{warehouse.location}</div>
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-sm text-gray-500 text-center">
                              No hay almacenes disponibles
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {errors.warehouse && (
                      <p className="mt-1 text-sm text-red-600">{errors.warehouse}</p>
                    )}
                  </div>

                  {/* Date Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha de Compra <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha de Entrega Esperada
                      </label>
                      <input
                        type="date"
                        value={formData.expected_delivery_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, expected_delivery_date: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notas
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                      placeholder="Notas adicionales sobre la compra..."
                      className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* ✅ VENEZUELA: SENIAT Fiscal Information Card */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-6">Información Fiscal (SENIAT)</h2>

                <div className="space-y-4">
                  {/* Invoice and Control Numbers */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Número de Factura
                      </label>
                      <input
                        type="text"
                        value={formData.invoice_number || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, invoice_number: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                        placeholder="Ej: 001-000123"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Número de Control
                      </label>
                      <input
                        type="text"
                        value={formData.control_number || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, control_number: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                        placeholder="Ej: 123456789"
                      />
                    </div>
                  </div>

                  {/* Transaction Type and Payment Method */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de Transacción
                      </label>
                      <select
                        value={formData.transaction_type || 'contado'}
                        onChange={(e) => setFormData(prev => ({ ...prev, transaction_type: e.target.value as any }))}
                        className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                      >
                        <option value="contado">Contado</option>
                        <option value="credito">Crédito</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Forma de Pago
                      </label>
                      <select
                        value={formData.payment_method || 'transferencia'}
                        onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                      >
                        <option value="efectivo">Efectivo</option>
                        <option value="transferencia">Transferencia</option>
                        <option value="cheque">Cheque</option>
                        <option value="tarjeta">Tarjeta de Crédito/Débito</option>
                        <option value="deposito">Depósito</option>
                      </select>
                    </div>
                  </div>

                  {/* Credit Days (only for credit transactions) */}
                  {formData.transaction_type === 'credito' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Días de Crédito
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.credit_days || 30}
                        onChange={(e) => setFormData(prev => ({ ...prev, credit_days: parseInt(e.target.value) || 30 }))}
                        className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                      />
                    </div>
                  )}

                  {/* Tax Percentages */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        % IVA
                      </label>
                      <select
                        value={formData.iva_percentage || 16}
                        onChange={(e) => {
                          const newIva = parseFloat(e.target.value);
                          setFormData(prev => ({ ...prev, iva_percentage: newIva }));
                          // Update all non-exempt items with new IVA rate
                          setFormData(prev => ({
                            ...prev,
                            items: prev.items.map(item => ({
                              ...item,
                              tax_rate: item.is_exempt ? 0 : newIva
                            }))
                          }));
                        }}
                        className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                      >
                        <option value="0">0% (Exento)</option>
                        <option value="8">8%</option>
                        <option value="16">16%</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        % Retención IVA
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={formData.iva_retention_percentage || 0}
                        onChange={(e) => setFormData(prev => ({ ...prev, iva_retention_percentage: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        % Retención ISLR
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={formData.islr_retention_percentage || 0}
                        onChange={(e) => setFormData(prev => ({ ...prev, islr_retention_percentage: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                      />
                    </div>
                  </div>

                  {/* Stamp Tax */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Timado Fiscal (Bs)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.stamp_tax || 0}
                      onChange={(e) => setFormData(prev => ({ ...prev, stamp_tax: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                    />
                  </div>

                  {/* Supplier Contact Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Teléfono Proveedor
                      </label>
                      <input
                        type="text"
                        value={formData.supplier_phone || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, supplier_phone: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                        placeholder="Ej: 0212-1234567"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dirección Proveedor
                      </label>
                      <input
                        type="text"
                        value={formData.supplier_address || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, supplier_address: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                        placeholder="Dirección fiscal del proveedor"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Products Card */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-medium text-gray-900">Productos</h2>
                  <button
                    type="button"
                    onClick={() => {
                      if (formData.warehouse_id) {
                        setShowProductSearch(!showProductSearch);
                      } else {
                        setErrors({ warehouse: 'Selecciona un almacén primero' });
                      }
                    }}
                    className="flex items-center px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors"
                    disabled={!formData.warehouse_id}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Producto
                  </button>
                </div>

                {errors.items && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3">
                    <p className="text-sm text-red-700">{errors.items}</p>
                  </div>
                )}

                {/* Product Search Dropdown */}
                {showProductSearch && (
                  <div className="mb-6 relative">
                    <div className="flex items-center space-x-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Buscar producto por nombre o SKU..."
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          autoFocus
                          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-100 outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setShowProductSearch(false);
                          setProductSearch('');
                        }}
                        className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Product List */}
                    <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-lg max-h-60 overflow-y-auto">
                      {filteredProducts.length > 0 ? (
                        filteredProducts.map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => addItem(product)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-900">{product.name}</div>
                                <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-gray-900">
                                  {formatCurrency(product.price)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Stock: {product.stock_quantity || 0}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center">
                          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500 text-sm font-medium mb-1">
                            {productSearch ? 'No se encontraron productos' : 'No hay productos disponibles'}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {productSearch
                              ? `No hay resultados para "${productSearch}"`
                              : `Selecciona un almacén para ver sus productos`
                            }
                          </p>
                          {!productSearch && formData.warehouse_id && products.length === 0 && (
                            <p className="text-blue-600 text-xs mt-2">
                              💬 El almacén seleccionado no tiene productos asociados
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Items List */}
                {formData.items.length > 0 ? (
                  <div className="space-y-3">
                    {formData.items.map((item, index) => (
                      <div key={index} className="bg-gray-50 rounded-2xl p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Producto</label>
                            <p className="font-medium text-gray-900">{item.product_name}</p>
                            {/* ✅ VENEZUELA: Exempt toggle */}
                            <div className="mt-2 flex items-center">
                              <input
                                type="checkbox"
                                id={`exempt_${index}`}
                                checked={item.is_exempt || false}
                                onChange={(e) => updateItem(index, 'is_exempt', e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded border-gray-300"
                              />
                              <label htmlFor={`exempt_${index}`} className="ml-2 text-xs text-gray-600">
                                Exento de IVA
                              </label>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Cantidad</label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100"
                            />
                            {errors[`item_${index}_quantity`] && (
                              <p className="mt-1 text-xs text-red-600">{errors[`item_${index}_quantity`]}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Precio Unitario</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.price_per_unit}
                              onChange={(e) => updateItem(index, 'price_per_unit', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100"
                            />
                            {errors[`item_${index}_price`] && (
                              <p className="mt-1 text-xs text-red-600">{errors[`item_${index}_price`]}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                          <div className="text-sm">
                            <span className="font-medium text-gray-900">
                              Subtotal: {formatCurrency(item.quantity * item.price_per_unit)}
                            </span>
                            {!item.is_exempt && (
                              <span className="ml-3 text-xs text-gray-500">
                                + IVA ({item.tax_rate || formData.iva_percentage || 16}%): {formatCurrency(item.quantity * item.price_per_unit * (item.tax_rate || formData.iva_percentage || 16) / 100)}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No hay productos agregados</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar (1/3) */}
            <div className="space-y-6">
              {/* Summary Card */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Resumen Fiscal</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Productos</span>
                    <span className="font-medium text-gray-900">{totals.itemCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium text-gray-900">{formatCurrency(totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base Imponible</span>
                    <span className="font-medium text-gray-900">{formatCurrency(totals.taxableBase)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Exento</span>
                    <span className="font-medium text-gray-900">{formatCurrency(totals.exemptAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">IVA</span>
                    <span className="font-medium text-blue-600">{formatCurrency(totals.ivaAmount)}</span>
                  </div>
                  {totals.ivaRetention > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ret. IVA</span>
                      <span className="font-medium text-red-600">-{formatCurrency(totals.ivaRetention)}</span>
                    </div>
                  )}
                  {totals.islrRetention > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ret. ISLR</span>
                      <span className="font-medium text-red-600">-{formatCurrency(totals.islrRetention)}</span>
                    </div>
                  )}
                  {totals.stampTax > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Timado Fiscal</span>
                      <span className="font-medium text-gray-900">{formatCurrency(totals.stampTax)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between">
                      <span className="text-gray-900 font-medium">Total</span>
                      <span className="text-xl font-light text-purple-600">{formatCurrency(totals.total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tips Card */}
              <div className="bg-purple-50 border border-purple-200 rounded-3xl p-6">
                <h3 className="text-sm font-medium text-purple-900 mb-3">Información</h3>
                <ul className="space-y-2 text-sm text-purple-800">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>El precio es el costo de compra</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Los productos son específicos por almacén</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>El stock se actualizará automáticamente al crear la compra</span>
                  </li>
                </ul>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl hover:from-purple-600 hover:to-purple-700 transition-all transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Crear Compra
                    </>
                  )}
                </button>

                <Link
                  href="/purchases"
                  className="w-full flex items-center justify-center px-6 py-3 text-gray-600 bg-white/80 border border-gray-200/60 rounded-2xl hover:bg-white hover:border-gray-300 transition-all"
                >
                  Cancelar
                </Link>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default NewPurchasePage;
