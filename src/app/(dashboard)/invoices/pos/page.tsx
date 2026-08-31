'use client'
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  User,
  X,
  Package,
  CreditCard,
  DollarSign,
  Loader2,
  CheckCircle,
  AlertCircle,
  LayoutGrid,
  List,
  Building2
} from 'lucide-react';
import { invoicesAPI, customersAPI, productsAPI, warehousesAPI, warehouseProductsAPI, referencePricesAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { extractErrorMessage } from '@/lib/errorHandler';
import type { InvoiceTotalsResponse } from '@/types/api';

interface Warehouse {
  id: number;
  name: string;
  address?: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  price_usd?: number; // ✅ MULTI-MONEDA: Precio de referencia en USD
  description?: string;
  image?: string;
  stock_quantity?: number;
  category_name?: string;
  // Warehouse product specific fields
  quantity?: number;
  min_stock?: number;
  max_stock?: number;
  cost?: number;
  warehouse_id?: number;
  product_id?: number;
}

interface Customer {
  id: number;
  name: string;
  email: string;
  phone?: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  tax_percent: number; // 16, 8, 0
  is_exempt: boolean;
}

const POSPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerSelector, setShowCustomerSelector] = useState(false);
  const [showWarehouseSelector, setShowWarehouseSelector] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // ✅ REF Pricing state
  const [refTotals, setRefTotals] = useState<InvoiceTotalsResponse | null>(null);
  const [loadingRef, setLoadingRef] = useState(false);
  const [useRefPricing, setUseRefPricing] = useState(true); // Default to REF pricing

  // Mobile cart toggle
  const [showCart, setShowCart] = useState(false);

  // Venezuela SENIAT fields
  const [transactionType, setTransactionType] = useState<'contado' | 'credito'>('contado');
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [creditDays, setCreditDays] = useState(0);
  const [ivaPercentage, setIvaPercentage] = useState(16);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch products for selected warehouse
  useEffect(() => {
    if (selectedWarehouse) {
      fetchProductsForWarehouse(selectedWarehouse.id);
    }
  }, [selectedWarehouse]);

  // ✅ Calculate REF totals when cart or payment method changes
  useEffect(() => {
    if (cart.length > 0 && useRefPricing) {
      calculateREFTotals();
    } else {
      setRefTotals(null);
    }
  }, [cart, paymentMethod, useRefPricing]);

  const calculateREFTotals = async () => {
    try {
      setLoadingRef(true);

      const items = cart.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity
      }));

      const response = await referencePricesAPI.calculateInvoiceTotals(
        items,
        selectedCustomer?.id,
        paymentMethod
      );

      setRefTotals(response.data);
    } catch (error) {
      console.error('Error calculating REF totals:', error);
      // Don't show error to user, just fall back to legacy pricing
      setRefTotals(null);
    } finally {
      setLoadingRef(false);
    }
  };

  const fetchData = async () => {
    try {
      setInitialLoading(true);
      const [customersRes, warehousesRes] = await Promise.all([
        customersAPI.getAll(),
        warehousesAPI.getAll()
      ]);
      setCustomers(customersRes.data || []);
      setWarehouses(warehousesRes.data || []);

      // Auto-select first warehouse if available
      if (warehousesRes.data && warehousesRes.data.length > 0) {
        const firstWarehouse = warehousesRes.data[0];
        setSelectedWarehouse(firstWarehouse);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setErrors({ general: 'Error al cargar los datos' });
      // Set empty arrays as fallback
      setCustomers([]);
      setWarehouses([]);
      setProducts([]);
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchProductsForWarehouse = async (warehouseId: number) => {
    try {
      console.log('🔍 [POS] Fetching products for warehouse:', warehouseId);

      // Get warehouse-products: [{warehouse_id, product_id, stock}, ...]
      const warehouseProductsResponse = await warehousesAPI.getProducts(warehouseId);
      const warehouseProducts = warehouseProductsResponse.data || [];

      console.log('📦 [POS] Warehouse products response:', warehouseProductsResponse);
      console.log('📊 [POS] Number of warehouse products found:', warehouseProducts.length);

      if (warehouseProducts.length === 0) {
        console.warn('⚠️ [POS] No products found for this warehouse');
        setProducts([]);
        setErrors(prev => ({
          ...prev,
          products: 'No hay productos asociados a este almacén. Por favor agrega productos al almacén primero.'
        }));
        return;
      }

      // Fetch complete product details for each product_id
      const productsWithStock = await Promise.all(
        warehouseProducts.map(async (wp: any) => {
          try {
            console.log('🔄 [POS] Fetching product details for product_id:', wp.product_id);
            const productResponse = await productsAPI.getById(wp.product_id);
            const product = productResponse.data;

            if (!product) {
              console.warn('⚠️ [POS] Product not found:', wp.product_id);
              return null;
            }

            // Combine product details with warehouse stock
            return {
              ...product,
              stock_quantity: wp.stock || 0, // Use warehouse stock
              warehouse_id: wp.warehouse_id
            };
          } catch (error) {
            console.error(`❌ [POS] Error fetching product ${wp.product_id}:`, error);
            return null;
          }
        })
      );

      // Filter out null values and set products
      const validProducts = productsWithStock.filter(p => p !== null);
      console.log('✅ [POS] Valid products loaded:', validProducts.length);

      if (validProducts.length === 0) {
        setErrors(prev => ({
          ...prev,
          products: 'No se pudieron cargar los detalles de los productos. Verifica que los productos estén activos.'
        }));
      }

      setProducts(validProducts);

      // Clear error if successful
      if (validProducts.length > 0) {
        setErrors(prev => {
          const { products, ...rest } = prev;
          return rest;
        });
      }
    } catch (error) {
      console.error('❌ [POS] Error fetching products for warehouse:', error);
      setProducts([]);
      setErrors(prev => ({
        ...prev,
        products: `Error al cargar productos: ${error instanceof Error ? error.message : 'Error desconocido'}`
      }));
    }
  };

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      // Auto-open cart on mobile when adding first item
      setShowCart(true);
      return [...prevCart, {
        product,
        quantity: 1,
        tax_percent: ivaPercentage, // Usar IVA general
        is_exempt: false
      }];
    });
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.product.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const removeFromCart = (productId: number) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let taxableBase = 0;
    let exemptAmount = 0;
    let tax = 0;

    cart.forEach(item => {
      const itemSubtotal = item.product.price * item.quantity;

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

  const handleCheckout = async () => {
    if (!selectedCustomer) {
      setErrors({ customer: 'Debes seleccionar un cliente' });
      return;
    }

    if (!selectedWarehouse) {
      setErrors({ warehouse: 'Debes seleccionar un almacén' });
      return;
    }

    if (cart.length === 0) {
      setErrors({ items: 'El carrito está vacío' });
      return;
    }

    try {
      setLoading(true);

      // Calcular totales de la factura
      const { subtotal, taxableBase, exemptAmount, tax, total } = calculateTotals();

      const invoiceData = {
        customer_id: selectedCustomer.id,
        warehouse_id: selectedWarehouse.id,
        status: 'factura',
        discount: 0,
        date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        items: cart.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          price_per_unit: item.product.price,
          tax_rate: item.tax_percent,
          is_exempt: item.is_exempt
        })),
        notes: 'Venta desde POS',

        // Totales
        subtotal: subtotal,
        iva_amount: tax,
        taxable_base: taxableBase,
        exempt_amount: exemptAmount,
        total_with_taxes: total,
        total_amount: total,

        // Venezuela SENIAT
        transaction_type: transactionType,
        payment_method: paymentMethod,
        credit_days: creditDays,
        iva_percentage: ivaPercentage,
        customer_phone: customerPhone || undefined,
        customer_address: customerAddress || undefined
      };

      await invoicesAPI.create(invoiceData);

      setSuccess(true);

      // Update stock for each product
      console.log('Updating stock for products...');
      for (const item of cart) {
        await updateProductStock(
          item.product.id,
          selectedWarehouse.id,
          item.quantity
        );
      }

      // Refresh products to show updated stock
      await fetchProductsForWarehouse(selectedWarehouse.id);

      // Reset everything after 2 seconds
      setTimeout(() => {
        setCart([]);
        setSelectedCustomer(null);
        // Don't reset warehouse as it's likely the same for next sale
        setSuccess(false);
      }, 2000);

    } catch (error: any) {
      console.error('Error creating invoice:', error);
      setErrors({ general: extractErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = (products || []).filter(p =>
    p?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p?.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCustomers = (customers || []).filter(c =>
    c?.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c?.email?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const { subtotal, taxableBase, exemptAmount, tax, total } = calculateTotals();

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
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 md:space-x-4">
            <Link
              href="/invoices"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl md:text-2xl font-light text-gray-900">Punto de Venta</h1>
              <p className="text-xs md:text-sm text-gray-500 hidden sm:block">Sistema de ventas rápidas</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 md:space-x-3">
            {/* Mobile cart toggle */}
            <button
              onClick={() => setShowCart(!showCart)}
              className="lg:hidden relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="hidden sm:block p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              title={viewMode === 'grid' ? 'Vista de lista' : 'Vista de grid'}
            >
              {viewMode === 'grid' ? <List className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mx-4 md:mx-6 mt-4 bg-green-50/80 border border-green-200 rounded-2xl p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
            <p className="text-green-600 font-medium">Venta realizada correctamente</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errors.general && (
        <div className="mx-4 md:mx-6 mt-4 bg-red-50/80 border border-red-200 rounded-2xl p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
            <p className="text-red-600">{errors.general}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Products Section */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Search Bar */}
          <div className="p-3 md:p-6 pb-2">
            <div className="relative">
              <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 md:pl-12 pr-3 md:pr-4 py-2 md:py-4 bg-white border border-gray-200 rounded-xl md:rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-lg"
                autoFocus
              />
            </div>
          </div>

          {/* Products Grid/List */}
          <div className="flex-1 overflow-y-auto p-3 md:p-6">
            {/* Product Error Message */}
            {errors.products && (
              <div className="mb-4 bg-yellow-50/80 border border-yellow-200 rounded-2xl p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-yellow-800 font-medium mb-1">No se pueden mostrar los productos</p>
                    <p className="text-yellow-700 text-sm">{errors.products}</p>
                    <button
                      onClick={() => fetchProductsForWarehouse(selectedWarehouse?.id || 0)}
                      className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                    >
                      Reintentar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* No Warehouse Selected */}
            {!selectedWarehouse && !errors.products && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Building2 className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Selecciona un almacén</h3>
                <p className="text-gray-500 text-sm mb-4">
                  Para ver los productos, primero selecciona un almacén de la lista superior
                </p>
                {warehouses.length === 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 max-w-md">
                    <p className="text-blue-800 text-sm mb-3">
                      No tienes almacenes creados. Crea uno primero para poder agregar productos.
                    </p>
                    <Link
                      href="/warehouses/new"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Crear Almacén
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* No Products Found */}
            {selectedWarehouse && !errors.products && filteredProducts.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Package className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay productos disponibles</h3>
                <p className="text-gray-500 text-sm mb-4">
                  {searchTerm
                    ? `No se encontraron productos que coincidan con "${searchTerm}"`
                    : `El almacén "${selectedWarehouse.name}" no tiene productos asociados`}
                </p>
                {!searchTerm && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 max-w-md">
                    <p className="text-blue-800 text-sm mb-3">
                      Para agregar productos a este almacén, ve a la sección de productos y selecciona este almacén al crearlos.
                    </p>
                    <Link
                      href="/products/new"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Producto
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Product count indicator */}
            {filteredProducts.length > 0 && (
              <div className="mb-3 md:mb-4 text-xs md:text-sm text-gray-500">
                Mostrando <span className="font-medium text-gray-900">{filteredProducts.length}</span> productos
                {selectedWarehouse && (
                  <span> en <span className="font-medium text-gray-900">{selectedWarehouse.name}</span></span>
                )}
              </div>
            )}

            {viewMode === 'grid' && filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
                {filteredProducts.map(product => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="bg-white rounded-xl md:rounded-2xl p-2 md:p-4 hover:shadow-lg hover:scale-105 transition-all border border-gray-100 group"
                  >
                    <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg md:rounded-xl mb-2 md:mb-3 flex items-center justify-center">
                      <Package className="w-8 h-8 md:w-12 md:h-12 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    </div>
                    <h3 className="font-medium text-gray-900 text-xs md:text-sm mb-1 line-clamp-2 min-h-[1.5rem] md:min-h-[2.5rem]">
                      {product.name}
                    </h3>
                    <p className="text-[10px] md:text-xs text-gray-500 mb-1 md:mb-2 hidden sm:block">{product.sku}</p>

                    {/* ✅ REF Price Badge */}
                    {product.price_usd && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg px-2 py-1 mb-2">
                        <p className="text-[10px] text-blue-700 font-medium">💵 REF: ${product.price_usd.toFixed(2)}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-sm md:text-lg font-bold text-blue-600">
                        {formatCurrency(product.price)}
                      </span>
                      {product.stock_quantity !== undefined && (
                        <span className="text-[10px] md:text-xs text-gray-500">
                          {product.stock_quantity}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {filteredProducts.map(product => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-400 group-hover:text-blue-500 transition-colors" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-medium text-gray-900">{product.name}</h3>
                        <p className="text-sm text-gray-500">{product.sku}</p>
                        {/* ✅ REF Price Badge */}
                        {product.price_usd && (
                          <div className="mt-1 inline-flex items-center bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg px-2 py-0.5">
                            <span className="text-[10px] text-blue-700 font-medium">💵 REF: ${product.price_usd.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-lg font-bold text-blue-600">
                        {formatCurrency(product.price)}
                      </span>
                      {product.stock_quantity !== undefined && (
                        <span className="text-sm text-gray-500">
                          Stock: {product.stock_quantity}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cart Sidebar - Responsive */}
        {/* Mobile backdrop */}
        {showCart && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setShowCart(false)}
          />
        )}

        {/* Sidebar - Desktop (fixed) / Mobile (drawer) */}
        <div className={`
          fixed lg:relative inset-y-0 right-0 z-50
          w-full sm:w-96 lg:w-96
          bg-white border-l border-gray-200 flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${showCart ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}>
          {/* Mobile close button */}
          <div className="lg:hidden flex items-center justify-between p-3 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-900">Carrito</h2>
            <button
              onClick={() => setShowCart(false)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Customer & Warehouse - Compact */}
          <div className="flex-shrink-0 border-b border-gray-200 p-3 space-y-2">
            {/* Customer Selection */}
            <div>
              <button
                onClick={() => setShowCustomerSelector(!showCustomerSelector)}
                className={`w-full px-3 py-2 text-left rounded-lg border transition-colors flex items-center justify-between text-sm ${
                  errors.customer
                    ? 'border-red-300 bg-red-50'
                    : selectedCustomer
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <span className={selectedCustomer ? 'text-gray-900 font-medium text-xs' : 'text-gray-400 text-xs'}>
                  {selectedCustomer ? selectedCustomer.name : 'Cliente...'}
                </span>
                <User className="w-3.5 h-3.5 text-gray-400" />
              </button>

              {showCustomerSelector && (
                <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden bg-white shadow-lg">
                  <div className="p-2 border-b border-gray-200">
                    <input
                      type="text"
                      placeholder="Buscar..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="max-h-32 overflow-y-auto">
                    {filteredCustomers.map(customer => (
                      <button
                        key={customer.id}
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setShowCustomerSelector(false);
                          setCustomerSearch('');
                          setErrors(prev => ({ ...prev, customer: '' }));
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors text-sm"
                      >
                        <p className="font-medium text-gray-900 truncate">{customer.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Warehouse Selection */}
            <div>
              <button
                onClick={() => setShowWarehouseSelector(!showWarehouseSelector)}
                className={`w-full px-3 py-2 text-left rounded-lg border transition-colors flex items-center justify-between text-sm ${
                  errors.warehouse
                    ? 'border-red-300 bg-red-50'
                    : selectedWarehouse
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <span className={selectedWarehouse ? 'text-gray-900 font-medium text-xs' : 'text-gray-400 text-xs'}>
                  {selectedWarehouse ? selectedWarehouse.name : 'Almacén...'}
                </span>
                <Building2 className="w-3.5 h-3.5 text-gray-400" />
              </button>

              {showWarehouseSelector && (
                <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden bg-white shadow-lg">
                  <div className="max-h-32 overflow-y-auto">
                    {warehouses.map(warehouse => (
                      <button
                        key={warehouse.id}
                        onClick={() => {
                          setSelectedWarehouse(warehouse);
                          setShowWarehouseSelector(false);
                          setErrors(prev => ({ ...prev, warehouse: '' }));
                          setCart([]);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors text-sm"
                      >
                        <p className="font-medium text-gray-900 truncate">{warehouse.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <ShoppingCart className="w-16 h-16 text-gray-200 mb-3" />
                <h3 className="text-base font-semibold text-gray-800 mb-1">Carrito vacío</h3>
                <p className="text-gray-500 text-xs">Selecciona productos para comenzar</p>
              </div>
            ) : (
              <div className="p-3 space-y-3">
                {cart.map(item => (
                  <div
                    key={item.product.id}
                    className={`relative overflow-hidden rounded-xl shadow-sm border transition-all hover:shadow-md ${
                      item.is_exempt
                        ? 'border-emerald-300 bg-gradient-to-br from-emerald-50 to-white'
                        : 'border-indigo-200 bg-gradient-to-br from-indigo-50 to-white hover:border-indigo-300'
                    }`}
                  >
                    {/* Compact Header */}
                    <div className="flex items-start justify-between p-2 pb-1.5">
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <div className={`p-1 rounded ${
                            item.is_exempt
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-indigo-100 text-indigo-700'
                          }`}>
                            <Package className="w-3 h-3" />
                          </div>
                          <h4 className="font-bold text-gray-900 text-sm leading-tight line-clamp-1">
                            {item.product.name}
                          </h4>
                          {item.is_exempt && (
                            <span className="flex-shrink-0 px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded-full">
                              EXENTO
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="flex-shrink-0 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-all"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Compact Quantity & Price */}
                    <div className="flex items-center justify-between px-2 py-1.5 mb-1.5">
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-7 h-7 rounded-lg bg-white border-2 border-gray-200 flex items-center justify-center hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <div className="w-10 h-7 bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-gray-700 rounded-lg flex items-center justify-center">
                          <span className="text-sm font-bold text-white">{item.quantity}</span>
                        </div>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-7 h-7 rounded-lg bg-white border-2 border-gray-200 flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-600 transition-all"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className={`text-base font-black ${
                        item.is_exempt ? 'text-emerald-600' : 'text-indigo-600'
                      }`}>
                        {formatCurrency(item.product.price * item.quantity)}
                      </div>
                    </div>

                    {/* Compact Tax Config */}
                    <div className="flex items-center justify-between px-2 pb-2 gap-1">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold text-gray-500">IVA:</span>
                        <select
                          value={item.tax_percent}
                          onChange={(e) => {
                            const newTaxPercent = Number(e.target.value);
                            setCart(cart.map(i =>
                              i.product.id === item.product.id
                                ? { ...i, tax_percent: newTaxPercent }
                                : i
                            ));
                          }}
                          disabled={item.is_exempt}
                          className={`px-2 py-1 rounded-lg text-xs font-bold border ${
                            item.is_exempt
                              ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-white border-indigo-300 text-indigo-700 hover:border-indigo-400'
                          }`}
                        >
                          <option value={16}>16%</option>
                          <option value={8}>8%</option>
                          <option value={0}>0%</option>
                        </select>
                        <label className={`flex items-center gap-1 px-2 py-1 rounded-lg border cursor-pointer transition-all text-xs ${
                          item.is_exempt
                            ? 'bg-emerald-500 border-emerald-600 text-white'
                            : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
                        }`}>
                          <input
                            type="checkbox"
                            checked={item.is_exempt}
                            onChange={(e) => {
                              setCart(cart.map(i =>
                                i.product.id === item.product.id
                                  ? { ...i, is_exempt: e.target.checked }
                                  : i
                              ));
                            }}
                            className="w-3 h-3 rounded border-gray-300 text-emerald-600"
                          />
                          <span className="font-medium">Exento</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Footer */}
          <div className="border-t border-gray-200 bg-gray-50">
            {/* ✅ REF Totals Display */}
            {refTotals && (
              <div className="px-4 py-3 bg-gradient-to-br from-blue-50 to-indigo-50 border-b-2 border-blue-200">
                {/* USD Reference Total - Prominent */}
                <div className="bg-white rounded-xl p-3 mb-3 border-2 border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-blue-800 uppercase tracking-wide">💵 Total Referencia (USD)</p>
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

                {/* VES Payment Breakdown */}
                <div className="space-y-2">
                  {/* Tasa de cambio */}
                  {refTotals.exchange_rate && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-600">Tasa BCV ({refTotals.rate_date || 'hoy'}):</span>
                      <span className="font-mono font-semibold text-gray-800">
                        {refTotals.exchange_rate.toFixed(2)} Bs/USD
                      </span>
                    </div>
                  )}

                  {/* Subtotal VES */}
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-600">Subtotal VES:</span>
                    <span className="font-semibold text-gray-800">
                      Bs. {refTotals.subtotal_target.toLocaleString('es-VE', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </span>
                  </div>

                  {/* IVA */}
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-600">IVA (16%):</span>
                    <span className="font-semibold text-indigo-700">
                      + Bs. {refTotals.iva_amount.toLocaleString('es-VE', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </span>
                  </div>

                  {/* IGTF (si aplica) */}
                  {refTotals.igtf_amount > 0 && (
                    <div className="flex justify-between items-center text-xs bg-orange-50 px-2 py-1 rounded-lg">
                      <span className="text-orange-700 font-medium">IGTF (3%):</span>
                      <span className="font-bold text-orange-700">
                        + Bs. {refTotals.igtf_amount.toLocaleString('es-VE', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </span>
                    </div>
                  )}

                  {/* Total a pagar VES - MÁS PROMINENTE */}
                  <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-3 mt-2">
                    <div className="flex items-end justify-between text-white">
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-wide opacity-90">Total a Pagar</p>
                        <p className="text-xs opacity-75">{paymentMethod === 'efectivo' ? '✅ Sin IGTF' : '⚠️ Incluye IGTF 3%'}</p>
                      </div>
                      <p className="text-3xl font-black">
                        Bs. {refTotals.total_amount.toLocaleString('es-VE', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Items count */}
                  <div className="text-center text-xs text-gray-500 mt-2">
                    {cart.length} productos en el carrito
                  </div>
                </div>
              </div>
            )}

            {/* Legacy Totals (fallback when REF not available) */}
            {!refTotals && (
              <div className="px-4 py-3 bg-white border-b border-gray-200">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Total a pagar</p>
                    <p className="text-3xl font-bold text-gray-900">{formatCurrency(total)}</p>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    {taxableBase > 0 && <p>Base: {formatCurrency(taxableBase)}</p>}
                    {exemptAmount > 0 && <p className="text-green-600">Exento: {formatCurrency(exemptAmount)}</p>}
                    <p>IVA: {formatCurrency(tax)}</p>
                    <p className="font-medium text-gray-900">{cart.length} items</p>
                  </div>
                </div>
              </div>
            )}

            {/* Loading indicator for REF */}
            {loadingRef && (
              <div className="px-4 py-2 bg-blue-50 border-b border-blue-200 flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600 mr-2" />
                <span className="text-xs text-blue-700">Calculando precios REF...</span>
              </div>
            )}

            {/* Botón de cobrar prominente */}
            <div className="p-4">
              <button
                onClick={handleCheckout}
                disabled={loading || cart.length === 0 || !selectedCustomer}
                className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white text-lg rounded-xl hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-[1.01] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mb-3"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <DollarSign className="w-6 h-6 mr-2" />
                    <span className="font-bold">COBRAR</span>
                  </>
                )}
              </button>

              {/* Expandable Venezuela fields */}
              {cart.length > 0 && (
                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer px-3 py-2 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm">
                    <span className="text-gray-700 font-medium">⚙️ Datos de facturación</span>
                    <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200 space-y-2">
                    {/* Fila 1: Tipo y Forma de pago */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
                        <select
                          value={transactionType}
                          onChange={(e) => setTransactionType(e.target.value as 'contado' | 'credito')}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="contado">Contado</option>
                          <option value="credito">Crédito</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Forma de pago</label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="efectivo">Efectivo</option>
                          <option value="transferencia">Transferencia</option>
                          <option value="zelle">Zelle</option>
                          <option value="pago_movil">Pago Móvil</option>
                          <option value="tarjeta_credito">T. Crédito</option>
                          <option value="tarjeta_debito">T. Débito</option>
                        </select>
                      </div>
                    </div>

                    {/* Días de crédito - solo si es crédito */}
                    {transactionType === 'credito' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Días de crédito</label>
                        <input
                          type="number"
                          value={creditDays}
                          onChange={(e) => setCreditDays(Number(e.target.value))}
                          placeholder="0"
                          min="0"
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}

                    {/* Teléfono y dirección */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono</label>
                        <input
                          type="text"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="Opcional"
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Dirección</label>
                        <input
                          type="text"
                          value={customerAddress}
                          onChange={(e) => setCustomerAddress(e.target.value)}
                          placeholder="Opcional"
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </details>
              )}

              {/* Botón vaciar carrito */}
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="w-full mt-3 flex items-center justify-center px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Vaciar carrito
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POSPage;
