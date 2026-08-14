'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import InvoiceForm from '@/components/forms/invoice-form';

const NewInvoicePage = () => {
  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-6">
          <Link
            href="/invoices"
            className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-2xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-light text-gray-900 mb-2">
              💵 Nueva Factura (Sistema REF)
            </h1>
            <p className="text-gray-500 font-light">
              Crear factura con sistema de precios de referencia (USD → VES)
            </p>
          </div>
        </div>
      </div>

      {/* Invoice Form con Preview de Conversión */}
      <InvoiceForm
        onSuccess={() => {
          // Redireccionar a la lista de facturas después de crear
          window.location.href = '/invoices';
        }}
        onCancel={() => {
          window.location.href = '/invoices';
        }}
      />
    </div>
  );
};

export default NewInvoicePage;
