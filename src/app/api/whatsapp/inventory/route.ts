import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const companyIdentifier = searchParams.get('company') // Puede ser ID, email, tax_id o nombre
    const productSkus = searchParams.get('products') // SKUs separados por coma
    const token = searchParams.get('token') // Token de seguridad simple

    // Validación básica de seguridad
    if (token !== 'whatsapp_agent_2024') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!companyIdentifier) {
      return NextResponse.json({ error: 'Company identifier required' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Buscar la compañía por diferentes campos
    let companyId = null
    const companySearch = await supabase
      .from('companies')
      .select('id, name, email, tax_id')
      .or(`email.eq.${companyIdentifier},tax_id.eq.${companyIdentifier},name.ilike.%${companyIdentifier}%,id.eq.${companyIdentifier}`)
      .limit(1)

    if (companySearch.data && companySearch.data.length > 0) {
      companyId = companySearch.data[0].id
    }

    if (!companyId) {
      // Si es número directo, intentar usar como ID
      const numericId = parseInt(companyIdentifier)
      if (!isNaN(numericId)) {
        companyId = numericId
      }
    }

    if (!companyId) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Construir query de productos
    let productsQuery = supabase
      .from('products')
      .select('sku, name, stock_quantity, minimal_stock, quantity, status, category:categories(name), warehouse:warehouses(name, location)')
      .eq('company_id', companyId)

    // Filtrar por SKUs específicos si se proporcionan
    if (productSkus) {
      const skuArray = productSkus.split(',').map(s => s.trim().toUpperCase())
      productsQuery = productsQuery.in('sku', skuArray)
    }

    const { data: products, error: productsError } = await productsQuery

    if (productsError) {
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Formatear respuesta para WhatsApp
    const companyInfo = companySearch.data?.[0] || { name: `Company ${companyId}` }

    const formattedProducts = products?.map(product => ({
      sku: product.sku,
      nombre: product.name,
      stock: product.stock_quantity || 0,
      stock_minimo: product.minimal_stock || 0,
      estado: (product.stock_quantity || 0) <= (product.minimal_stock || 0) ? 'BAJO STOCK' : 'DISPONIBLE',
      categoria: product.category?.name || 'N/A',
      almacen: product.warehouse?.name || 'N/A',
      ubicacion: product.warehouse?.location || 'N/A'
    })) || []

    return NextResponse.json({
      compañia: companyInfo.name,
      identificador: companyIdentifier,
      total_productos: formattedProducts.length,
      productos: formattedProducts
    })

  } catch (error) {
    console.error('WhatsApp inventory API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { company, products: productSkus, token } = body

    // Validación de seguridad
    if (token !== 'whatsapp_agent_2024') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Buscar compañía
    let companyId = null
    const companySearch = await supabase
      .from('companies')
      .select('id, name, email, tax_id')
      .or(`email.eq.${company},tax_id.eq.${company},name.ilike.%${company}%,id.eq.${company}`)
      .limit(1)

    if (companySearch.data && companySearch.data.length > 0) {
      companyId = companySearch.data[0].id
    }

    if (!companyId) {
      const numericId = parseInt(company)
      if (!isNaN(numericId)) {
        companyId = numericId
      }
    }

    if (!companyId) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Buscar productos
    let productsQuery = supabase
      .from('products')
      .select('sku, name, stock_quantity, minimal_stock, quantity, status, category:categories(name), warehouse:warehouses(name, location)')
      .eq('company_id', companyId)

    if (productSkus && Array.isArray(productSkus)) {
      const skuArray = productSkus.map(s => s.trim().toUpperCase())
      productsQuery = productsQuery.in('sku', skuArray)
    }

    const { data: products, error: productsError } = await productsQuery

    if (productsError) {
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    const companyInfo = companySearch.data?.[0] || { name: `Company ${companyId}` }

    const formattedProducts = products?.map(product => ({
      sku: product.sku,
      nombre: product.name,
      stock: product.stock_quantity || 0,
      estado: (product.stock_quantity || 0) <= (product.minimal_stock || 0) ? '🔴 BAJO STOCK' : '🟢 DISPONIBLE',
      categoria: product.category?.name || 'N/A',
      almacen: product.warehouse?.name || 'N/A'
    })) || []

    return NextResponse.json({
      compañia: companyInfo.name,
      fecha: new Date().toISOString(),
      productos: formattedProducts
    })

  } catch (error) {
    console.error('WhatsApp inventory POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
