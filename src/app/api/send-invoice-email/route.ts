import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { to, subject, invoiceHtml, invoiceNumber } = await request.json();

    if (!to || !invoiceHtml) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: email y contenido de factura' },
        { status: 400 }
      );
    }

    console.log('📧 Enviando factura por email:', { to, invoiceNumber });

    const result = await resend.emails.send({
      from: 'erp@sistema.com',
      to: to,
      subject: subject || `Factura #${invoiceNumber || 'N/A'}`,
      html: invoiceHtml
    });

    console.log('✅ Email enviado:', result);

    return NextResponse.json({
      success: true,
      message: 'Factura enviada por email',
      result
    });

  } catch (error: any) {
    console.error('❌ Error enviando email:', error);
    return NextResponse.json(
      { error: error.message || 'Error al enviar el email' },
      { status: 500 }
    );
  }
}
