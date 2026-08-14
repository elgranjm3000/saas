'use client'
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Save,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2,
  Plus,
  Trash2,
  User,
  Package,
  X,
  Search,
  Info,
  FileCode,
  ShoppingCart,
  Truck,
  Receipt,
  FileMinus,
  Calculator,
} from 'lucide-react';
import { salesOperationsAPI, customersAPI, productsAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { extractErrorMessage } from '@/lib/errorHandler';
import { SalesOperation, OperationType, SalesOperationCreate } from '@/types/sales-operation';
import { Customer } from '@/types/customer';
import { Product } from '@/types/product';

// ✅ SISTEMA ESCRITORIO: Configuración de tipos de documentos
const OPERATION_TYPES: { type: OperationType; label: string; icon: any; color: string }[] = [
  { type: 'BUDGET', label: 'Presupuesto', icon: FileCode, color: 'text-purple-600' },
  { type: 'ORDER', label: 'Pedido de Venta', icon: ShoppingCart, color: 'text-blue-600' },
  { type: 'DELIVERYNOTE', label: 'Orden de Entrega', icon: Truck, color: 'text-orange-600' },
  { type: 'BILL', label: 'Factura', icon: Receipt, color: 'text-green-600' },
  { type: 'CREDITNOTE', label: 'Nota de Crédito', icon: FileMinus, color: 'text-red-600' },
  { type: 'DEBITNOTE', label: 'Nota de Débito', icon: FileText, color: 'text-yellow-600' },
];

// ✅ SISTEMA ESCRITORIO: Flujo de conversión (sugerir siguiente tipo)
const SUGGESTED_NEXT_TYPE: Record<OperationType, OperationType> = {
  'BUDGET': 'ORDER',
  'ORDER': 'BILL',
  'DELIVERYNOTE': 'BILL',
  'BILL': 'CREDITNOTE',
};

interface SalesOperationItem {
  product_id: number;
  product_name?: string;
  product_code?: string;
  quantity: number;
  unit_price: number;
  sale_tax_code: string;
  sale_aliquot: number;
  total_net: number;
  total_tax: number;
  total: number;
}

interface SalesOperationFormData {
  operation_type: OperationType;
  client_id: number | null;
  emission_date: string;
  expiration_date?: string;
  register_date: string;
  seller: string;
  store: string;
  locations: string;
  station: string;
  wait: boolean;
  pending: boolean;
  canceled: boolean;
  delivered: boolean;
  coin_code: string;
  percent_discount: number;
  percent_freight: number;
  freight: number;
  items: SalesOperationItem[];
  operation_comments?: string;
  description?: string;
  address_send?: string;
  contact_send?: string;
  phone_send?: string;
  total_weight?: number;
}

interface SalesOperationFormProps {
  operationId?: number;
  isEdit?: boolean;
}

const SalesOperationForm: React.FC<SalesOperationFormProps> = ({ operationId, isEdit = false }) => {
  const [formData, setFormData] = useState<SalesOperationFormData>({
    operation_type: 'BUDGET',
    client_id: null,
    emission_date: new Date().toISOString().split('T')[0],
    register_date: new Date().toISOString().split('T')[0],
    seller: 'Vendedor',
    store: 'Principal',
    locations: 'Principal',
    station: 'Caja 1',
    wait: false,
    pending: false,
    canceled: false,
    delivered: false,
    coin_code: '01',
    percent_discount: 0,
    percent_freight: 0,
    freight: 0,
    items: [],
  });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [selectedCustomerName, setSelectedCustomerName] = useState('');

  const router = useRouter();

  useEffect(() => {
    fetchCustomers();
    fetchProducts();

    if (isEdit && operationId) {
      fetchOperation();
    }
  }, [isEdit, operationId]);

  const fetchCustomers = async () => {
    try {
      const response = await customersAPI.getAll();
      setCustomers(response.data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productsAPI.getAll();
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchOperation = async () => {
    if (!operationId) return;

    try {
      setInitialLoading(true);
      const response = await salesOperationsAPI.getById(operationId);
      const operation: SalesOperation = response.data;

      // Buscar el nombre del cliente
      const customer = customers.find(c => c.id === operation.client_id);
      if (customer) {
        setSelectedCustomerName(customer.name);
      }

      setFormData({
        operation_type: operation.operation_type,
        client_id: operation.client_id,
        emission_date: operation.emission_date.split('T')[0],
        expiration_date: operation.expiration_date?.split('T')[0],
        register_date: operation.register_date.split('T')[0],
        seller: operation.seller,
        store: operation.store,
        locations: operation.locations,
        station: operation.station,
        wait: operation.wait,
        pending: operation.pending,
        canceled: operation.canceled,
        delivered: operation.delivered,
        coin_code: operation.coin_code,
        percent_discount: operation.percent_discount,
        percent_freight: operation.percent_freight,
        freight: operation.freight,
        items: operation.details?.map(d => ({
          product_id: 0,
          product_name: d.description_product,
          quantity: d.amount,
          unit_price: d.price,
          sale_tax_code: d.sale_tax,
          sale_aliquot: d.sale_aliquot,
          total_net: d.total_net,
          total_tax: d.total_tax,
          total: d.total,
        })) || [],
        operation_comments: operation.operation_comments,
        description: operation.description,
      });
    } catch (error) {
      console.error('Error fetching operation:', error);
      setErrors({ general: 'Error al cargar la operación' });
    } finally {
      setInitialLoading(false);
    }
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.total_net, 0);
    const totalTax = formData.items.reduce((sum, item) => sum + item.total_tax, 0);
    const discount = subtotal * (formData.percent_discount / 100);
    const freight = formData.freight;
    const total = subtotal + totalTax - discount + freight;

    return { subtotal, totalTax, discount, freight, total };
  };

  const addProduct = (product: Product) => {
    const taxCode = product.sale_tax_code || '01';
    const aliquot = getTaxAliquot(taxCode);

    const newItem: SalesOperationItem = {
      product_id: product.id,
      product_name: product.name,
      product_code: product.sku,
      quantity: 1,
      unit_price: product.price || 0,
      sale_tax_code: taxCode,
      sale_aliquot: aliquot,
      total_net: product.price || 0,
      total_tax: (product.price || 0) * (aliquot / 100),
      total: (product.price || 0) * (1 + aliquot / 100),
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));

    setShowProductSearch(false);
    setProductSearch('');
  };

  const getTaxAliquot = (taxCode: string): number => {
    const taxMap: Record<string, number> = {
      '01': 16,
      '02': 8,
      '03': 31,
      '06': 0,
      'EX': 0,
    };
    return taxMap[taxCode] || 16;
  };

  const updateItem = (index: number, field: keyof SalesOperationItem, value: any) => {
    const newItems = [...formData.items];
    const item = { ...newItems[index] };

    if (field === 'quantity' || field === 'unit_price') {
      item[field] = value;
      item.total_net = item.quantity * item.unit_price;
      item.total_tax = item.total_net * (item.sale_aliquot / 100);
      item.total = item.total_net + item.total_tax;
    } else if (field === 'sale_tax_code') {
      item[field] = value;
      item.sale_aliquot = getTaxAliquot(value);
      item.total_tax = item.total_net * (item.sale_aliquot / 100);
      item.total = item.total_net + item.total_tax;
    } else {
      item[field] = value;
    }

    newItems[index] = item;
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.client_id) {
      newErrors.client_id = 'El cliente es requerido';
    }

    if (formData.items.length === 0) {
      newErrors.items = 'Debe agregar al menos un producto';
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

      const totals = calculateTotals();

      const payload: SalesOperationCreate = {
        operation_type: formData.operation_type,
        client_id: formData.client_id!,
        emission_date: formData.emission_date,
        register_date: formData.register_date,
        correlative: 0,
        seller: formData.seller,
        store: formData.store,
        locations: formData.locations,
        station: formData.station,
        wait: formData.wait,
        pending: formData.pending,
        canceled: formData.canceled,
        delivered: formData.delivered,
        coin_code: formData.coin_code,
        percent_discount: formData.percent_discount,
        freight: formData.freight,
        total_net: totals.subtotal,
        total_tax: totals.totalTax,
        total: totals.total,
      };

      if (isEdit && operationId) {
        await salesOperationsAPI.update(operationId, payload);
      } else {
        await salesOperationsAPI.create(payload);
      }

      setSuccess(true);

      setTimeout(() => {
        router.push('/sales-operations');
      }, 1500);

    } catch (error: any) {
      console.error('Error saving operation:', error);
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
  const typeInfo = OPERATION_TYPES.find(t => t.type === formData.operation_type);
  const TypeIcon = typeInfo?.icon || FileText;

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link
              href="/sales-operations"
              className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-2xl transition-colors"
            >
              <FileText className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-light text-gray-900 mb-2">
                {isEdit ? 'Editar Operación' : 'Nueva Operación'}
              </h1>
              <p className="text-gray-500 font-light">
                {typeInfo?.label && `${typeInfo.label} - `}{isEdit ? 'Modifica' : 'Crea'} una operación de venta
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
              Operación guardada correctamente
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
            {/* Tipo de Operación */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-light text-gray-900 flex items-center">
                  <TypeIcon className={`w-6 h-6 mr-2 ${typeInfo?.color}`} />
                  Tipo de Documento
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {OPERATION_TYPES.map(({ type, label, icon: Icon, color }) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, operation_type: type as OperationType }))}
                      className={`p-4 rounded-2xl border-2 transition-all ${
                        formData.operation_type === type
                          ? `border-blue-500 bg-blue-50 ${color}`
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className={`w-6 h-6 mb-2 ${formData.operation_type === type ? color : 'text-gray-400'}`} />
                      <p className={`text-sm font-medium ${formData.operation_type === type ? color : 'text-gray-600'}`}>
                        {label}
                      </p>
                    </button>
                  ))}
                </div>

                {!isEdit && SUGGESTED_NEXT_TYPE[formData.operation_type] && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-xl flex items-start space-x-2">
                    <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div className="text-xs text-blue-700">
                      <p className="font-medium">Workflow sugerido:</p>
                      <p>Este documento normalmente se convierte a <strong>{OPERATION_TYPES.find(t => t.type === SUGGESTED_NEXT_TYPE[formData.operation_type])?.label}</strong></p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Cliente y Fechas */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-light text-gray-900">Cliente y Fechas</h3>
              </div>
              <div className="p-6 space-y-6">
                {/* Cliente */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Cliente *
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={selectedCustomerName}
                      onChange={(e) => {
                        setSelectedCustomerName(e.target.value);
                        setShowCustomerDropdown(true);
                      }}
                      onFocus={() => setShowCustomerDropdown(true)}
                      className={`w-full pl-12 pr-4 py-3 bg-gray-50/80 border rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all outline-none ${
                        errors.client_id ? 'border-red-300' : 'border-gray-200/60'
                      }`}
                      placeholder="Buscar cliente..."
                    />
                  </div>
                  {errors.client_id && (
                    <p className="mt-2 text-sm text-red-600">{errors.client_id}</p>
                  )}

                  {showCustomerDropdown && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {customers
                        .filter(c =>
                          c.name.toLowerCase().includes(selectedCustomerName.toLowerCase()) ||
                          (c.tax_id && c.tax_id.toLowerCase().includes(selectedCustomerName.toLowerCase()))
                        )
                        .map(customer => (
                          <button
                            key={customer.id}
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, client_id: customer.id }));
                              setSelectedCustomerName(customer.name);
                              setShowCustomerDropdown(false);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                          >
                            <p className="font-medium text-gray-900">{customer.name}</p>
                            <p className="text-xs text-gray-500">{customer.tax_id || 'Sin RIF'}</p>
                          </button>
                        ))}
                    </div>
                  )}
                </div>

                {/* Fechas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Fecha de Emisión *
                    </label>
                    <input
                      type="date"
                      value={formData.emission_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, emission_date: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Fecha de Vencimiento
                    </label>
                    <input
                      type="date"
                      value={formData.expiration_date || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, expiration_date: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Productos */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-light text-gray-900">Productos</h3>
                  <button
                    type="button"
                    onClick={() => setShowProductSearch(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Producto
                  </button>
                </div>
              </div>

              <div className="p-6">
                {errors.items && (
                  <div className="mb-4 p-3 bg-red-50 rounded-xl">
                    <p className="text-sm text-red-600">{errors.items}</p>
                  </div>
                )}

                {formData.items.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No hay productos agregados</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.items.map((item, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-1">
                              {item.product_name}
                            </h4>
                            <p className="text-xs text-gray-500">{item.product_code}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Cantidad
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 1)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all outline-none text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Precio Unit.
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.unit_price}
                              onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all outline-none text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              IVA
                            </label>
                            <select
                              value={item.sale_tax_code}
                              onChange={(e) => updateItem(index, 'sale_tax_code', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all outline-none text-sm"
                            >
                              <option value="01">16% General</option>
                              <option value="02">8% Reducido</option>
                              <option value="03">31% Aumentado</option>
                              <option value="EX">Exento</option>
                            </select>
                          </div>

                          <div className="col-span-2">
                            <div className="grid grid-cols-3 gap-2 text-right text-sm">
                              <div>
                                <p className="text-xs text-gray-500">Neto</p>
                                <p className="font-medium text-gray-900">{formatCurrency(item.total_net)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">IVA</p>
                                <p className="font-medium text-gray-900">{formatCurrency(item.total_tax)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Total</p>
                                <p className="font-bold text-gray-900">{formatCurrency(item.total)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Descuentos y Fletes */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-light text-gray-900">Descuentos y Fletes</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Descuento (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.percent_discount}
                      onChange={(e) => setFormData(prev => ({ ...prev, percent_discount: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Flete (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.percent_freight}
                      onChange={(e) => setFormData(prev => ({ ...prev, percent_freight: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Monto Flete
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.freight}
                      onChange={(e) => setFormData(prev => ({ ...prev, freight: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Comentarios */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-light text-gray-900">Comentarios</h3>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Notas de la Operación
                  </label>
                  <textarea
                    value={formData.operation_comments || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, operation_comments: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                    rows={3}
                    placeholder="Notas adicionales sobre la operación..."
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4">
              <Link
                href="/sales-operations"
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
                  {loading ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear'} Operación
                </span>
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar - Totals */}
        <div className="space-y-6">
          {/* Totals Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 overflow-hidden sticky top-6">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-light text-gray-900 flex items-center">
                <Calculator className="w-5 h-5 mr-2 text-blue-600" />
                Resumen
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Subtotal Neto</span>
                <span className="font-medium text-gray-900">{formatCurrency(totals.subtotal)}</span>
              </div>

              {formData.percent_discount > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Descuento ({formData.percent_discount}%)</span>
                  <span className="font-medium text-red-600">-{formatCurrency(totals.discount)}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total IVA</span>
                <span className="font-medium text-gray-900">{formatCurrency(totals.totalTax)}</span>
              </div>

              {formData.freight > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Flete</span>
                  <span className="font-medium text-gray-900">{formatCurrency(totals.freight)}</span>
                </div>
              )}

              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-blue-600">{formatCurrency(totals.total)}</span>
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-4 mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-700">Productos</span>
                  <span className="font-bold text-blue-700">{formData.items.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de búsqueda de productos */}
      {showProductSearch && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-medium text-gray-900">Agregar Producto</h3>
                <button
                  onClick={() => {
                    setShowProductSearch(false);
                    setProductSearch('');
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Buscar por nombre o código..."
                  className="w-full pl-12 pr-4 py-3 bg-gray-50/80 border border-gray-200 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                  autoFocus
                />
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No se encontraron productos</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => addProduct(product)}
                      className="w-full p-4 bg-gray-50 hover:bg-blue-50 border border-gray-200 rounded-xl text-left transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">{product.name}</h4>
                          <p className="text-xs text-gray-500">{product.sku}</p>
                          {product.mark && (
                            <p className="text-xs text-gray-400">{product.mark} {product.model && `- ${product.model}`}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">{formatCurrency(product.price || 0)}</p>
                          <p className="text-xs text-gray-500">Código: {product.sale_tax_code || '01'}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesOperationForm;
