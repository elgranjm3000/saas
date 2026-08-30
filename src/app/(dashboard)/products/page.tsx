'use client'
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  List,
  ArrowUpDown,
  Download,
  Upload,
  DollarSign
} from 'lucide-react';
import { productsAPI, categoriesAPI, currenciesAPI } from '@/lib/api';
import { formatCurrency, convertCurrency, formatCurrencyWithSymbol } from '@/lib/utils';
import { ListItemSkeleton } from '@/components/Skeleton';
import { useCurrencyStore } from '@/store/currency-store';

interface Product {
  id: number;
  name: string;
  sku: string;
  short_name?: string;  // ✅ SISTEMA ESCRITORIO: Nombre corto
  description: string;
  company_id: number;

  // ✅ SISTEMA ESCRITORIO: Clasificación
  mark?: string;  // Marca
  model?: string;  // Modelo
  size?: string;  // Talla
  color?: string;  // Color
  product_type?: string;  // T=Terminado, S=Servicio, C=Compuesto

  category?: {
    id: number;
    name: string;
  };
  department?: {  // ✅ SISTEMA ESCRITORIO
    id: number;
    name: string;
  };

  // ✅ SISTEMA ESCRITORIO: Impuestos
  sale_tax_code?: string;  // 01=16%, 02=8%, 03=31%, 06=Percibido, EX=Exento

  // Precios
  price: number;  // Precio local (VES)
  price_usd?: number;  // ✅ SISTEMA REF: Precio de referencia en USD
  cost?: number;  // ✅ SISTEMA REF: Costo del producto

  // ✅ SISTEMA ESCRITORIO: Precios múltiples (4 niveles)
  maximum_price?: number;  // Precio máximo
  offer_price?: number;  // Precio oferta
  higher_price?: number;  // Precio mayor
  minimum_price?: number;  // Precio mínimo
  sale_price_type?: number;  // 0=Max, 1=Oferta, 2=Mayor, 3=Min, 4=Variable

  // Stock
  quantity: number;  // Stock actual
  stock_quantity?: number;  // ✅ Alternativo
  min_stock?: number;  // Stock mínimo
  maximum_stock?: number;  // ✅ Stock máximo

  // ✅ SISTEMA ESCRITORIO: Configuración de stock
  allow_negative_stock?: boolean;  // Permitir vender sin stock
  serialized?: boolean;  // Usa serial
  use_lots?: boolean;  // Usa lotes

  // ✅ SISTEMA ESCRITORIO: Estado
  status?: string;  // 01=Activo, 02=Inactivo
  is_active?: boolean;

  currency?: {  // ✅ MONEDA
    id: number;
    code: string;
    name: string;
    symbol: string;
    exchange_rate: number;
    is_base_currency: boolean;
  };

  // ✅ SISTEMA ESCRITORIO: Moneda principal del producto
  coin?: string;  // 01=Bolívar, 02=Dólar
}

const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [displayCurrencyId, setDisplayCurrencyId] = useState<number | null>(null);  // ✅ MONEDA
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'quantity'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // ✅ MONEDA: Usar el store de monedas
  const { currencies, fetchCurrencies } = useCurrencyStore();

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchCurrencies({ is_active: true }).then(() => {
      // ✅ MONEDA: Establecer moneda base por defecto si no hay ninguna seleccionada
      if (!displayCurrencyId && currencies && currencies.length > 0) {
        const baseCurrency = currencies.find((c: any) => c.is_base_currency);
        if (baseCurrency) {
          setDisplayCurrencyId(baseCurrency.id);
        } else {
          setDisplayCurrencyId(currencies[0].id);
        }
      }
    });  // ✅ MONEDA: Cargar monedas activas
  }, []);

  useEffect(() => {
    if (selectedCategory !== null) {
      fetchProductsByCategory(selectedCategory);
    } else {
      fetchProducts();
    }
  }, [selectedCategory]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getAll();
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductsByCategory = async (categoryId: number) => {
    try {
      setLoading(true);
      const response = await productsAPI.getByCategory(categoryId);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products by category:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // ✅ MONEDA: Obtener monedas disponibles
  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      try {
        await productsAPI.delete(id);
        setProducts(products.filter(p => p.id !== id));
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const getStockStatus = (product: Product) => {
    const minStock = product.min_stock || 10;
    const quantity = product.stock_quantity || product.quantity;

    if (quantity === 0 && !product.allow_negative_stock) return { status: 'out', color: 'text-red-600', bg: 'bg-red-100', label: 'Agotado' };
    if (quantity <= minStock) return { status: 'low', color: 'text-orange-600', bg: 'bg-orange-100', label: 'Stock Bajo' };
    return { status: 'good', color: 'text-green-600', bg: 'bg-green-100', label: 'En Stock' };
  };

  // ✅ SISTEMA ESCRITORIO: Obtener etiqueta de código de impuesto
  const getTaxCodeLabel = (code?: string) => {
    const taxCodes: Record<string, string> = {
      '01': '16% General',
      '02': '8% Reducido',
      '03': '31% Aumentado',
      '06': 'Percibido',
      'EX': 'Exento',
    };
    return taxCodes[code || '01'] || code || '01';
  };

  // ✅ SISTEMA ESCRITORIO: Obtener etiqueta de tipo de producto
  const getProductTypeLabel = (type?: string) => {
    const types: Record<string, string> = {
      'T': 'Terminado',
      'S': 'Servicio',
      'C': 'Compuesto',
    };
    return types[type || 'T'] || 'Terminado';
  };

  // ✅ SISTEMA ESCRITORIO: Obtener etiqueta de tipo de precio
  const getPriceTypeLabel = (type?: number) => {
    const types: Record<number, string> = {
      0: 'Máximo',
      1: 'Oferta',
      2: 'Mayor',
      3: 'Mínimo',
      4: 'Variable',
    };
    return types[type || 0] || 'Máximo';
  };

  // ✅ SISTEMA ESCRITORIO: Obtener estado del producto
  const getProductStatus = (product: Product) => {
    if (product.status === '02' || product.is_active === false) {
      return { color: 'text-red-600', bg: 'bg-red-100', label: 'Inactivo' };
    }
    return { color: 'text-green-600', bg: 'bg-green-100', label: 'Activo' };
  };

  // ✅ MONEDA: Obtener moneda del producto (basado en currency_id, coin o moneda base)
  const getProductCurrency = (product: Product) => {
    // Si tiene objeto currency, usarlo
    if (product.currency) {
      return product.currency;
    }

    // Obtener moneda base actual del sistema desde el store
    const baseCurrency = currencies.find((c: any) => c.is_base_currency);

    // Si no tiene currency_id, usar la moneda base del sistema
    if (baseCurrency) {
      return {
        code: baseCurrency.code,
        name: baseCurrency.name,
        symbol: baseCurrency.symbol,
        exchange_rate: baseCurrency.exchange_rate,
      };
    }

    // Fallback: derivar del campo coin si no hay moneda base configurada
    const coinCode = product.coin || '01';
    if (coinCode === '01') {
      return {
        code: 'VES',
        name: 'Bolívar',
        symbol: 'Bs.',
        exchange_rate: 1.0,
      };
    } else if (coinCode === '02') {
      return {
        code: 'USD',
        name: 'Dólar',
        symbol: '$',
        exchange_rate: 344.5,
      };
    }

    // Default a VES
    return {
      code: 'VES',
      name: 'Bolívar',
      symbol: 'Bs.',
      exchange_rate: 1.0,
    };
  };

  // ✅ MONEDA: Obtener precio del producto convertido a moneda base
  const getProductPrice = (product: Product, baseCurrency: any) => {
    // El precio de referencia (price_usd) está en USD y es el precio base para conversiones
    const priceRef = product.price_usd || 0;

    // Si no hay precio de referencia, usar el precio local según coin
    if (priceRef === 0) {
      const priceInCoin = product.price || 0;
      return {
        amount: priceInCoin,
        ref: 0
      };
    }

    // Si no hay moneda base configurada, mostrar el precio local
    if (!baseCurrency || !baseCurrency.code) {
      return {
        amount: product.price || priceRef,
        ref: priceRef
      };
    }

    // Convertir el precio de referencia (en USD) a la moneda base
    let convertedPrice = 0;
    const baseRate = parseFloat(baseCurrency.exchange_rate) || 1;

    if (baseCurrency.code === 'VES') {
      // USD → VES: multiplicar por tasa de USD (344.50)
      convertedPrice = priceRef * 344.50;
    } else if (baseCurrency.code === 'USD') {
      // USD → USD: precio de referencia directo
      convertedPrice = priceRef;
    } else {
      // USD → Otra moneda (EUR, CAD): Convertir usando tasas
      // priceRef está en USD, convertir a moneda base
      // Ejemplo: 80 USD → EUR
      // 80 USD × (tasa_moneda_base / tasa_USD)
      convertedPrice = priceRef * (baseRate / 344.50);
    }

    return {
      amount: convertedPrice,
      ref: priceRef
    };
  };

  // ✅ SISTEMA REF: Calcular margen del producto
  const getMargin = (product: Product): { percentage: number; color: string } => {
    if (!product.price_usd || !product.cost || product.cost === 0) {
      return { percentage: 0, color: 'text-gray-400' };
    }
    const margin = ((product.price_usd - product.cost) / product.cost) * 100;
    let color = 'text-green-600';
    if (margin < 20) color = 'text-orange-600';
    if (margin < 10) color = 'text-red-600';
    return { percentage: margin, color };
  };

  // ✅ MONEDA: Obtener precio convertido a la moneda de visualización
  const getPriceInDisplayCurrency = (product: Product): { amount: number; formatted: string; originalCurrency?: string } => {
    if (!product.currency || !displayCurrencyId) {
      return {
        amount: product.price,
        formatted: formatCurrency(product.price)
      };
    }

    const displayCurrency = currencies.find((c: any) => c.id === displayCurrencyId);
    if (!displayCurrency) {
      return {
        amount: product.price,
        formatted: formatCurrency(product.price)
      };
    }

    // Si es la misma moneda, retornar el precio original
    if (product.currency.id === displayCurrencyId) {
      return {
        amount: product.price,
        formatted: formatCurrencyWithSymbol(product.price, displayCurrency),
        originalCurrency: product.currency.code
      };
    }

    // Convertir a la moneda de visualización
    const convertedAmount = convertCurrency(product.price, product.currency, displayCurrency);
    return {
      amount: convertedAmount,
      formatted: formatCurrencyWithSymbol(convertedAmount, displayCurrency),
      originalCurrency: product.currency.code
    };
  };

  const filteredProducts = products
    .filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      const modifier = sortOrder === 'asc' ? 1 : -1;
      return aValue > bValue ? modifier : -modifier;
    });

  const stats = {
    total: products.length,
    totalValue: products.reduce((sum, p) => sum + (p.price * p.quantity), 0),
    lowStock: products.filter(p => p.quantity <= 10).length,
    outOfStock: products.filter(p => p.quantity === 0).length
  };

  const ProductCard = ({ product }: { product: Product }) => {
    const stockStatus = getStockStatus(product);
    const margin = getMargin(product);
    const productStatus = getProductStatus(product);
    const quantity = product.stock_quantity || product.quantity;

    return (
      <div className="erp-card group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <div className="flex items-start justify-between mb-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'var(--color-primary)' }}>
            <Package className="w-8 h-8 text-white" />
          </div>
          <div className="flex items-center space-x-2">
            <Link
              href={`/products/${product.id}`}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
            >
              <Eye className="w-4 h-4" />
            </Link>
            <Link
              href={`/products/${product.id}/edit`}
              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-colors"
            >
              <Edit className="w-4 h-4" />
            </Link>
            <button
              onClick={() => handleDelete(product.id)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900 mb-2 line-clamp-2">
            {product.short_name || product.name}
          </h3>
          <p className="text-sm text-gray-500 font-mono">{product.sku}</p>

          {/* ✅ SISTEMA ESCRITORIO: Badges de clasificación */}
          <div className="flex flex-wrap gap-2 mt-2">
            {product.product_type && (
              <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                {getProductTypeLabel(product.product_type)}
              </span>
            )}
            {product.mark && (
              <span className="inline-block px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                {product.mark}
              </span>
            )}
            {product.model && (
              <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                {product.model}
              </span>
            )}
            {product.category && (
              <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {product.category.name}
              </span>
            )}
            {product.department && (
              <span className="inline-block px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                {product.department.name}
              </span>
            )}
          </div>

          {/* ✅ SISTEMA ESCRITORIO: Badges de configuración de stock */}
          <div className="flex flex-wrap gap-2 mt-2">
            {product.serialized && (
              <span className="inline-flex items-center px-2 py-1 bg-teal-50 text-teal-700 text-xs rounded-full border border-teal-200">
                <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mr-1"></span>
                Serial
              </span>
            )}
            {product.use_lots && (
              <span className="inline-flex items-center px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded-full border border-orange-200">
                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1"></span>
                Lotes
              </span>
            )}
            {product.allow_negative_stock && (
              <span className="inline-flex items-center px-2 py-1 bg-red-50 text-red-700 text-xs rounded-full border border-red-200">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1"></span>
                Stock Negativo
              </span>
            )}
          </div>
        </div>

        {/* ✅ SISTEMA ESCRITORIO: Precio local (precio principal) */}
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-1">Precio</p>
          <p className="text-2xl font-light text-gray-900">
            {product.price ? formatCurrency(product.price) : 'N/A'}
          </p>
          {product.price_usd && (
            <p className="text-xs text-blue-500 mt-1">
              USD: ${product.price_usd.toFixed(2)}
            </p>
          )}
          {/* ✅ SISTEMA ESCRITORIO: Mostrar tipo de precio */}
          {product.sale_price_type !== undefined && (
            <p className="text-xs text-gray-500 mt-1">
              Tipo: {getPriceTypeLabel(product.sale_price_type)}
            </p>
          )}
        </div>

        {/* ✅ SISTEMA ESCRITORIO: Mostrar margen (usando precio local) */}
        {product.price && product.cost && (
          <div className="mb-4 p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Margen</p>
                <p className={`text-lg font-semibold ${margin.color}`}>
                  {margin.percentage.toFixed(1)}%
                </p>
              </div>
              <div className="text-right text-xs text-gray-500">
                <p>Costo: {formatCurrency(product.cost)}</p>
                <p>Precio: {formatCurrency(product.price)}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div className="text-right">
            <p className="text-sm text-gray-500">Stock</p>
            <div className="flex items-center">
              <span className="font-medium text-gray-900 mr-2">
                {quantity}
              </span>
              {(quantity <= 10 && !product.allow_negative_stock) && (
                <AlertTriangle className="w-4 h-4 text-orange-500" />
              )}
            </div>
          </div>
        </div>

        {/* ✅ SISTEMA ESCRITORIO: Estado del producto */}
        <div className="flex items-center justify-between">
          <span className={`px-3 py-1 text-sm rounded-full ${stockStatus.bg} ${stockStatus.color}`}>
            {stockStatus.label}
          </span>
          <span className={`px-3 py-1 text-xs rounded-full ${productStatus.bg} ${productStatus.color}`}>
            {productStatus.label}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-light text-gray-900 mb-3">Productos</h1>
            <p className="text-gray-500 font-light text-lg">
              Gestiona tu inventario y catálogo de productos
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="flex items-center px-4 py-3 text-gray-600 bg-white/80 border border-gray-200/60 rounded-2xl hover:bg-white hover:border-gray-300 transition-all">
              <Upload className="w-4 h-4 mr-2" />
              <span className="font-light">Importar</span>
            </button>
            <button className="flex items-center px-4 py-3 text-gray-600 bg-white/80 border border-gray-200/60 rounded-2xl hover:bg-white hover:border-gray-300 transition-all">
              <Download className="w-4 h-4 mr-2" />
              <span className="font-light">Exportar</span>
            </button>
            {/* ✅ MONEDA: Selector de moneda */}
            {currencies.length > 0 && (
              <select
                value={displayCurrencyId || ''}
                onChange={(e) => setDisplayCurrencyId(Number(e.target.value))}
                className="flex items-center px-4 py-3 text-gray-600 bg-white/80 border border-gray-200/60 rounded-2xl hover:bg-white hover:border-gray-300 transition-all"
              >
                {currencies.map((currency: any) => (
                  <option key={currency.id} value={currency.id}>
                    {currency.symbol} {currency.code}
                  </option>
                ))}
              </select>
            )}
            <Link
              href="/products/new"
              className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-[1.02] shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="font-light">Nuevo Producto</span>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Total Productos
                </p>
                <p className="text-2xl font-light text-gray-900">{stats.total}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Package className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Valor del Inventario
                </p>
                <p className="text-2xl font-light text-gray-900">{formatCurrency(stats.totalValue)}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Stock Bajo
                </p>
                <p className="text-2xl font-light text-orange-600">{stats.lowStock}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                <AlertTriangle className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Agotados
                </p>
                <p className="text-2xl font-light text-red-600">{stats.outOfStock}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                <TrendingDown className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 p-6 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 min-w-80">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar productos por nombre o SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
              className="px-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
            >
              <option value="">Todos los Departamentos</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'price' | 'quantity')}
              className="px-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
            >
              <option value="name">Ordenar por Nombre</option>
              <option value="price">Ordenar por Precio</option>
              <option value="quantity">Ordenar por Stock</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-2xl transition-colors"
            >
              <ArrowUpDown className="w-5 h-5" />
            </button>

            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center px-4 py-3 text-gray-600 bg-gray-50/80 border border-gray-200/60 rounded-2xl hover:bg-white hover:border-gray-300 transition-all"
            >
              <Filter className="w-4 h-4 mr-2" />
              <span className="font-light">Filtros</span>
            </button>
            
            <div className="flex items-center space-x-1 bg-gray-50/80 rounded-2xl p-1 border border-gray-200/60">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-xl transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-xl transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {/*<Grid3X3 className="w-4 h-4" />*/}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Products Content */}
      {loading ? (
        <ListItemSkeleton count={8} />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">
                    <input type="checkbox" className="rounded border-gray-300" />
                  </th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Producto</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">SKU</th>
                  {/* ✅ SISTEMA ESCRITORIO: Nueva columna Marca/Modelo */}
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Marca/Modelo</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Departamento</th>
                  {/* ✅ SISTEMA ESCRITORIO: Nueva columna Tipo */}
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Tipo</th>
                  {/* ✅ SISTEMA ESCRITORIO: Nueva columna Impuesto */}
                  <th className="text-left py-4 px-6 font-medium text-gray-700">IVA</th>
                  {/* ✅ SISTEMA ESCRITORIO: Precio (moneda local) */}
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Precio</th>
                  {/* ✅ SISTEMA ESCRITORIO: Margen de ganancia */}
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Margen</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Stock</th>
                  {/* ✅ SISTEMA ESCRITORIO: Nueva columna Estado */}
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Estado</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product);
                  const margin = getMargin(product);
                  const productStatus = getProductStatus(product);
                  const productCurrency = getProductCurrency(product);
                  const baseCurrency = currencies.find((c: any) => c.is_base_currency);
                  const productPrice = getProductPrice(product, baseCurrency);
                  const quantity = product.stock_quantity || product.quantity;
                  return (
                    <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <input type="checkbox" className="rounded border-gray-300" />
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mr-4">
                            <Package className="w-6 h-6 text-gray-500" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{product.short_name || product.name}</p>
                            <p className="text-sm text-gray-500">ID: {product.id}</p>
                            {/* ✅ SISTEMA ESCRITORIO: Badges de configuración */}
                            <div className="flex flex-wrap gap-1 mt-1">
                              {product.serialized && (
                                <span className="inline-flex items-center px-1.5 py-0.5 bg-teal-50 text-teal-700 text-xs rounded border border-teal-200">S</span>
                              )}
                              {product.use_lots && (
                                <span className="inline-flex items-center px-1.5 py-0.5 bg-orange-50 text-orange-700 text-xs rounded border border-orange-200">L</span>
                              )}
                              {product.allow_negative_stock && (
                                <span className="inline-flex items-center px-1.5 py-0.5 bg-red-50 text-red-700 text-xs rounded border border-red-200">-</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-900 font-mono text-sm">
                        {product.sku}
                      </td>
                      {/* ✅ SISTEMA ESCRITORIO: Columna Marca/Modelo */}
                      <td className="py-4 px-6">
                        <div>
                          {product.mark && <p className="text-sm font-medium text-gray-900">{product.mark}</p>}
                          {product.model && <p className="text-xs text-gray-500">{product.model}</p>}
                          {!product.mark && !product.model && <span className="text-gray-400 text-sm">-</span>}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {product.category ? (
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                            {product.category.name}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">Sin categoría</span>
                        )}
                      </td>
                      {/* ✅ SISTEMA ESCRITORIO: Columna Tipo */}
                      <td className="py-4 px-6">
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                          {getProductTypeLabel(product.product_type)}
                        </span>
                      </td>
                      {/* ✅ SISTEMA ESCRITORIO: Columna IVA */}
                      <td className="py-4 px-6">
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                          {getTaxCodeLabel(product.sale_tax_code)}
                        </span>
                      </td>
                      {/* ✅ SISTEMA ESCRITORIO: Precio convertido a moneda base */}
                      <td className="py-4 px-6 font-medium text-gray-900">
                        <div>
                          <span className="text-lg">
                            {productPrice.amount > 0 ? formatCurrencyWithSymbol(productPrice.amount, productCurrency) : 'N/A'}
                          </span>
                          {productPrice.ref > 0 && (
                            <span className="text-xs text-blue-500 ml-2 block">
                              Ref: {formatCurrency(productPrice.ref)}
                            </span>
                          )}
                          {!productPrice.ref && productPrice.amount > 0 && (
                            <span className="text-xs text-gray-400 ml-2 block">
                              {productCurrency.name}
                            </span>
                          )}
                        </div>
                      </td>
                      {/* ✅ SISTEMA ESCRITORIO: Margen de ganancia */}
                      <td className="py-4 px-6">
                        {product.price && product.cost ? (
                          <div>
                            <span className={`font-semibold ${margin.color}`}>
                              {margin.percentage.toFixed(1)}%
                            </span>
                            <div className="text-xs text-gray-400">
                              {formatCurrencyWithSymbol(product.cost, productCurrency)} → {formatCurrencyWithSymbol(product.price, productCurrency)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <span className="font-medium text-gray-900 mr-2">
                            {quantity}
                          </span>
                          {(quantity <= 10 && !product.allow_negative_stock) && (
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                          )}
                        </div>
                      </td>
                      {/* ✅ SISTEMA ESCRITORIO: Columna Estado */}
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 text-sm rounded-full ${productStatus.bg} ${productStatus.color}`}>
                          {productStatus.label}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <Link
                            href={`/products/${product.id}`}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/products/${product.id}/edit`}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="bg-gray-50/80 px-6 py-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 font-light">
                Mostrando <span className="font-medium">1</span> a <span className="font-medium">{filteredProducts.length}</span> de{' '}
                <span className="font-medium">{filteredProducts.length}</span> productos
              </p>
              <div className="flex items-center space-x-2">
                <button className="px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-light">
                  Anterior
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-xl font-light">
                  1
                </button>
                <button className="px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-light">
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {filteredProducts.length === 0 && !loading && (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-light text-gray-900 mb-2">No hay productos</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm ? 'No se encontraron productos con ese término de búsqueda.' : 'Comienza agregando tu primer producto.'}
          </p>
          <Link
            href="/products/new"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-[1.02] shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="font-light">Agregar Producto</span>
          </Link>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;