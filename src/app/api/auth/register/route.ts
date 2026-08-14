import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      company_name,
      legal_name,
      tax_id,
      admin_email,
      admin_password,
      admin_username,
    } = body

    if (!company_name || !legal_name || !tax_id || !admin_email || !admin_password) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos (empresa, nombre legal, RIF, email y contraseña)' },
        { status: 400 }
      )
    }

    const admin = createAdminClient()

    // 1. Crear el usuario en Supabase Auth (email confirmado, sin verificación)
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: admin_email,
      password: admin_password,
      email_confirm: true,
    })

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || 'Error creando el usuario' },
        { status: 400 }
      )
    }

    const authUserId = authData.user.id
    const username = admin_username || admin_email.split('@')[0]

    // 2. Crear empresa + moneda/unidad por defecto + usuario admin (RPC security definer)
    const { data: reg, error: regError } = await admin.rpc('register_company', {
      p_name: company_name,
      p_legal_name: legal_name,
      p_tax_id: tax_id,
      p_admin_auth_id: authUserId,
      p_admin_username: username,
      p_admin_email: admin_email,
      p_admin_role: 'admin',
      p_currency_code: 'USD',
    })

    if (regError) {
      // Rollback: eliminar el usuario de auth recién creado
      await admin.auth.admin.deleteUser(authUserId)
      return NextResponse.json({ error: regError.message }, { status: 400 })
    }

    const company_id = (reg as { company_id: number }).company_id

    // 3. Fijar app_metadata con el company_id para que RLS aísle al tenant
    const { error: metaError } = await admin.auth.admin.updateUserById(authUserId, {
      app_metadata: { company_id, role: 'admin', is_company_admin: true },
    })

    if (metaError) {
      return NextResponse.json({ error: metaError.message }, { status: 500 })
    }

    return NextResponse.json({
      company_id,
      base_currency_id: (reg as { base_currency_id: number }).base_currency_id,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error interno' }, { status: 500 })
  }
}
