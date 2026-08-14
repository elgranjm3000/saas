'use client'
import React, { useState } from 'react';
import {
  CheckCircle,
  Copy,
  Mail,
  Printer,
  Download,
  MoreVertical,
  X,
  Loader2
} from 'lucide-react';
import { invoicesAPI } from '@/lib/api';
import { useToast } from '@/hooks/useToast';

interface InvoiceQuickActionsProps {
  invoiceId: number;
  invoiceNumber: string;
  status: string;
  onStatusChange?: () => void;
  onDuplicate?: () => void;
}

export const InvoiceQuickActions: React.FC<InvoiceQuickActionsProps> = ({
  invoiceId,
  invoiceNumber,
  status,
  onStatusChange,
  onDuplicate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const toast = useToast();

  const handleMarkAsPaid = async () => {
    setLoading('mark_paid');
    try {
      await invoicesAPI.update(invoiceId, { status: 'pagada' });
      toast.success('Factura marcada como pagada', `${invoiceNumber} está ahora pagada`);
      onStatusChange?.();
      setIsOpen(false);
    } catch (error) {
      toast.error('Error', 'No se pudo marcar la factura como pagada');
    } finally {
      setLoading(null);
    }
  };

  const handleDuplicate = async () => {
    setLoading('duplicate');
    try {
      // Aquí podrías implementar la lógica de duplicación
      toast.info('Duplicar', 'Función de duplicar próximamente');
      onDuplicate?.();
      setIsOpen(false);
    } catch (error) {
      toast.error('Error', 'No se pudo duplicar la factura');
    } finally {
      setLoading(null);
    }
  };

  const handleSendEmail = async () => {
    setLoading('email');
    try {
      // Aquí podrías implementar el envío de email
      toast.info('Enviar por email', 'Función de email próximamente');
      setIsOpen(false);
    } catch (error) {
      toast.error('Error', 'No se pudo enviar el email');
    } finally {
      setLoading(null);
    }
  };

  const handlePrint = () => {
    window.print();
    setIsOpen(false);
  };

  const handleDownloadPDF = async () => {
    setLoading('pdf');
    try {
      // Aquí podrías implementar la generación de PDF
      toast.info('Descargar PDF', 'Función de PDF próximamente');
      setIsOpen(false);
    } catch (error) {
      toast.error('Error', 'No se pudo generar el PDF');
    } finally {
      setLoading(null);
    }
  };

  const actions = [
    {
      id: 'mark_paid',
      icon: CheckCircle,
      label: 'Marcar como Pagada',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      hoverColor: 'hover:bg-green-100',
      show: status !== 'pagada',
      onClick: handleMarkAsPaid
    },
    {
      id: 'duplicate',
      icon: Copy,
      label: 'Duplicar Factura',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      hoverColor: 'hover:bg-blue-100',
      show: true,
      onClick: handleDuplicate
    },
    {
      id: 'email',
      icon: Mail,
      label: 'Enviar por Email',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      hoverColor: 'hover:bg-purple-100',
      show: true,
      onClick: handleSendEmail
    },
    {
      id: 'print',
      icon: Printer,
      label: 'Imprimir',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      hoverColor: 'hover:bg-gray-100',
      show: true,
      onClick: handlePrint
    },
    {
      id: 'pdf',
      icon: Download,
      label: 'Descargar PDF',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      hoverColor: 'hover:bg-red-100',
      show: true,
      onClick: handleDownloadPDF
    }
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
        title="Acciones rápidas"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-1 w-56 bg-white/95 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-xl z-20">
            <div className="p-2">
              {actions
                .filter(action => action.show)
                .map((action) => (
                  <button
                    key={action.id}
                    onClick={action.onClick}
                    disabled={loading !== null}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all ${
                      action.bgColor
                    } ${action.hoverColor} ${
                      loading !== null ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {loading === action.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <action.icon className={`w-4 h-4 ${action.color}`} />
                    )}
                    <span className="text-sm font-medium text-gray-900">
                      {action.label}
                    </span>
                  </button>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
