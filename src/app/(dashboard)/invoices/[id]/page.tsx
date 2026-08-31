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
  Eye,
  X
} from 'lucide-react';
import { invoicesAPI, customersAPI } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Customer } from '@/types/customer';

interface InvoiceItem {
  product_id: number;
  product_name: string;
  quantity: number;
  price_per_unit: number; // Backend usa price_per_unit
  tax_rate?: number; // Backend usa tax_rate
  tax_amount?: number;
  is_exempt?: boolean;
}

interface Invoice {
  id: number;
  invoice_number: string;
  customer_id: number;
  customer_name?: string;
  customer?: {
    id: number;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    tax_id?: string;
  };
  date: string; // Backend usa 'date', no 'issue_date'
  due_date?: string;
  total_amount: number;
  status: 'presupuesto' | 'factura' | 'pendiente' | 'pagada' | 'vencida' | 'cancelada';
  items?: InvoiceItem[];
  notes?: string;
  discount?: number;

  // Venezuela SENIAT
  control_number?: string;
  transaction_type?: 'contado' | 'credito';
  payment_method?: string;
  credit_days?: number;
  iva_percentage?: number;
  iva_amount?: number;
  taxable_base?: number;
  exempt_amount?: number;
  subtotal?: number;
  total_with_taxes?: number;
  customer_phone?: string;
  customer_address?: string;

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
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
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
      const invoiceData = response.data;

      // Obtener nombre del cliente
      if (invoiceData.customer_id) {
        try {
          const customerResponse = await customersAPI.getById(invoiceData.customer_id);
          const customer: Customer = customerResponse.data;
          invoiceData.customer_name = customer.name;
        } catch (error) {
          console.error('Error fetching customer:', error);
          invoiceData.customer_name = `Cliente #${invoiceData.customer_id}`;
        }
      }

