'use client'
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Package,
  AlertCircle,
  CheckCircle,
  Loader2,
  Hash,
  Tag,
  FileText,
  Warehouse,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Settings,
  BarChart3,
  Truck,
  Percent,
  Calculator,
  Layers
} from 'lucide-react';
import { productsAPI, warehouseProductsAPI, departmentsAPI } from '@/lib/api';
import { generateSKU } from '@/lib/utils';
import { extractErrorMessage } from '@/lib/errorHandler';
import { Product, ProductCreate } from '@/types/product';

// ✅ SISTEMA ESCRITORIO: Formulario de producto con 31 campos adicionales

const ProductFormPage = () => {
  const router = useRouter();
  const params = useParams();
  const isEdit = params?.id && params.id !== 'new';
  const productId = isEdit ? Number(params.id) : null;

  // ✅ SISTEMA ESCRITORIO: Estado del formulario con todos los campos
  const [formData, setFormData] = useState<ProductCreate>({
    // Campos básicos
    name: '',
    short_name: '',
    description: '',
    sku: '',
    category_id: '',
    warehouse_id: '',

    // ✅ SISTEMA ESCRITORIO: Clasificación
    mark: '',
    model: '',
    department_id: '',
    size: '',
    color: '',
    product_type: 'T',

    // ✅ SISTEMA ESCRITORIO: Impuestos
    sale_tax_code: '01',
    buy_tax_code: '01',

    // Precios
    price: '',
    price_usd: '',
    cost: '',
    maximum_price: '',
    offer_price: '',
    higher_price: '',
    minimum_price: '',
    sale_price_type: 1,

    // Stock
    quantity: '',
    stock_quantity: '',
    min_stock: '10',
    maximum_stock: '0',
    allow_negative_stock: false,
    serialized: false,
    use_lots: false,
    lots_order: 0,

    // ✅ SISTEMA ESCRITORIO: Costeo
    costing_type: 0,
    calculated_cost: '',
    average_cost: '',

    // ✅ SISTEMA ESCRITORIO: Descuentos
    discount: 0,
    max_discount: 0,
    minimal_sale: 0,
    maximal_sale: 0,

    // ✅ SISTEMA ESCRITORIO: Configuración
    allow_decimal: true,
    rounding_type: 2,
    edit_name: false,
    take_department_utility: true,
    coin: '01',
    days_warranty: 0,
    status: '01',
  });

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  // ✅ SISTEMA ESCRITORIO: Datos para selects
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);  // ✅ NUEVO

  // ✅ SISTEMA ESCRITORIO: Secciones colapsables
  const [openSections, setOpenSections] = useState({
    basic: true,
    classification: true,
    pricing: true,
    inventory: true,
    costing: false,
    discounts: false,
    advanced: false,
  });

  useEffect(() => {
    fetchWarehouses();
    fetchCategories();
    fetchDepartments();  // ✅ NUEVO

    if (isEdit && productId) {
      fetchProduct();
    } else {
      setFormData(prev => ({
        ...prev,
        sku: generateSKU('PROD')
      }));
    }
  }, [isEdit, productId]);

  const fetchWarehouses = async () => {
    try {
      const response = await fetch('/api/v1/warehouses', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setWarehouses(data);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/v1/categories', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // ✅ SISTEMA ESCRITORIO: Fetch departamentos
  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/v1/departments', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setDepartments(data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchProduct = async () => {
    if (!productId) return;

    try {
      setInitialLoading(true);
      const response = await fetch(`/api/v1/products/${productId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const product: Product = await response.json();

      setFormData({
        name: product.name || '',
        short_name: product.short_name || '',
        description: product.description || '',
        sku: product.sku || '',
        price: product.price?.toString() || '',
        price_usd: product.price_usd?.toString() || '',
        cost: product.cost?.toString() || '',
        stock_quantity: product.stock_quantity?.toString() || '',
        min_stock: product.min_stock?.toString() || '10',
        category_id: product.category?.id?.toString() || '',
        warehouse_id: product.warehouse?.id?.toString() || '',

        // ✅ SISTEMA ESCRITORIO
        mark: product.mark || '',
        model: product.model || '',
        department_id: product.department_id?.toString() || '',
        size: product.size || '',
        color: product.color || '',
        product_type: product.product_type || 'T',

        sale_tax_code: product.sale_tax_code || '01',
        buy_tax_code: product.buy_tax_code || '01',

        maximum_price: product.maximum_price?.toString() || '',
        offer_price: product.offer_price?.toString() || '',
        higher_price: product.higher_price?.toString() || '',
        minimum_price: product.minimum_price?.toString() || '',
        sale_price_type: product.sale_price_type || 1,

        maximum_stock: product.maximum_stock?.toString() || '0',
        allow_negative_stock: product.allow_negative_stock || false,
        serialized: product.serialized || false,
        use_lots: product.use_lots || false,
        lots_order: product.lots_order || 0,

        costing_type: product.costing_type || 0,
        calculated_cost: product.calculated_cost?.toString() || '',
        average_cost: product.average_cost?.toString() || '',

        discount: product.discount || 0,
        max_discount: product.max_discount || 0,
        minimal_sale: product.minimal_sale || 0,
        maximal_sale: product.maximal_sale || 0,

        allow_decimal: product.allow_decimal ?? true,
        rounding_type: product.rounding_type ?? 2,
        edit_name: product.edit_name || false,
        take_department_utility: product.take_department_utility ?? true,
        coin: product.coin || '01',
        days_warranty: product.days_warranty || 0,
        status: product.status || '01',
      });
    } catch (error) {
      console.error('Error fetching product:', error);
      setErrors({ general: 'Error al cargar el producto' });
    } finally {
      setInitialLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del producto es requerido';
    }

    if (!formData.sku.trim()) {
      newErrors.sku = 'El SKU es requerido';
    }

    if (!formData.price && !formData.price_usd) {
      newErrors.price = 'Al menos un precio es requerido';
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

      const payload = {
        name: formData.name,
        short_name: formData.short_name || undefined,
        description: formData.description || undefined,
        sku: formData.sku,
        price: formData.price ? parseFloat(formData.price) : undefined,
        price_usd: formData.price_usd ? parseFloat(formData.price_usd) : undefined,
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
        stock_quantity: formData.stock_quantity ? parseInt(formData.stock_quantity) : 0,
        min_stock: formData.min_stock ? parseInt(formData.min_stock) : 10,
        category_id: formData.category_id ? parseInt(formData.category_id) : undefined,
        warehouse_id: formData.warehouse_id ? parseInt(formData.warehouse_id) : undefined,

        // ✅ SISTEMA ESCRITORIO: Clasificación
        mark: formData.mark || undefined,
        model: formData.model || undefined,
        department_id: formData.department_id ? parseInt(formData.department_id) : undefined,
        size: formData.size || undefined,
        color: formData.color || undefined,
        product_type: formData.product_type,

        // ✅ SISTEMA ESCRITORIO: Impuestos
        sale_tax_code: formData.sale_tax_code,
        buy_tax_code: formData.buy_tax_code,

        // ✅ SISTEMA ESCRITORIO: Precios múltiples
        maximum_price: formData.maximum_price ? parseFloat(formData.maximum_price) : undefined,
        offer_price: formData.offer_price ? parseFloat(formData.offer_price) : undefined,
        higher_price: formData.higher_price ? parseFloat(formData.higher_price) : undefined,
        minimum_price: formData.minimum_price ? parseFloat(formData.minimum_price) : undefined,
        sale_price_type: formData.sale_price_type,

        // ✅ SISTEMA ESCRITORIO: Stock avanzado
        maximum_stock: formData.maximum_stock ? parseInt(formData.maximum_stock) : 0,
        allow_negative_stock: formData.allow_negative_stock,
        serialized: formData.serialized,
        use_lots: formData.use_lots,
        lots_order: formData.lots_order,

        // ✅ SISTEMA ESCRITORIO: Costeo
        costing_type: formData.costing_type,
        calculated_cost: formData.calculated_cost ? parseFloat(formData.calculated_cost) : undefined,
        average_cost: formData.average_cost ? parseFloat(formData.average_cost) : undefined,

        // ✅ SISTEMA ESCRITORIO: Descuentos
        discount: formData.discount,
        max_discount: formData.max_discount,
        minimal_sale: formData.minimal_sale,
        maximal_sale: formData.maximal_sale,

        // ✅ SISTEMA ESCRITORIO: Configuración
        allow_decimal: formData.allow_decimal,
        rounding_type: formData.rounding_type,
        edit_name: formData.edit_name,
        take_department_utility: formData.take_department_utility,
        coin: formData.coin,
        days_warranty: formData.days_warranty,
        status: formData.status,
      };

      const url = isEdit && productId
        ? `/api/v1/products/${productId}`
        : '/api/v1/products';

      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Error al guardar el producto');
      }

      const createdProduct = await response.json();

      // Crear entrada en almacén si se especificó
      if (formData.warehouse_id && formData.stock_quantity) {
        await fetch('/api/v1/warehouse-products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            warehouse_id: parseInt(formData.warehouse_id),
            product_id: createdProduct.id,
            stock: parseInt(formData.stock_quantity)
          })
        });
      }

      setSuccess(true);

      setTimeout(() => {
        if (isEdit) {
          router.push(`/products/${productId}`);
        } else {
          router.push('/products');
        }
      }, 1500);

    } catch (error: any) {
      console.error('Error saving product:', error);
      setErrors({ general: extractErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
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
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link
              href={isEdit ? `/products/${productId}` : '/products'}
              className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-2xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-light text-gray-900 mb-2">
                {isEdit ? 'Editar Producto' : 'Nuevo Producto'}
              </h1>
              <p className="text-gray-500 font-light">
                {isEdit ? 'Modifica la información del producto' : 'Completa la información del sistema de escritorio'}
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
              {isEdit ? 'Producto actualizado correctamente' : 'Producto creado correctamente'}
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

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ✅ SECCIÓN 1: INFORMACIÓN BÁSICA */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('basic')}
            className="w-full p-6 border-b border-gray-100 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Package className="w-5 h-5 text-gray-700" />
              <h3 className="text-xl font-light text-gray-900">
                Información Básica
              </h3>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                Requerido
              </span>
            </div>
            {openSections.basic ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {openSections.basic && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nombre */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 bg-gray-50/80 border rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none ${
                      errors.name ? 'border-red-300' : 'border-gray-200'
                    }`}
                    placeholder="Ej: Laptop Dell Inspiron 15"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                {/* ✅ Nombre Corto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre Corto
                  </label>
                  <input
                    type="text"
                    name="short_name"
                    value={formData.short_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                    placeholder="Ej: Laptop Dell"
                  />
                </div>

                {/* SKU */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SKU *
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      name="sku"
                      value={formData.sku}
                      onChange={handleInputChange}
                      className={`flex-1 px-4 py-3 bg-gray-50/80 border rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none font-mono ${
                        errors.sku ? 'border-red-300' : 'border-gray-200'
                      }`}
                      placeholder="PROD-123456-001"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, sku: generateSKU('PROD') }))}
                      className="px-4 py-3 text-gray-600 bg-gray-50/80 border border-gray-200 rounded-xl hover:bg-white transition-colors"
                    >
                      <Hash className="w-4 h-4" />
                    </button>
                  </div>
                  {errors.sku && (
                    <p className="mt-1 text-sm text-red-600">{errors.sku}</p>
                  )}
                </div>

                {/* Descripción */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none resize-none"
                    placeholder="Descripción detallada del producto..."
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ✅ SECCIÓN 2: CLASIFICACIÓN */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('classification')}
            className="w-full p-6 border-b border-gray-100 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Layers className="w-5 h-5 text-gray-700" />
              <h3 className="text-xl font-light text-gray-900">
                Clasificación
              </h3>
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                Sistema Escritorio
              </span>
            </div>
            {openSections.classification ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {openSections.classification && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Marca */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marca
                  </label>
                  <input
                    type="text"
                    name="mark"
                    value={formData.mark}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                    placeholder="Ej: HP, Dell, Sony"
                  />
                </div>

                {/* Modelo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Modelo
                  </label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                    placeholder="Ej: Pavilion 15"
                  />
                </div>

                {/* Tipo de Producto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Producto
                  </label>
                  <select
                    name="product_type"
                    value={formData.product_type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                  >
                    <option value="T">T - Terminado</option>
                    <option value="S">S - Servicio</option>
                    <option value="C">C - Compuesto</option>
                  </select>
                </div>

                {/* Departamento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Departamento
                  </label>
                  <select
                    name="department_id"
                    value={formData.department_id}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                  >
                    <option value="">Seleccionar...</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Categoría (Legacy) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría (Legacy)
                  </label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                  >
                    <option value="">Seleccionar...</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Talla */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Talla
                  </label>
                  <input
                    type="text"
                    name="size"
                    value={formData.size}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                    placeholder="Ej: L, XL, 42"
                  />
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <input
                    type="text"
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                    placeholder="Ej: Negro, Azul, Rojo"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ✅ SECCIÓN 3: IMPUESTOS */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('pricing')}
            className="w-full p-6 border-b border-gray-100 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Percent className="w-5 h-5 text-gray-700" />
              <h3 className="text-xl font-light text-gray-900">
                Impuestos
              </h3>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                Venezuela
              </span>
            </div>
            {openSections.pricing ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {openSections.pricing && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Código de Impuesto de Venta */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código IVA Venta
                  </label>
                  <select
                    name="sale_tax_code"
                    value={formData.sale_tax_code}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                  >
                    <option value="01">01 - 16% (General)</option>
                    <option value="02">02 - 31% (Reducido)</option>
                    <option value="03">03 - 8% (Especial)</option>
                    <option value="06">06 - Percibido</option>
                    <option value="EX">EX - Exento</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">Código de impuesto para ventas</p>
                </div>

                {/* Código de Impuesto de Compra */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código IVA Compra
                  </label>
                  <select
                    name="buy_tax_code"
                    value={formData.buy_tax_code}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                  >
                    <option value="01">01 - 16% (General)</option>
                    <option value="02">02 - 31% (Reducido)</option>
                    <option value="03">03 - 8% (Especial)</option>
                    <option value="06">06 - Percibido</option>
                    <option value="EX">EX - Exento</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">Código de impuesto para compras</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ✅ SECCIÓN 4: PRECIOS MÚLTIPLES */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('inventory')}
            className="w-full p-6 border-b border-gray-100 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <DollarSign className="w-5 h-5 text-gray-700" />
              <h3 className="text-xl font-light text-gray-900">
                Precios Múltiples
              </h3>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                4 Niveles
              </span>
            </div>
            {openSections.inventory ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {openSections.inventory && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Precio Máximo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio Máximo
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">Bs</span>
                    <input
                      type="number"
                      name="maximum_price"
                      value={formData.maximum_price}
                      onChange={handleInputChange}
                      step="0.01"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Precio Oferta */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio Oferta
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">Bs</span>
                    <input
                      type="number"
                      name="offer_price"
                      value={formData.offer_price}
                      onChange={handleInputChange}
                      step="0.01"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Precio Mayor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio Mayor
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">Bs</span>
                    <input
                      type="number"
                      name="higher_price"
                      value={formData.higher_price}
                      onChange={handleInputChange}
                      step="0.01"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Precio Mínimo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio Mínimo
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">Bs</span>
                    <input
                      type="number"
                      name="minimum_price"
                      value={formData.minimum_price}
                      onChange={handleInputChange}
                      step="0.01"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Tipo de Precio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nivel de Precio a Usar
                  </label>
                  <select
                    name="sale_price_type"
                    value={formData.sale_price_type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                  >
                    <option value="0">0 - Precio Máximo</option>
                    <option value="1">1 - Precio Oferta (Default)</option>
                    <option value="2">2 - Precio Mayor</option>
                    <option value="3">3 - Precio Mínimo</option>
                    <option value="4">4 - Precio Variable</option>
                  </select>
                </div>

                {/* Precio USD */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    💵 Precio USD (Referencia)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-bold">$</span>
                    <input
                      type="number"
                      name="price_usd"
                      value={formData.price_usd}
                      onChange={handleInputChange}
                      step="0.01"
                      className="w-full pl-10 pr-4 py-3 bg-blue-50/50 border-2 border-blue-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none font-semibold"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Moneda de referencia para Venezuela</p>
                </div>

                {/* Precio Local (Legacy) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio Local (Bs)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">Bs</span>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      step="0.01"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Precio en moneda local (legacy)</p>
                </div>

                {/* Costo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Costo
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                    <input
                      type="number"
                      name="cost"
                      value={formData.cost}
                      onChange={handleInputChange}
                      step="0.01"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ✅ SECCIÓN 5: INVENTARIO */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('costing')}
            className="w-full p-6 border-b border-gray-100 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Warehouse className="w-5 h-5 text-gray-700" />
              <h3 className="text-xl font-light text-gray-900">
                Inventario
              </h3>
            </div>
            {openSections.costing ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {openSections.costing && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Stock Actual */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Actual
                  </label>
                  <input
                    type="number"
                    name="stock_quantity"
                    value={formData.stock_quantity}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                    placeholder="0"
                  />
                </div>

                {/* Stock Mínimo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Mínimo
                  </label>
                  <input
                    type="number"
                    name="min_stock"
                    value={formData.min_stock}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                    placeholder="10"
                  />
                </div>

                {/* Stock Máximo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Máximo
                  </label>
                  <input
                    type="number"
                    name="maximum_stock"
                    value={formData.maximum_stock}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                    placeholder="0"
                  />
                </div>

                {/* Almacén */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Almacén
                  </label>
                  <select
                    name="warehouse_id"
                    value={formData.warehouse_id}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                  >
                    <option value="">Seleccionar...</option>
                    {warehouses.map((wh) => (
                      <option key={wh.id} value={wh.id}>
                        {wh.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Opciones Avanzadas de Stock */}
                <div className="md:col-span-2 lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="allow_negative_stock"
                      checked={formData.allow_negative_stock}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Permitir Stock Negativo</span>
                      <p className="text-xs text-gray-500">Vender sin stock disponible</p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="serialized"
                      checked={formData.serialized}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Usa Serial</span>
                      <p className="text-xs text-gray-500">Producto con serial único</p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="use_lots"
                      checked={formData.use_lots}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Usa Lotes</span>
                      <p className="text-xs text-gray-500">Control por lotes</p>
                    </div>
                  </label>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Orden Lotes
                    </label>
                    <select
                      name="lots_order"
                      value={formData.lots_order}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                    >
                      <option value="0">0 - PEPS (Primero en entrar, primero en salir)</option>
                      <option value="1">1 - PUPS (Primero en salir, primero en servir)</option>
                      <option value="2">2 - Vencimiento</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ✅ SECCIÓN 6: COSTEO */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('discounts')}
            className="w-full p-6 border-b border-gray-100 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Calculator className="w-5 h-5 text-gray-700" />
              <h3 className="text-xl font-light text-gray-900">
                Costeo
              </h3>
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                Sistema Escritorio
              </span>
            </div>
            {openSections.discounts ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {openSections.discounts && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Tipo de Costeo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Método de Costeo
                  </label>
                  <select
                    name="costing_type"
                    value={formData.costing_type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                  >
                    <option value="0">0 - Promedio Ponderado</option>
                    <option value="1">1 - Último Costo</option>
                    <option value="2">2 - PEPS (FIFO)</option>
                    <option value="3">3 - UEPS (LIFO)</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">Método para calcular costo</p>
                </div>

                {/* Costo Calculado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Costo Calculado
                  </label>
                  <input
                    type="number"
                    name="calculated_cost"
                    value={formData.calculated_cost}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                    placeholder="0.00"
                  />
                </div>

                {/* Costo Promedio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Costo Promedio
                  </label>
                  <input
                    type="number"
                    name="average_cost"
                    value={formData.average_cost}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ✅ SECCIÓN 7: DESCUENTOS Y LÍMITES */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('advanced')}
            className="w-full p-6 border-b border-gray-100 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-5 h-5 text-gray-700" />
              <h3 className="text-xl font-light text-gray-900">
                Descuentos y Límites
              </h3>
            </div>
            {openSections.advanced ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {openSections.advanced && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Descuento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descuento (%)
                  </label>
                  <input
                    type="number"
                    name="discount"
                    value={formData.discount}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    max="100"
                    className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                    placeholder="0"
                  />
                </div>

                {/* Máximo Descuento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Máximo Descuento (%)
                  </label>
                  <input
                    type="number"
                    name="max_discount"
                    value={formData.max_discount}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    max="100"
                    className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                    placeholder="0"
                  />
                </div>

                {/* Venta Mínima */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cantidad Mínima Venta
                  </label>
                  <input
                    type="number"
                    name="minimal_sale"
                    value={formData.minimal_sale}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                    placeholder="0"
                  />
                </div>

                {/* Venta Máxima */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cantidad Máxima Venta
                  </label>
                  <input
                    type="number"
                    name="maximal_sale"
                    value={formData.maximal_sale}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ✅ SECCIÓN 8: CONFIGURACIÓN AVANZADA */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('advanced2')}
            className="w-full p-6 border-b border-gray-100 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Settings className="w-5 h-5 text-gray-700" />
              <h3 className="text-xl font-light text-gray-900">
                Configuración Avanzada
              </h3>
            </div>
            {openSections.advanced2 ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {openSections.advanced2 && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Permitir Decimales */}
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="allow_decimal"
                    checked={formData.allow_decimal}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Permitir Decimales</span>
                    <p className="text-xs text-gray-500">En cantidades</p>
                  </div>
                </label>

                {/* Redondeo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Decimales Redondeo
                  </label>
                  <select
                    name="rounding_type"
                    value={formData.rounding_type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                  >
                    <option value="0">0 decimales (0)</option>
                    <option value="2">2 decimales (0.00)</option>
                    <option value="4">4 decimales (0.0000)</option>
                  </select>
                </div>

                {/* Editar Nombre */}
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="edit_name"
                    checked={formData.edit_name}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Editar Nombre en Ventas</span>
                    <p className="text-xs text-gray-500">Permitir modificación</p>
                  </div>
                </label>

                {/* Usar Utilidad Departamento */}
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="take_department_utility"
                    checked={formData.take_department_utility}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Utilidad Departamento</span>
                    <p className="text-xs text-gray-500">Usar utilidad configurada</p>
                  </div>
                </label>

                {/* Moneda */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Moneda
                  </label>
                  <select
                    name="coin"
                    value={formData.coin}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                  >
                    <option value="01">01 - Bolívar</option>
                    <option value="02">02 - Dólar</option>
                  </select>
                </div>

                {/* Días de Garantía */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Días de Garantía
                  </label>
                  <input
                    type="number"
                    name="days_warranty"
                    value={formData.days_warranty}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                    placeholder="0"
                  />
                </div>

                {/* Estado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                  >
                    <option value="01">01 - Activo</option>
                    <option value="02">02 - Inactivo</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end space-x-4 pt-6">
          <Link
            href={isEdit ? `/products/${productId}` : '/products'}
            className="px-6 py-3 text-gray-600 bg-gray-50/80 border border-gray-200 rounded-2xl hover:bg-white transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>{isEdit ? 'Actualizar Producto' : 'Crear Producto'}</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};

export default ProductFormPage;
