'use client';

import React, { useState, useEffect } from 'react';
import { Package, ChevronDown, ChevronRight, Info } from 'lucide-react';
import { Product, Category } from '@/types/api';
import { ProductCreate } from '@/types/product';
import { productsAPI, categoriesAPI, warehousesAPI } from '@/lib/api';

interface ProductFormProps {
  product?: Product | any;
  onSuccess?: (product: Product) => void;
  onCancel?: () => void;
  initialWarehouseId?: string; // Nueva prop para preseleccionar almacén
}

export const ProductForm: React.FC<ProductFormProps> = ({
  product,
  onSuccess,
  onCancel,
  initialWarehouseId,
}) => {
  // ✅ SISTEMA ESCRITORIO: Estado con todos los campos del sistema de escritorio
  const [formData, setFormData] = useState<ProductCreate>({
    // Campos básicos
    name: product?.name || '',
    short_name: product?.short_name || '',
    description: product?.description || '',
    sku: product?.sku || '',

    // ✅ Clasificación (7 campos)
    mark: product?.mark || '',
    model: product?.model || '',
    department_id: product?.department_id?.toString() || '',
    size: product?.size || '',
    color: product?.color || '',
    product_type: product?.product_type || 'T',
    category_id: product?.category_id?.toString() || '',

    // ✅ Impuestos (códigos)
    sale_tax_code: product?.sale_tax_code || '01',
    buy_tax_code: product?.buy_tax_code || '01',

    // ✅ Precios (9 campos - 4 niveles + tipo + 2 monedas + costo)
    maximum_price: product?.maximum_price?.toString() || '0',
    offer_price: product?.offer_price?.toString() || '0',
    higher_price: product?.higher_price?.toString() || '0',
    minimum_price: product?.minimum_price?.toString() || '0',
    sale_price_type: product?.sale_price_type || 1,
    price: product?.price?.toString() || '0',
    price_usd: product?.price_usd?.toString() || '0',
    cost: product?.cost?.toString() || '0',

    // ✅ Stock (5 campos)
    stock_quantity: product?.quantity?.toString() || product?.stock_quantity?.toString() || '0',
    min_stock: product?.min_stock?.toString() || '10',
    maximum_stock: product?.maximum_stock?.toString() || '0',
    warehouse_id: initialWarehouseId || product?.warehouse_id?.toString() || '',
    allow_negative_stock: product?.allow_negative_stock || false,
    serialized: product?.serialized || false,
    use_lots: product?.use_lots || false,
    lots_order: product?.lots_order || 0,

    // ✅ Costeo (3 campos)
    costing_type: product?.costing_type || 0,
    calculated_cost: product?.calculated_cost?.toString() || '0',
    average_cost: product?.average_cost?.toString() || '0',

    // ✅ Descuentos (4 campos)
    discount: product?.discount || 0,
    max_discount: product?.max_discount || 0,
    minimal_sale: product?.minimal_sale || 0,
    maximal_sale: product?.maximal_sale || 0,

    // ✅ Configuración (7 campos)
    allow_decimal: product?.allow_decimal !== undefined ? product.allow_decimal : true,
    rounding_type: product?.rounding_type || 2,
    edit_name: product?.edit_name || false,
    take_department_utility: product?.take_department_utility !== undefined ? product.take_department_utility : true,
    coin: product?.coin || '01',
    days_warranty: product?.days_warranty || 0,
    status: product?.status || '01',
  });

  // ✅ Colapsible sections state
  const [openSections, setOpenSections] = useState({
    basic: true,
    classification: true,
    taxes: false,
    pricing: true,
    inventory: true,
    costing: false,
    discounts: false,
    advanced: false,
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  React.useEffect(() => {
    fetchCategories();
    fetchWarehouses();
  }, []);

  // ✅ Actualizar formData cuando cambia el producto (para modo edición)
  React.useEffect(() => {
    if (product) {
      console.log('🔄 Cargando producto en formulario:', product.name);
      console.log('  price_usd:', product.price_usd);
      console.log('  maximum_price:', product.maximum_price);
      console.log('  offer_price:', product.offer_price);

      setFormData({
        // Campos básicos
        name: product.name || '',
        short_name: product.short_name || '',
        description: product.description || '',
        sku: product.sku || '',

        // ✅ Clasificación (7 campos)
        mark: product.mark || '',
        model: product.model || '',
        department_id: product.department_id?.toString() || '',
        size: product.size || '',
        color: product.color || '',
        product_type: product.product_type || 'T',
        category_id: product.category_id?.toString() || '',

        // ✅ Impuestos (códigos)
        sale_tax_code: product.sale_tax_code || '01',
        buy_tax_code: product.buy_tax_code || '01',

        // ✅ Precios (9 campos - 4 niveles + tipo + 2 monedas + costo)
        maximum_price: product.maximum_price?.toString() || '0',
        offer_price: product.offer_price?.toString() || '0',
        higher_price: product.higher_price?.toString() || '0',
        minimum_price: product.minimum_price?.toString() || '0',
        sale_price_type: product.sale_price_type || 1,
        price: product.price?.toString() || '0',
        price_usd: product.price_usd?.toString() || '0',
        cost: product.cost?.toString() || '0',

        // ✅ Stock (5 campos)
        stock_quantity: product.quantity?.toString() || product.stock_quantity?.toString() || '0',
        min_stock: product.min_stock?.toString() || '10',
        maximum_stock: product.maximum_stock?.toString() || '0',
        warehouse_id: product.warehouse_id?.toString() || '',
        allow_negative_stock: product.allow_negative_stock || false,
        serialized: product.serialized || false,
        use_lots: product.use_lots || false,
        lots_order: product.lots_order || 0,

        // ✅ Costeo (3 campos)
        costing_type: product.costing_type || 0,
        calculated_cost: product.calculated_cost?.toString() || '0',
        average_cost: product.average_cost?.toString() || '0',

        // ✅ Descuentos (4 campos)
        discount: product.discount || 0,
        max_discount: product.max_discount || 0,
        minimal_sale: product.minimal_sale || 0,
        maximal_sale: product.maximal_sale || 0,

        // ✅ Configuración (7 campos)
        allow_decimal: product.allow_decimal !== undefined ? product.allow_decimal : true,
        rounding_type: product.rounding_type || 2,
        edit_name: product.edit_name || false,
        take_department_utility: product.take_department_utility !== undefined ? product.take_department_utility : true,
        coin: product.coin || '01',
        days_warranty: product.days_warranty || 0,
        status: product.status || '01',
      });
    }
  }, [product]);

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data);
      console.log('✅ Categories loaded:', response.data.length, 'categories');
    } catch (err) {
      console.error('❌ Error fetching categories:', err);
    }
  };

  // ✅ SISTEMA ESCRITORIO: Fetch warehouses (Depósitos)
  const fetchWarehouses = async () => {
    try {
      const response = await warehousesAPI.getAll();
      setWarehouses(response.data);
      console.log('✅ Warehouses loaded:', response.data.length, 'warehouses');
    } catch (err) {
      console.error('❌ Error fetching warehouses:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // ✅ SISTEMA ESCRITORIO: Preparar payload con todos los campos
      const payload: any = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        sku: formData.sku.trim(),
        // ⚠️ NOTA: No enviamos 'price' porque el trigger lo calcula automáticamente desde 'price_usd'
        // price_usd es el valor de referencia, y el trigger calcula price según la moneda base
        price_usd: formData.price_usd ? parseFloat(formData.price_usd) : undefined,
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
        quantity: formData.stock_quantity ? parseInt(formData.stock_quantity) : 0,
        min_stock: formData.min_stock ? parseInt(formData.min_stock) : undefined,
        category_id: formData.category_id ? parseInt(formData.category_id) : undefined,
        warehouse_id: formData.warehouse_id ? parseInt(formData.warehouse_id) : undefined,

        // ✅ SISTEMA ESCRITORIO: Campos nuevos
        short_name: formData.short_name || undefined,
        mark: formData.mark || undefined,
        model: formData.model || undefined,
        // department_id: formData.department_id ? parseInt(formData.department_id) : undefined,  // ⚠️ Deshabilitado - campo Depósito no guarda en BD
        size: formData.size || undefined,
        color: formData.color || undefined,
        product_type: formData.product_type,
        sale_tax_code: formData.sale_tax_code,
        buy_tax_code: formData.buy_tax_code,
        maximum_price: formData.maximum_price ? parseFloat(formData.maximum_price) : undefined,
        offer_price: formData.offer_price ? parseFloat(formData.offer_price) : undefined,
        higher_price: formData.higher_price ? parseFloat(formData.higher_price) : undefined,
        minimum_price: formData.minimum_price ? parseFloat(formData.minimum_price) : undefined,
        sale_price_type: formData.sale_price_type,
        maximum_stock: formData.maximum_stock ? parseFloat(formData.maximum_stock) : undefined,
        allow_negative_stock: formData.allow_negative_stock,
        serialized: formData.serialized,
        use_lots: formData.use_lots,
        lots_order: formData.lots_order,
        costing_type: formData.costing_type,
        calculated_cost: formData.calculated_cost ? parseFloat(formData.calculated_cost) : undefined,
        average_cost: formData.average_cost ? parseFloat(formData.average_cost) : undefined,
        discount: formData.discount,
        max_discount: formData.max_discount,
        minimal_sale: formData.minimal_sale,
        maximal_sale: formData.maximal_sale,
        allow_decimal: formData.allow_decimal,
        rounding_type: formData.rounding_type,
        edit_name: formData.edit_name,
        take_department_utility: formData.take_department_utility,
        coin: formData.coin,
        days_warranty: formData.days_warranty,
        status: formData.status,
      };

      if (product?.id) {
        const response = await productsAPI.update(product.id, payload);
        onSuccess?.(response.data);
      } else {
        const response = await productsAPI.create(payload);
        onSuccess?.(response.data);
      }
    } catch (err: any) {
      console.error('Error saving product:', err);
      setError(err.response?.data?.detail || 'Error al guardar producto');
    } finally {
      setLoading(false);
    }
  };

  // ✅ SISTEMA REF: Calcular margen
  const margin = formData.cost && formData.price_usd
    ? ((parseFloat(formData.price_usd) - parseFloat(formData.cost)) / parseFloat(formData.cost)) * 100
    : 0;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      )}

      {/* ✅ SECCIÓN 1: INFORMACIÓN BÁSICA */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('basic')}
          className="w-full px-6 py-4 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Información Básica</h3>
          </div>
          {openSections.basic ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
        </button>

        {openSections.basic && (
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Producto *
              </label>
              <input
                type="text"
                required
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Laptop Dell Inspiron 15"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre Corto
              </label>
              <input
                type="text"
                name="short_name"
                value={formData.short_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Dell 15"
              />
              <p className="text-xs text-gray-500 mt-1">Nombre abreviado para mostrar en listas</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Descripción detallada del producto..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU (Código de Producto) *
              </label>
              <input
                type="text"
                required
                name="sku"
                value={formData.sku}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                placeholder="PROD-001"
              />
            </div>
          </div>
        )}
      </div>

      {/* ✅ SECCIÓN 2: CLASIFICACIÓN */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('classification')}
          className="w-full px-6 py-4 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Clasificación</h3>
          </div>
          {openSections.classification ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
        </button>

        {openSections.classification && (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Marca
                </label>
                <input
                  type="text"
                  name="mark"
                  value={formData.mark}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Dell"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Modelo
                </label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Inspiron 15"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Talla
                </label>
                <input
                  type="text"
                  name="size"
                  value={formData.size}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: M, L, XL"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <input
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Negro"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Producto
                </label>
                <select
                  name="product_type"
                  value={formData.product_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="T">T - Producto Terminado</option>
                  <option value="S">S - Servicio</option>
                  <option value="C">C - Compuesto</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Depósito
                </label>
                <select
                  name="warehouse_id"
                  value={formData.warehouse_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seleccionar...</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id.toString()}>
                      {warehouse.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Departamento *
                </label>
                <select
                  required
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seleccionar...</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id.toString()}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ✅ SECCIÓN 3: IMPUESTOS */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('taxes')}
          className="w-full px-6 py-4 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Info className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Impuestos</h3>
          </div>
          {openSections.taxes ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
        </button>

        {openSections.taxes && (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código Impuesto Venta
                </label>
                <select
                  name="sale_tax_code"
                  value={formData.sale_tax_code}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="01">01 - General (16%)</option>
                  <option value="02">02 - Reducido (8%)</option>
                  <option value="03">03 - Aumentado (31%)</option>
                  <option value="06">06 - Percibido</option>
                  <option value="EX">EX - Exento</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Alícuota de IVA para ventas</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código Impuesto Compra
                </label>
                <select
                  name="buy_tax_code"
                  value={formData.buy_tax_code}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="01">01 - General (16%)</option>
                  <option value="02">02 - Reducido (8%)</option>
                  <option value="03">03 - Aumentado (31%)</option>
                  <option value="06">06 - Percibido</option>
                  <option value="EX">EX - Exento</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Alícuota de IVA para compras</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ✅ SECCIÓN 4: PRECIOS MÚLTIPLES */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('pricing')}
          className="w-full px-6 py-4 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-yellow-600" />
            <h3 className="text-lg font-semibold text-gray-900">Precios Múltiples</h3>
          </div>
          {openSections.pricing ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
        </button>

        {openSections.pricing && (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio Máximo
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="maximum_price"
                  value={formData.maximum_price}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio Oferta
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="offer_price"
                  value={formData.offer_price}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio Mayor
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="higher_price"
                  value={formData.higher_price}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio Mínimo
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="minimum_price"
                  value={formData.minimum_price}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Precio
                </label>
                <select
                  name="sale_price_type"
                  value={formData.sale_price_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="0">0 - Precio Máximo</option>
                  <option value="1">1 - Precio Oferta</option>
                  <option value="2">2 - Precio Mayor</option>
                  <option value="3">3 - Precio Mínimo</option>
                  <option value="4">4 - Precio Variable</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Precio por defecto para ventas</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  💵 Precio USD (Referencia)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="price_usd"
                    value={formData.price_usd}
                    onChange={handleInputChange}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Precio en moneda estable (USD)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  💲 Precio Local (Calculado)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">Bs</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                    placeholder="0.00"
                    disabled
                    readOnly
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Calculado automáticamente desde Precio USD según moneda base
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  💰 Costo
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="cost"
                    value={formData.cost}
                    onChange={handleInputChange}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Costo de adquisición</p>
              </div>
            </div>

            {/* ✅ Margen calculado */}
            {formData.cost && formData.price_usd && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Margen de Ganancia</p>
                    <p className="text-xs text-gray-500">
                      Costo: ${parseFloat(formData.cost).toFixed(2)} → Precio: ${parseFloat(formData.price_usd).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${margin >= 20 ? 'text-green-600' : margin >= 10 ? 'text-orange-600' : 'text-red-600'}`}>
                      {margin.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">
                      Ganancia: ${(parseFloat(formData.price_usd) - parseFloat(formData.cost)).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ✅ SECCIÓN 5: INVENTARIO */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('inventory')}
          className="w-full px-6 py-4 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-900">Inventario</h3>
          </div>
          {openSections.inventory ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
        </button>

        {openSections.inventory && (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Actual *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  name="stock_quantity"
                  value={formData.stock_quantity}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Mínimo
                </label>
                <input
                  type="number"
                  min="0"
                  name="min_stock"
                  value={formData.min_stock}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Máximo
                </label>
                <input
                  type="number"
                  min="0"
                  name="maximum_stock"
                  value={formData.maximum_stock}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="allow_negative_stock"
                    checked={formData.allow_negative_stock}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Permitir stock negativo</span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">Permite vender incluso sin stock disponible</p>
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="serialized"
                    checked={formData.serialized}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Usa serial</span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">El producto requiere control por número de serial</p>
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="use_lots"
                    checked={formData.use_lots}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Usa lotes</span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">El producto requiere control por lotes</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Orden de lotes
                </label>
                <select
                  name="lots_order"
                  value={formData.lots_order}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="0">0 - PEPS (First In, First Out)</option>
                  <option value="1">1 - PUPS (First In, Last Out)</option>
                  <option value="2">2 - Por vencimiento</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ✅ SECCIÓN 6: COSTEO */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('costing')}
          className="w-full px-6 py-4 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">Costeo</h3>
          </div>
          {openSections.costing ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
        </button>

        {openSections.costing && (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Costeo
                </label>
                <select
                  name="costing_type"
                  value={formData.costing_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="0">0 - Promedio</option>
                  <option value="1">1 - Último</option>
                  <option value="2">2 - PEPS</option>
                  <option value="3">3 - UEPS</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Método de cálculo de costo</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Costo Calculado
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="calculated_cost"
                  value={formData.calculated_cost}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Costo Promedio
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="average_cost"
                  value={formData.average_cost}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ✅ SECCIÓN 7: DESCUENTOS Y LÍMITES */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('discounts')}
          className="w-full px-6 py-4 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-teal-600" />
            <h3 className="text-lg font-semibold text-gray-900">Descuentos y Límites</h3>
          </div>
          {openSections.discounts ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
        </button>

        {openSections.discounts && (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descuento (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  name="discount"
                  value={formData.discount}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">Descuento por defecto del producto</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Máximo Descuento (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  name="max_discount"
                  value={formData.max_discount}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">Límite máximo de descuento permitido</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Venta Mínima
                </label>
                <input
                  type="number"
                  min="0"
                  name="minimal_sale"
                  value={formData.minimal_sale}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1"
                />
                <p className="text-xs text-gray-500 mt-1">Cantidad mínima por venta</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Venta Máxima
                </label>
                <input
                  type="number"
                  min="0"
                  name="maximal_sale"
                  value={formData.maximal_sale}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">Cantidad máxima por venta (0 = sin límite)</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ✅ SECCIÓN 8: CONFIGURACIÓN AVANZADA */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('advanced')}
          className="w-full px-6 py-4 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Configuración Avanzada</h3>
          </div>
          {openSections.advanced ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
        </button>

        {openSections.advanced && (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="allow_decimal"
                    checked={formData.allow_decimal}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Permitir decimales</span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">Permite cantidades con decimales</p>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="edit_name"
                    checked={formData.edit_name}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Editar nombre en venta</span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">Permite modificar el nombre al facturar</p>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="take_department_utility"
                    checked={formData.take_department_utility}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Usar utilidad del departamento</span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">Calcula precio según margen del departamento</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Decimales
                </label>
                <select
                  name="rounding_type"
                  value={formData.rounding_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="0">0 decimales (0)</option>
                  <option value="2">2 decimales (0.00)</option>
                  <option value="4">4 decimales (0.0000)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Moneda
                </label>
                <select
                  name="coin"
                  value={formData.coin}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="01">01 - Bolívar</option>
                  <option value="02">02 - Dólar</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Moneda principal del producto</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Garantía (días)
                </label>
                <input
                  type="number"
                  min="0"
                  name="days_warranty"
                  value={formData.days_warranty}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">Días de garantía del producto</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="01">01 - Activo</option>
                  <option value="02">02 - Inactivo</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ✅ ACCIONES DEL FORMULARIO */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? 'Guardando...' : product?.id ? 'Actualizar Producto' : 'Crear Producto'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
};

export default ProductForm;