      setInvoice(invoiceData);
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

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!invoice) return;

    try {
      // Crear contenido de texto simple por ahora
      const content = `
FACTURA: ${invoice.invoice_number}
================================
Fecha: ${formatDate(invoice.date, 'long')}
Vencimiento: ${invoice.due_date ? formatDate(invoice.due_date, 'long') : 'N/A'}

CLIENTE
-------
${invoice.customer_name || invoice.customer?.name || 'N/A'}
${invoice.customer?.email || ''}
${invoice.customer?.phone || ''}
${invoice.customer?.address || ''}

ITEMS
-----
${invoice.items?.map(item =>
  `${item.product_name} x${item.quantity} - ${formatCurrency(item.price_per_unit)} = ${formatCurrency(item.quantity * item.price_per_unit)}`
).join('\n') || 'No items'}

RESUMEN
------
${invoice.taxable_base ? `Base Imponible: ${formatCurrency(invoice.taxable_base)}` : ''}
${invoice.exempt_amount ? `Monto Exento: ${formatCurrency(invoice.exempt_amount)}` : ''}
${invoice.iva_amount ? `IVA (${invoice.iva_percentage || 16}%): ${formatCurrency(invoice.iva_amount)}` : ''}
TOTAL: ${formatCurrency(invoice.total_amount)}

Notas: ${invoice.notes || 'N/A'}
      `.trim();

      // Create a Blob and download
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Factura_${invoice.invoice_number}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('Error al descargar la factura');
    }
  };

  const generateInvoiceHTML = () => {
    if (!invoice) return '';

    const items = invoice.items || [];
    const subtotal = invoice.subtotal || 0;
    const ivaAmount = invoice.iva_amount || 0;
    const totalAmount = invoice.total_with_taxes || invoice.total_amount || 0;

    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Factura ${invoice.invoice_number}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; background: #f9fafb; }
    .container { max-width: 600px; margin: 0 auto; padding: 32px 16px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 32px; border-radius: 16px 16px 0 0; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
    .header .invoice-number { margin-top: 8px; font-size: 18px; opacity: 0.95; }
    .content { background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 14px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .info-item label { font-size: 12px; color: #6b7280; display: block; margin-bottom: 4px; }
    .info-item span { font-size: 14px; font-weight: 500; color: #1f2937; }
    .items-table { width: 100%; border-collapse: collapse; margin: 24px 0; }
    .items-table th { background: #f3f4f6; padding: 12px 8px; text-align: left; font-size: 12px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; }
    .items-table td { padding: 12px 8px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
    .items-table tr:last-child td { border-bottom: none; }
    .items-table .text-right { text-align: right; }
    .totals { display: flex; flex-direction: column; gap: 12px; align-items: flex-end; margin-top: 24px; padding-top: 24px; border-top: 2px solid #e5e7eb; }
    .total-row { display: flex; justify-content: space-between; width: 200px; }
    .total-row span:first-child { color: #6b7280; font-size: 14px; }
    .total-row span:last-child { font-weight: 500; color: #1f2937; font-size: 14px; }
    .total-row.grand-total { font-weight: 700; font-size: 18px; color: #667eea; }
    .footer { text-align: center; margin-top: 32px; padding-top: 32px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
    .badge { display: inline-block; padding: 4px 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 9999px; font-size: 12px; font-weight: 600; margin-top: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Factura Electrónica</h1>
      <div class="invoice-number">#${invoice.invoice_number || 'N/A'}</div>
      <div class="badge">${invoice.status || 'Factura'}</div>
    </div>

    <div class="content">
      <div class="info-grid">
        <div>
          <div class="section-title">Cliente</div>
          <div class="info-item">
            <label>Nombre</label>
            <span>${invoice.customer_name || invoice.customer?.name || 'N/A'}</span>
          </div>
          ${invoice.customer?.email ? `
          <div class="info-item" style="margin-top: 8px;">
            <label>Email</label>
            <span>${invoice.customer.email}</span>
          </div>
          ` : ''}
        </div>
        <div>
          <div class="section-title">Factura</div>
          <div class="info-item">
            <label>Fecha</label>
            <span>${formatDate(invoice.date, 'long')}</span>
          </div>
          <div class="info-item" style="margin-top: 8px;">
            <label>Vencimiento</label>
            <span>${invoice.due_date ? formatDate(invoice.due_date, 'long') : 'N/A'}</span>
          </div>
        </div>
      </div>

      ${items.length > 0 ? `
      <table class="items-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th class="text-right">Cantidad</th>
            <th class="text-right">Precio Unit.</th>
            <th class="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
          <tr>
            <td>${item.product?.name || 'Producto'}</td>
            <td class="text-right">${item.quantity}</td>
            <td class="text-right">${formatCurrency(item.price_per_unit || 0)}</td>
            <td class="text-right">${formatCurrency((item.quantity || 0) * (item.price_per_unit || 0))}</td>
          </tr>
          `).join('')}
        </tbody>
      </table>
      ` : ''}

      <div class="totals">
        <div class="total-row">
          <span>Subtotal</span>
          <span>${formatCurrency(subtotal)}</span>
        </div>
        ${ivaAmount > 0 ? `
        <div class="total-row">
          <span>IVA (16%)</span>
          <span>${formatCurrency(ivaAmount)}</span>
        </div>
        ` : ''}
        <div class="total-row grand-total">
          <span>Total</span>
          <span>${formatCurrency(totalAmount)}</span>
        </div>
      </div>

      <div class="footer">
        <p>Gracias por su compra</p>
        <p style="margin-top: 8px;">Para cualquier consulta, contacte con nosotros</p>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim();
  };

  const handleSendEmail = async () => {
    if (!invoice || !invoice.customer?.email) {
      setError('El cliente no tiene email configurado');
      return;
    }

    setSendingEmail(true);
    setError(null);
    setEmailSuccess(false);

    try {
      const response = await fetch('/api/send-invoice-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: invoice.customer.email,
          subject: `Factura ${invoice.invoice_number || 'N/A'}`,
          invoiceNumber: invoice.invoice_number,
          invoiceHtml: generateInvoiceHTML()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar el email');
      }

      setEmailSuccess(true);
      setTimeout(() => setEmailSuccess(false), 5000);
    } catch (err: any) {
      setError(err.message || 'Error al enviar el email');
      setTimeout(() => setError(null), 5000);
    } finally {
      setSendingEmail(false);
    }
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
              <p className="text-gray-500 font-light">
                Creado: {formatDate(invoice.created_at)}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowPDFPreview(true)}
              className="p-3 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-colors"
              title="Vista previa PDF (SENIAT)"
            >
              <Eye className="w-5 h-5" />
            </button>
            <button
              onClick={handlePrint}
              className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-2xl transition-colors"
              title="Imprimir factura"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button
              onClick={handleDownloadPDF}
              className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-2xl transition-colors"
              title="Descargar factura"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={handleSendEmail}
              disabled={sendingEmail}
              className={`p-3 rounded-2xl transition-all ${
                emailSuccess
                  ? 'text-green-600 bg-green-50'
                  : sendingEmail
                  ? 'text-gray-400 bg-gray-100'
                  : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
              }`}
              title={emailSuccess ? 'Email enviado' : sendingEmail ? 'Enviando...' : 'Enviar por email'}
            >
              {sendingEmail ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : emailSuccess ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <Send className="w-5 h-5" />
              )}
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
                    {formatDate(invoice.date, 'long')}
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
                      <span className="text-gray-900 font-medium">{invoice.customer_name || invoice.customer?.name || '-'}</span>
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

                {/* Venezuela SENIAT Info */}
                {(invoice.transaction_type || invoice.payment_method || invoice.control_number) && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-4">Venezuela SENIAT</h3>
                    <div className="space-y-3">
                      {invoice.control_number && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 text-xs">Nro. Control</span>
                          <span className="font-medium text-gray-900">{invoice.control_number}</span>
                        </div>
                      )}
                      {invoice.transaction_type && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 text-xs">Tipo Transacción</span>
                          <span className="font-medium text-gray-900 capitalize">{invoice.transaction_type}</span>
                        </div>
                      )}
                      {invoice.payment_method && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 text-xs">Forma de Pago</span>
                          <span className="font-medium text-gray-900 capitalize">
                            {invoice.payment_method.replace('_', ' ')}
                          </span>
                        </div>
                      )}
                      {invoice.transaction_type === 'credito' && (invoice.credit_days || 0) > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 text-xs">Días Crédito</span>
                          <span className="font-medium text-gray-900">{invoice.credit_days}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-4">Información de Pago</h3>
                  <div className="space-y-3">
                    {(invoice.taxable_base || 0) > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 text-xs">Base Imponible</span>
                        <span className="font-medium text-gray-900">{formatCurrency(invoice.taxable_base)}</span>
                      </div>
                    )}
                    {(invoice.exempt_amount || 0) > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-green-600 text-xs">Monto Exento</span>
                        <span className="font-medium text-green-700">{formatCurrency(invoice.exempt_amount)}</span>
                      </div>
                    )}
                    {(invoice.iva_amount || 0) > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 text-xs">IVA ({invoice.iva_percentage || 16}%)</span>
                        <span className="font-medium text-gray-900">{formatCurrency(invoice.iva_amount)}</span>
                      </div>
                    )}
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
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">{item.product_name}</p>
                            {item.is_exempt && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">Exento</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">ID: {item.product_id}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="py-4 px-6 text-right text-gray-900">
                        {formatCurrency(item.price_per_unit)}
                      </td>
                      <td className="py-4 px-6 text-right text-gray-900">
                        {item.is_exempt ? (
                          <span className="text-green-600">Exento</span>
                        ) : (
                          `${item.tax_rate || 0}%`
                        )}
                      </td>
                      <td className="py-4 px-6 text-right font-medium text-gray-900">
                        {formatCurrency(item.quantity * item.price_per_unit)}
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
          {/* Payment Info Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 overflow-hidden sticky top-8">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-light text-gray-900">Información de Pago</h3>
            </div>
            <div className="p-6">
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
                {(invoice.taxable_base || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base Imponible</span>
                    <span className="font-medium text-gray-900">{formatCurrency(invoice.taxable_base)}</span>
                  </div>
                )}
                {(invoice.exempt_amount || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-green-600">Monto Exento</span>
                    <span className="font-medium text-green-700">{formatCurrency(invoice.exempt_amount)}</span>
                  </div>
                )}
                {(invoice.iva_amount || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">IVA ({invoice.iva_percentage || 16}%)</span>
                    <span className="font-medium text-gray-900">{formatCurrency(invoice.iva_amount)}</span>
                  </div>
                )}
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
              <button
                onClick={handlePrint}
                className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-[1.02] shadow-lg"
              >
                <Printer className="w-4 h-4 mr-3" />
                <span className="font-light">Imprimir</span>
              </button>
              <button
                onClick={handleSendEmail}
                className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-[1.02] shadow-lg"
              >
                <Send className="w-4 h-4 mr-3" />
                <span className="font-light">Enviar por Email</span>
              </button>
              <button
                onClick={handleDownloadPDF}
                className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl hover:from-purple-600 hover:to-purple-700 transition-all transform hover:scale-[1.02] shadow-lg"
              >
                <Download className="w-4 h-4 mr-3" />
                <span className="font-light">Descargar</span>
              </button>
              <Link
                href={`/invoices/${invoice.id}/edit`}
                className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl hover:from-orange-600 hover:to-orange-700 transition-all transform hover:scale-[1.02] shadow-lg"
              >
                <Edit className="w-4 h-4 mr-3" />
                <span className="font-light">Editar Factura</span>
              </Link>
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

      {/* PDF Preview Modal - Venezuela SENIAT Format */}
      {showPDFPreview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-light text-gray-900">Vista Previa - Formato SENIAT</h2>
              <button
                onClick={() => setShowPDFPreview(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* PDF Preview Content */}
            <div className="p-8 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
              <div className="bg-white border-2 border-gray-300 p-8 font-mono text-sm" style={{ width: '210mm', minHeight: '297mm' }}>
                {/* Header SENIAT */}
                <div className="text-center border-b-2 border-black pb-4 mb-6">
                  <h1 className="text-xl font-bold uppercase">Factura de Venta</h1>
                  <p className="text-xs mt-2">FORMATO SENIAT VENEZUELA</p>
                </div>

                {/* Company Info */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="font-bold">RIF: J-XXXXXXXX-X</p>
                    <p className="text-xs">Nombre de la Empresa</p>
                    <p className="text-xs">Dirección Fiscal</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">Nro. Factura: {invoice.invoice_number}</p>
                    <p className="text-xs">Nro. Control: {invoice.control_number || 'Pendiente'}</p>
                    <p className="text-xs">Fecha: {formatDate(invoice.date, 'long')}</p>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="mb-6 p-3 bg-gray-50 border border-gray-300">
                  <p className="font-bold mb-2">CLIENTE:</p>
                  <p className="text-xs">Nombre: {invoice.customer?.name || invoice.customer_name || '-'}</p>
                  <p className="text-xs">RIF/C.I: {invoice.customer?.tax_id || 'Pendiente'}</p>
                  <p className="text-xs">Dirección: {invoice.customer_address || invoice.customer?.address || '-'}</p>
                  <p className="text-xs">Teléfono: {invoice.customer_phone || invoice.customer?.phone || '-'}</p>
                </div>

                {/* Transaction Info */}
                <div className="mb-6 grid grid-cols-3 gap-4 text-xs">
                  <div className="p-2 border border-gray-300">
                    <p className="font-bold">Tipo Transacción:</p>
                    <p className="capitalize">{invoice.transaction_type || 'Contado'}</p>
                  </div>
                  <div className="p-2 border border-gray-300">
                    <p className="font-bold">Forma de Pago:</p>
                    <p className="capitalize">{invoice.payment_method?.replace('_', ' ') || 'Efectivo'}</p>
                  </div>
                  {invoice.transaction_type === 'credito' && (
                    <div className="p-2 border border-gray-300">
                      <p className="font-bold">Días Crédito:</p>
                      <p>{invoice.credit_days || 0}</p>
                    </div>
                  )}
                </div>

                {/* Items Table */}
                <table className="w-full mb-6 text-xs">
                  <thead>
                    <tr className="border-b-2 border-black">
                      <th className="text-left py-2">CANT</th>
                      <th className="text-left py-2">DESCRIPCIÓN</th>
                      <th className="text-right py-2">P. UNITARIO</th>
                      <th className="text-right py-2">ALIQUOTA</th>
                      <th className="text-right py-2">MONTO IVA</th>
                      <th className="text-right py-2">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items?.map((item, index) => (
                      <tr key={index} className="border-b border-gray-300">
                        <td className="py-2 text-center">{item.quantity}</td>
                        <td className="py-2">{item.product_name}</td>
                        <td className="py-2 text-right">{formatCurrency(item.price_per_unit)}</td>
                        <td className="py-2 text-center">
                          {item.is_exempt ? 'EXENTO' : `${item.tax_rate || 0}%`}
                        </td>
                        <td className="py-2 text-right">
                          {item.is_exempt ? '0,00' : formatCurrency((item.quantity * item.price_per_unit) * ((item.tax_rate || 0) / 100))}
                        </td>
                        <td className="py-2 text-right">
                          {formatCurrency(item.quantity * item.price_per_unit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals */}
                <div className="grid grid-cols-2 gap-6 text-xs">
                  <div className="space-y-2">
                    {(invoice.taxable_base || 0) > 0 && (
                      <div className="flex justify-between border-b border-gray-300 pb-1">
                        <span>Base Imponible:</span>
                        <span className="font-bold">{formatCurrency(invoice.taxable_base)}</span>
                      </div>
                    )}
                    {(invoice.exempt_amount || 0) > 0 && (
                      <div className="flex justify-between border-b border-gray-300 pb-1 text-green-700">
                        <span>Monto Exento:</span>
                        <span className="font-bold">{formatCurrency(invoice.exempt_amount)}</span>
                      </div>
                    )}
                    {(invoice.iva_amount || 0) > 0 && (
                      <div className="flex justify-between border-b border-gray-300 pb-1">
                        <span>IVA ({invoice.iva_percentage || 16}%):</span>
                        <span className="font-bold">{formatCurrency(invoice.iva_amount)}</span>
                      </div>
                    )}
                  </div>
                  <div className="border-2 border-black p-4">
                    <div className="flex justify-between text-lg">
                      <span className="font-bold">TOTAL:</span>
                      <span className="font-bold">{formatCurrency(invoice.total_amount)}</span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-8 pt-4 border-t-2 border-black text-center text-xs">
                  <p className="mb-2">___________________________</p>
                  <p>Firma del Cliente</p>
                  <p className="mt-4 text-gray-600">Esta factura cumple con los requisitos del SENIAT</p>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowPDFPreview(false)}
                className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-100"
              >
                Cerrar
              </button>
              <button
                onClick={handlePrint}
                className="px-6 py-3 text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl hover:from-blue-600 hover:to-blue-700"
              >
                <Printer className="w-4 h-4 mr-2 inline" />
                Imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceDetailPage;