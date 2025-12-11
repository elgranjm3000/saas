'use client'
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Edit,
  Trash2,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2,
  Printer,
  Download,
  Send,
  Clock,
  Calendar,
  DollarSign,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  AlertTriangle,
  MoreVertical,
  Eye
} from 'lucide-react';
import { invoicesAPI } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

interface InvoiceItem {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  tax_percent: number;
}

interface Invoice {
  id: number;
  invoice_number: string;
  customer_id: number;
  customer?: {
    id: number;
    name: string;
    email: string;
    phone?: string;
    address?: string;
  };
  issue_date: string;
  due_date?: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: 'presupuesto' | 'pendiente' | 'pagada' | 'vencida' | 'cancelada';
  items?: InvoiceItem[];
  notes?: string;
  payment_terms?: string;
  created_at: string;
  updated_at: string;
}

interface InvoiceDetailPageProps {
  params: {
    id: string;
  };
}

const InvoiceDetailPage = ({ params }: InvoiceDetailPageProps) => {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (params.id) {
      fetchInvoice();
    }
  }, [params.id]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await invoicesAPI.getById(Number(params.id));
      setInvoice(response.data);
    } catch (error: any) {
      console.error('Error fetching invoice:', error);
      setError('Error al cargar la factura');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!invoice) return;

    if (window.confirm('¿Estás seguro de que quieres eliminar esta factura? Esta acción no se puede deshacer.')) {
      try {
        await invoicesAPI.delete(invoice.id);
        router.push('/invoices');
      } catch (error) {
        console.error('Error deleting invoice:', error);
        alert('Error al eliminar la factura');
      }
    }
  };

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { color: string; bg: string; icon: any; label: string }> = {
      'presupuesto': { color: 'text-blue-600', bg: 'bg-blue-100', icon: FileText, label: 'Presupuesto' },
      'pendiente': { color: 'text-orange-600', bg: 'bg-orange-100', icon: Clock, label: 'Pendiente' },
      'pagada': { color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle, label: 'Pagada' },
      'vencida': { color: 'text-red-600', bg: 'bg-red-100', icon: AlertTriangle, label: 'Vencida' },
      'cancelada': { color: 'text-gray-600', bg: 'bg-gray-100', icon: FileText, label: 'Cancelada' }
    };
    return statusMap[status] || statusMap['pendiente'];
  };

  const getDaysUntilDue = () => {
    if (!invoice?.due_date) return null;
    const today = new Date();
    const dueDate = new Date(invoice.due_date);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="p-6 lg:p-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-light text-gray-900 mb-2">Factura no encontrada</h3>
          <p className="text-gray-500 mb-6">
            {error || 'La factura que buscas no existe o fue eliminada.'}
          </p>
          <Link
            href="/invoices"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-[1.02] shadow-lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="font-light">Volver a Facturas</span>
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(invoice.status);
  const StatusIcon = statusInfo.icon;
  const daysUntilDue = getDaysUntilDue();

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
                {invoice.invoice_number}
              </h1>
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 text-sm rounded-full ${statusInfo.bg} ${statusInfo.color} inline-flex items-center`}>
                  <StatusIcon className="w-3 h-3 mr-2" />
                  {statusInfo.label}
                </span>
                <p className="text-gray-500 font-light">
                  Creado: {formatDate(invoice.created_at)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-2xl transition-colors">
              <Printer className="w-5 h-5" />
            </button>
            <button className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-2xl transition-colors">
              <Download className="w-5 h-5" />
            </button>
            <button className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-2xl transition-colors">
              <Send className="w-5 h-5" />
            </button>
            <Link
              href={`/invoices/${invoice.id}/edit`}
              className="flex items-center px-4 py-3 text-white bg-gradient-to-r from-green-500 to-green-600 rounded-2xl hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-[1.02] shadow-lg"
            >
              <Edit className="w-4 h-4 mr-2" />
              <span className="font-light">Editar</span>
            </Link>
            <button
              onClick={handleDelete}
              className="flex items-center px-4 py-3 text-white bg-gradient-to-r from-red-500 to-red-600 rounded-2xl hover:from-red-600 hover:to-red-700 transition-all transform hover:scale-[1.02] shadow-lg"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              <span className="font-light">Eliminar</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="xl:col-span-2 space-y-8">
          {/* Invoice Details */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 overflow-hidden">
            <div className="p-8 border-b border-gray-100">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-8">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                    Número de Factura
                  </p>
                  <p className="text-lg font-light text-gray-900">
                    {invoice.invoice_number}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                    Fecha de Emisión
                  </p>
                  <p className="text-lg font-light text-gray-900">
                    {formatDate(invoice.issue_date, 'long')}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                    Fecha de Vencimiento
                  </p>
                  <p className="text-lg font-light text-gray-900">
                    {invoice.due_date ? formatDate(invoice.due_date, 'long') : '-'}
                  </p>
                </div>
              </div>

              {/* Customer & Payment Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-4">Cliente</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-gray-400 mr-3" />
                      <span className="text-gray-900 font-medium">{invoice.customer?.name || '-'}</span>
                    </div>
                    {invoice.customer?.email && (
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 text-gray-400 mr-3" />
                        <span className="text-gray-600">{invoice.customer.email}</span>
                      </div>
                    )}
                    {invoice.customer?.phone && (
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 text-gray-400 mr-3" />
                        <span className="text-gray-600">{invoice.customer.phone}</span>
                      </div>
                    )}
                    {invoice.customer?.address && (
                      <div className="flex items-start">
                        <MapPin className="w-4 h-4 text-gray-400 mr-3 mt-0.5" />
                        <span className="text-gray-600">{invoice.customer.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-4">Información de Pago</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium text-gray-900">{formatCurrency(invoice.subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Impuestos</span>
                      <span className="font-medium text-gray-900">{formatCurrency(invoice.tax_amount)}</span>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <span className="font-medium text-gray-900">Total a Pagar</span>
                      <span className="text-2xl font-light text-blue-600">
                        {formatCurrency(invoice.total_amount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/80 border-b border-gray-100">
                  <tr>
                    <th className="text-left py-4 px-6 font-medium text-gray-700">Producto</th>
                    <th className="text-center py-4 px-6 font-medium text-gray-700">Cantidad</th>
                    <th className="text-right py-4 px-6 font-medium text-gray-700">P. Unitario</th>
                    <th className="text-right py-4 px-6 font-medium text-gray-700">Impuesto</th>
                    <th className="text-right py-4 px-6 font-medium text-gray-700">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoice.items?.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-gray-900">{item.product_name}</p>
                          <p className="text-sm text-gray-500">ID: {item.product_id}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="py-4 px-6 text-right text-gray-900">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="py-4 px-6 text-right text-gray-900">
                        {item.tax_percent}%
                      </td>
                      <td className="py-4 px-6 text-right font-medium text-gray-900">
                        {formatCurrency(item.quantity * item.unit_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Notas</h3>
                <p className="text-gray-600">{invoice.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 overflow-hidden sticky top-8">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-light text-gray-900">Estado</h3>
            </div>
            <div className="p-6">
              <div className={`flex items-center justify-center w-full py-6 px-4 rounded-2xl ${statusInfo.bg} mb-4`}>
                <StatusIcon className={`w-8 h-8 ${statusInfo.color} mr-3`} />
                <span className={`text-lg font-medium ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              </div>

              {daysUntilDue !== null && (
                <div className="p-4 bg-blue-50 rounded-2xl mb-4">
                  {daysUntilDue > 0 ? (
                    <p className="text-sm text-blue-900">
                      <span className="font-medium">Vence en:</span> {daysUntilDue} días
                    </p>
                  ) : daysUntilDue === 0 ? (
                    <p className="text-sm text-orange-900 bg-orange-50 rounded-xl p-2">
                      <span className="font-medium">⚠️ Vence hoy</span>
                    </p>
                  ) : (
                    <p className="text-sm text-red-900 bg-red-50 rounded-xl p-2">
                      <span className="font-medium">⚠️ Vencida hace {Math.abs(daysUntilDue)} días</span>
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-900">{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Impuestos</span>
                  <span className="font-medium text-gray-900">{formatCurrency(invoice.tax_amount)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-200">
                  <span className="font-medium text-gray-900">Total</span>
                  <span className="text-lg font-light text-blue-600">
                    {formatCurrency(invoice.total_amount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-light text-gray-900">Acciones</h3>
            </div>
            <div className="p-6 space-y-3">
              <button className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-[1.02] shadow-lg">
                <Printer className="w-4 h-4 mr-3" />
                <span className="font-light">Imprimir</span>
              </button>
              <button className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-[1.02] shadow-lg">
                <Send className="w-4 h-4 mr-3" />
                <span className="font-light">Enviar por Email</span>
              </button>
              <button className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl hover:from-purple-600 hover:to-purple-700 transition-all transform hover:scale-[1.02] shadow-lg">
                <Download className="w-4 h-4 mr-3" />
                <span className="font-light">Descargar PDF</span>
              </button>
              <button className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl hover:from-orange-600 hover:to-orange-700 transition-all transform hover:scale-[1.02] shadow-lg">
                <CreditCard className="w-4 h-4 mr-3" />
                <span className="font-light">Registrar Pago</span>
              </button>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-light text-gray-900">Actividad</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Factura creada</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(invoice.created_at)}
                    </p>
                  </div>
                </div>

                <div className="text-center py-6">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">
                    No hay más actividad registrada
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetailPage;