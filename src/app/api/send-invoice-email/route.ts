import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { to, subject, invoiceHtml, invoiceNumber } = await request.json();

    if (!to || !invoiceHtml) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: email y contenido de factura' },
        { status: 400 }
      );
    }

    // Verificar API key
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return NextResponse.json(
        { error: 'RESEND_API_KEY no está configurada' },
        { status: 500 }
      );
    }

    // Importar Resend solo cuando se necesita (lazy loading)
    const { Resend } = await import('resend');
    const resend = new Resend(resendApiKey);

    console.log('📧 Enviando factura por email:', { to, invoiceNumber });

    const result = await resend.emails.send({
      from: 'onboarding@resend.dev',
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
