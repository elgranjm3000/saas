import { createClient } from '@/lib/supabase/client'

// Capa de datos migrada de FastAPI (axios) a Supabase.
// Los métodos devuelven { data, error } como lo hace el cliente Supabase, de
// modo que el patrón existente `const res = await xAPI.y(); res.data` siga
// funcionando. company_id se inyecta en base de datos (trg_*_set_company).

let _client: ReturnType<typeof createClient> | null = null
function db() {
  if (!_client) _client = createClient()
  return _client
}

function range(params?: { skip?: number; limit?: number }) {
  const skip = params?.skip ?? 0
  const limit = params?.limit ?? 1000
  return { from: skip, to: skip + limit - 1 }
}

function notMigrated(name: string) {
  return async () => {
    throw new Error(`[Supabase] "${name}" aún no está migrado desde FastAPI`)
  }
}

async function resolveCurrencyId(code: string): Promise<number | null> {
  const { data } = await db()
    .from('currencies')
    .select('id')
    .eq('code', code.toUpperCase())
    .limit(1)
  return data?.[0]?.id ?? null
}

const round2 = (n: number) => Math.round(n * 100) / 100

async function getUsdVesRate(manualRate?: number): Promise<{ rate: number | null; source: string }> {
  if (manualRate != null) return { rate: manualRate, source: 'MANUAL' }
  const usdId = await resolveCurrencyId('USD')
  const vesId = await resolveCurrencyId('VES')
  if (!usdId || !vesId) return { rate: null, source: 'BCV' }
  const { data } = await db()
    .from('daily_rates')
    .select('*')
    .eq('base_currency_id', usdId)
    .eq('target_currency_id', vesId)
    .order('rate_date', { ascending: false })
    .limit(1)
    .maybeSingle()
  return { rate: data?.exchange_rate ?? null, source: data?.source ?? 'BCV' }
}

// =============================================
// 👥 AUTH / USERS
// =============================================
export const authAPI = {
  login: notMigrated('authAPI.login (usa signIn del store)'),
  loginLegacy: notMigrated('authAPI.loginLegacy'),
  registerCompany: notMigrated('authAPI.registerCompany (usa /api/auth/register)'),
  checkCompanyTaxId: notMigrated('authAPI.checkCompanyTaxId'),
  checkUsername: notMigrated('authAPI.checkUsername'),
  createUser: notMigrated('authAPI.createUser'),

  getMe: async () => {
    const supabase = db()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return { data: null, error: { message: 'No autenticado' } }

    const { data: appUser, error } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', auth.user.id)
      .single()
    if (error || !appUser) return { data: null, error }

    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('id', appUser.company_id)
      .single()

    return { data: { ...appUser, company_name: company?.name ?? null }, error: null }
  },

  updateProfile: async (data: any) => {
    const supabase = db()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return { data: null, error: { message: 'No autenticado' } }

    const profile: Record<string, any> = {}
    if (data.username !== undefined) profile.username = data.username
    if (data.full_name !== undefined) profile.full_name = data.full_name
    if (data.phone !== undefined) profile.phone = data.phone
    if (data.address !== undefined) profile.address = data.address

    if (Object.keys(profile).length) {
      const { error } = await supabase.from('users').update(profile).eq('auth_id', auth.user.id)
      if (error) return { data: null, error }
    }

    if (data.email && data.email !== auth.user.email) {
      await supabase.auth.updateUser({ email: data.email })
    }

    return authAPI.getMe()
  },
}

// =============================================
// 📦 PRODUCTS
// =============================================
export const productsAPI = {
  getAll: (params?: { skip?: number; limit?: number }) => {
    const { from, to } = range(params)
    return db()
      .from('products')
      .select('*, category:categories(id, name)')
      .order('id', { ascending: false })
      .range(from, to)
  },

  getById: (id: number) =>
    db().from('products').select('*, category:categories(id, name)').eq('id', id).single(),

  create: async (data: any) => {
    // Extraer warehouse_id si existe para crear la relación después
    const { warehouse_id, stock_quantity, min_stock, ...productData } = data;

    // Insertar el producto
    const { data: product, error } = await db()
      .from('products')
      .insert(productData)
      .select()
      .single();

    if (error) throw error;
    if (!product) throw new Error('No se pudo crear el producto');

    // Si se proporcionó warehouse_id, crear la relación en warehouse_products
    if (warehouse_id) {
      const warehouseProductData = {
        warehouse_id: parseInt(warehouse_id),
        product_id: product.id,
        stock: stock_quantity || 0,
        min_stock: min_stock || 10,
        max_stock: 100,
        is_active: true
      };

      const { error: wpError } = await db()
        .from('warehouse_products')
        .insert(warehouseProductData);

      if (wpError) {
        console.warn('No se pudo crear la relación warehouse_products:', wpError);
        // No fallamos la creación del producto por esto, pero advertimos
      }
    }

    return { data: product, error: null };
  },

  update: async (id: number, data: any) => {
    // Extraer warehouse_id si existe para actualizar la relación
    const { warehouse_id, stock_quantity, min_stock, ...productData } = data;

    // Actualizar el producto
    const { data: product, error } = await db()
      .from('products')
      .update(productData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!product) throw new Error('No se pudo actualizar el producto');

    // Si se proporcionó warehouse_id, actualizar o crear la relación en warehouse_products
    if (warehouse_id !== undefined) {
      const warehouseProductData = {
        warehouse_id: parseInt(warehouse_id),
        product_id: id,
        stock: stock_quantity || 0,
        min_stock: min_stock || 10,
        max_stock: 100,
        is_active: true
      };

      // Intentar actualizar primero
      const { data: existingWP } = await db()
        .from('warehouse_products')
        .select('*')
        .eq('warehouse_id', warehouse_id)
        .eq('product_id', id)
        .single();

      if (existingWP) {
        // Actualizar relación existente
        await db()
          .from('warehouse_products')
          .update(warehouseProductData)
          .eq('warehouse_id', warehouse_id)
          .eq('product_id', id);
      } else {
        // Crear nueva relación
        await db()
          .from('warehouse_products')
          .insert(warehouseProductData);
      }
    }

    return { data: product, error: null };
  },

  delete: (id: number) => db().from('products').delete().eq('id', id),

  search: (q: string) =>
    db().from('products').select('*, category:categories(id, name)').ilike('name', `%${q}%`),

  getLowStock: (threshold?: number) =>
    db().from('products').select('*').lte('quantity', threshold ?? 10),

  getSummary: async () => {
    const { count, error } = await db()
      .from('products')
      .select('*', { count: 'exact', head: true })
    return { data: { total: count ?? 0 }, error }
  },

  bulkUpdate: async (updates: any[]) => {
    const supabase = db()
    const results = []
    for (const u of updates) {
      const { data, error } = await supabase.from('products').update(u).eq('id', u.id).select().single()
      if (error) return { data: null, error }
      results.push(data)
    }
    return { data: results, error: null }
  },

  getInventoryMovements: (productId: number) =>
    db().from('inventory_movements').select('*').eq('product_id', productId),

  getByCategory: (categoryId: number) =>
    db().from('products').select('*').eq('category_id', categoryId),
}

// =============================================
// 📄 INVOICES
// =============================================
export const invoicesAPI = {
  getAll: (params?: { skip?: number; limit?: number; status?: string }) => {
    let q = db().from('invoices').select('*').order('id', { ascending: false })
    if (params?.status) q = q.eq('status', params.status)
    const { from, to } = range(params)
    return q.range(from, to)
  },

  getById: (id: number) =>
    db().from('invoices').select('*, items:invoice_items(*)').eq('id', id).single(),

  create: async (data: any) => {
    const { items, ...invoiceData } = data;

    // 1. Insertar la factura (sin items)
    const { data: invoice, error } = await db()
      .from('invoices')
      .insert(invoiceData)
      .select()
      .single();

    if (error) throw error;
    if (!invoice) throw new Error('No se pudo crear la factura');

    // 2. Insertar los items en invoice_items
    if (items && items.length > 0) {
      const itemsToInsert = items.map((item: any) => {
        const qty = Number(item.quantity) || 0;
        const price = Number(item.price_per_unit) || 0;
        const taxRate = item.is_exempt ? 0 : (item.tax_rate ?? 16);

        return {
          invoice_id: invoice.id,
          product_id: Number(item.product_id),
          quantity: qty,
          price_per_unit: price,
          total_price: qty * price,
          tax_rate: taxRate,
          tax_amount: item.is_exempt ? 0 : (qty * price * taxRate / 100),
          is_exempt: item.is_exempt ?? false,
          base_currency_amount: item.base_currency_amount ?? (qty * price),
          currency_id: item.currency_id ?? null,
          exchange_rate: item.exchange_rate ?? null,
          exchange_rate_date: item.exchange_rate_date ?? null
        };
      });

      const { error: itemsError } = await db()
        .from('invoice_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;
    }

    return { data: invoice, error: null };
  },

  update: (id: number, data: any) =>
    db().from('invoices').update(data).eq('id', id).select().single(),

  delete: (id: number) => db().from('invoices').delete().eq('id', id),

  getSummary: notMigrated('invoicesAPI.getSummary'),
  getPending: (params?: { skip?: number; limit?: number }) => {
    const { from, to } = range(params)
    return db().from('invoices').select('*').eq('status', 'pendiente').range(from, to)
  },
  createCreditMovement: (invoiceId: number, data: any) =>
    db().from('credit_movements').insert({ ...data, invoice_id: invoiceId }).select().single(),

  preview: notMigrated('invoicesAPI.preview'),
}

// =============================================
// 💰 BUDGETS
// =============================================
export const budgetsAPI = {
  create: notMigrated('budgetsAPI.create'),
  confirm: notMigrated('budgetsAPI.confirm'),
}

// =============================================
// 🛒 PURCHASES
// =============================================
export const purchasesAPI = {
  getAll: (params?: { skip?: number; limit?: number; status?: string }) => {
    let q = db()
      .from('purchases')
      .select('*, items:purchase_items(*), supplier:suppliers(*)')
      .order('id', { ascending: false })
    if (params?.status) q = q.eq('status', params.status)
    const { from, to } = range(params)
    return q.range(from, to)
  },

  getById: (id: number) =>
    db()
      .from('purchases')
      .select('*, items:purchase_items(*, product:products(id, name, sku)), supplier:suppliers(*)')
      .eq('id', id)
      .single(),

  create: async (data: any) => {
    const { items, ...purchaseData } = data;

    // 1. Insertar la compra (sin items)
    const { data: purchase, error } = await db()
      .from('purchases')
      .insert(purchaseData)
      .select()
      .single();

    if (error) throw error;
    if (!purchase) throw new Error('No se pudo crear la compra');

    // 2. Insertar los items en purchase_items
    if (items && items.length > 0) {
      const itemsToInsert = items.map((item: any) => {
        const qty = Number(item.quantity) || 0;
        const price = Number(item.price_per_unit) || 0;
        const taxRate = item.is_exempt ? 0 : (item.tax_rate ?? 16);

        return {
          purchase_id: purchase.id,
          product_id: Number(item.product_id),
          quantity: qty,
          price_per_unit: price,
          total_price: qty * price,
          tax_rate: taxRate,
          tax_amount: item.is_exempt ? 0 : (qty * price * taxRate / 100),
          is_exempt: item.is_exempt ?? false,
          base_currency_amount: item.base_currency_amount ?? (qty * price),
          currency_id: item.currency_id ?? null,
          exchange_rate: item.exchange_rate ?? null,
          exchange_rate_date: item.exchange_rate_date ?? null
        };
      });

      const { error: itemsError } = await db()
        .from('purchase_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;
    }

    return { data: purchase, error: null };
  },

  update: (id: number, data: any) =>
    db().from('purchases').update(data).eq('id', id).select().single(),

  delete: (id: number) => db().from('purchases').delete().eq('id', id),

  updateStatus: (id: number, status: string) =>
    db().from('purchases').update({ status }).eq('id', id).select().single(),

  getSummary: notMigrated('purchasesAPI.getSummary'),

  getPending: (params?: { skip?: number; limit?: number }) => {
    const { from, to } = range(params)
    return db().from('purchases').select('*').eq('status', 'pending').range(from, to)
  },

  createCreditNote: (purchaseId: number, data: any) =>
    db().from('purchase_credit_movements').insert({ ...data, purchase_id: purchaseId }).select().single(),

  getCreditNotes: (params?: { skip?: number; limit?: number }) => {
    const { from, to } = range(params)
    return db().from('purchase_credit_movements').select('*').range(from, to)
  },
}

// =============================================
// 🔄 INVENTORY MOVEMENTS
// =============================================
export const inventoryMovementsAPI = {
  getAll: (params?: { skip?: number; limit?: number; movement_type?: string; product_id?: number }) => {
    let q = db().from('inventory_movements').select('*')
    if (params?.movement_type) q = q.eq('movement_type', params.movement_type)
    if (params?.product_id) q = q.eq('product_id', params.product_id)
    const { from, to } = range(params)
    return q.range(from, to)
  },

  getById: (id: number) => db().from('inventory_movements').select('*').eq('id', id).single(),

  create: (data: any) => db().from('inventory_movements').insert(data).select().single(),

  getByProduct: (productId: number) =>
    db().from('inventory_movements').select('*').eq('product_id', productId),

  getByInvoice: (invoiceId: number) =>
    db().from('inventory_movements').select('*').eq('invoice_id', invoiceId),

  // 🆕 Movimiento manual de inventario (ajustes, mermas, conteos)
  createManualMovement: async (data: {
    company_id: number;
    warehouse_id: number;
    product_id: number;
    quantity: number;  // positivo para entrada, negativo para salida
    movement_type: 'ajuste' | 'merma' | 'conteo' | 'transferencia' | 'entrada' | 'salida';
    description: string;
    reference?: string;
    notes?: string;
  }) => {
    const { company_id, warehouse_id, product_id, quantity, movement_type, description, reference, notes } = data;

    // 1. Leer stock actual
    const { data: current } = await db()
      .from('warehouse_products')
      .select('stock')
      .eq('warehouse_id', warehouse_id)
      .eq('product_id', product_id)
      .maybeSingle();

    const currentStock = current?.stock ?? 0;
    const newStock = Math.max(0, currentStock + quantity);

    // 2. Actualizar stock en warehouse_products
    const { error: wpError } = await db()
      .from('warehouse_products')
      .upsert({
        company_id,
        warehouse_id,
        product_id,
        stock: newStock,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'warehouse_id,product_id'
      });

    if (wpError) {
      console.error('Error al actualizar stock:', wpError);
      return { data: null, error: wpError };
    }

    // 2. Registrar movimiento
    const { data: movement, error: moveError } = await db()
      .from('inventory_movements')
      .insert({
        company_id,
        warehouse_id,
        product_id,
        quantity,
        movement_type,
        description: reference ? `${description} (${reference})` : description,
        notes
      })
      .select()
      .single();

    if (moveError) {
      console.error('Error al registrar movimiento:', moveError);
      return { data: null, error: moveError };
    }

    return { data: movement, error: null };
  },

  // 🆕 Transferir stock entre almacenes
  transferStock: async (data: {
    company_id: number;
    from_warehouse_id: number;
    to_warehouse_id: number;
    product_id: number;
    quantity: number;
    notes?: string;
  }) => {
    const { company_id, from_warehouse_id, to_warehouse_id, product_id, quantity, notes } = data;

    try {
      // 1. Verificar stock suficiente en origen
      const { data: sourceStock } = await db()
        .from('warehouse_products')
        .select('stock')
        .eq('warehouse_id', from_warehouse_id)
        .eq('product_id', product_id)
        .single();

      if (!sourceStock || sourceStock.stock < quantity) {
        throw new Error(`Stock insuficiente. Disponible: ${sourceStock?.stock || 0}, Requerido: ${quantity}`);
      }

      // 2. Restar del almacén origen
      await db()
        .from('warehouse_products')
        .update({ stock: sourceStock.stock - quantity, updated_at: new Date().toISOString() })
        .eq('warehouse_id', from_warehouse_id)
        .eq('product_id', product_id);

      // 3. Leer stock destino y sumar
      const { data: destStock } = await db()
        .from('warehouse_products')
        .select('stock')
        .eq('warehouse_id', to_warehouse_id)
        .eq('product_id', product_id)
        .maybeSingle();

      const destCurrentStock = destStock?.stock ?? 0;

      await db()
        .from('warehouse_products')
        .upsert({
          company_id,
          warehouse_id: to_warehouse_id,
          product_id,
          stock: destCurrentStock + quantity,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'warehouse_id,product_id'
        });

      // 4. Registrar movimientos
      const { data: outMovement } = await db()
        .from('inventory_movements')
        .insert({
          company_id,
          warehouse_id: from_warehouse_id,
          product_id,
          quantity: -quantity,
          movement_type: 'transferencia',
          description: `Transferencia a almacén ${to_warehouse_id}`,
          notes
        })
        .select()
        .single();

      const { data: inMovement } = await db()
        .from('inventory_movements')
        .insert({
          company_id,
          warehouse_id: to_warehouse_id,
          product_id,
          quantity: quantity,
          movement_type: 'transferencia',
          description: `Transferencia desde almacén ${from_warehouse_id}`,
          notes
        })
        .select()
        .single();

      return {
        data: {
          out_movement: outMovement,
          in_movement: inMovement
        },
        error: null
      };
    } catch (error: any) {
      console.error('Error en transferencia:', error);
      return { data: null, error };
    }
  },

  // 🆕 Ajuste de stock (conteo físico)
  adjustStock: async (data: {
    company_id: number;
    warehouse_id: number;
    product_id: number;
    actual_quantity: number;
    reason: string;
    notes?: string;
  }) => {
    const { company_id, warehouse_id, product_id, actual_quantity, reason, notes } = data;

    // 1. Obtener stock actual
    const { data: current } = await db()
      .from('warehouse_products')
      .select('stock')
      .eq('warehouse_id', warehouse_id)
      .eq('product_id', product_id)
      .single();

    const currentStock = current?.stock || 0;
    const difference = actual_quantity - currentStock;

    if (difference === 0) {
      return { data: { message: 'El stock ya es correcto', difference: 0 }, error: null };
    }

    // 2. Actualizar stock
    await db()
      .from('warehouse_products')
      .upsert({
        company_id,
        warehouse_id,
        product_id,
        stock: actual_quantity,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'warehouse_id,product_id'
      });

    // 3. Registrar movimiento
    const { data: movement } = await db()
      .from('inventory_movements')
      .insert({
        company_id,
        warehouse_id,
        product_id,
        quantity: difference,
        movement_type: 'conteo',
        description: `Ajuste por conteo físico: ${reason}`,
        notes: notes ? `${notes} (Anterior: ${currentStock}, Nuevo: ${actual_quantity})` : `Anterior: ${currentStock}, Nuevo: ${actual_quantity}`
      })
      .select()
      .single();

    return {
      data: {
        movement,
        previous_stock: currentStock,
        new_stock: actual_quantity,
        difference
      },
      error: null
    };
  },

  getSummary: notMigrated('inventoryMovementsAPI.getSummary'),
  getByType: notMigrated('inventoryMovementsAPI.getByType'),
  getRecent: notMigrated('inventoryMovementsAPI.getRecent'),
}

// =============================================
// 🏭 WAREHOUSES
// =============================================
export const warehousesAPI = {
  getAll: (params?: { skip?: number; limit?: number }) => {
    const { from, to } = range(params)
    return db().from('warehouses').select('*').range(from, to)
  },

  getById: (id: number) => db().from('warehouses').select('*').eq('id', id).single(),

  create: (data: any) => db().from('warehouses').insert(data).select().single(),

  update: (id: number, data: any) =>
    db().from('warehouses').update(data).eq('id', id).select().single(),

  delete: (id: number) => db().from('warehouses').delete().eq('id', id),

  getInventoryMovements: (warehouseId: number) =>
    db().from('inventory_movements').select('*').eq('warehouse_id', warehouseId),

  getSummary: notMigrated('warehousesAPI.getSummary'),

  getProducts: (warehouseId: number) =>
    db()
      .from('warehouse_products')
      .select('*, product:products(*)')
      .eq('warehouse_id', warehouseId)
      .order('product(name)', { ascending: true }),

  getLowStock: (warehouseId: number, threshold?: number) =>
    db().from('warehouse_products').select('*').eq('warehouse_id', warehouseId).lte('stock', threshold ?? 10),
}

// =============================================
// 📦 WAREHOUSE PRODUCTS (STOCK)
// =============================================
export const warehouseProductsAPI = {
  getAll: (params?: { skip?: number; limit?: number }) => {
    const { from, to } = range(params)
    return db().from('warehouse_products').select('*').range(from, to)
  },

  getByWarehouseAndProduct: (warehouseId: number, productId: number) =>
    db().from('warehouse_products').select('*').eq('warehouse_id', warehouseId).eq('product_id', productId).single(),

  createOrUpdate: (data: any) => db().from('warehouse_products').upsert(data).select().single(),

  updateStock: (warehouseId: number, productId: number, data: any) =>
    db().from('warehouse_products').update(data).eq('warehouse_id', warehouseId).eq('product_id', productId).select().single(),

  delete: (warehouseId: number, productId: number) =>
    db().from('warehouse_products').delete().eq('warehouse_id', warehouseId).eq('product_id', productId),

  getByWarehouse: (warehouseId: number) =>
    db().from('warehouse_products').select('*').eq('warehouse_id', warehouseId),

  getByProduct: (productId: number) =>
    db().from('warehouse_products').select('*').eq('product_id', productId),

  getLowStockAll: (threshold?: number) =>
    db().from('warehouse_products').select('*').lte('stock', threshold ?? 10),

  transferStock: notMigrated('warehouseProductsAPI.transferStock'),
  adjustStock: notMigrated('warehouseProductsAPI.adjustStock'),
}

// =============================================
// 🚚 SUPPLIERS
// =============================================
export const suppliersAPI = {
  getAll: (params?: { skip?: number; limit?: number }) => {
    const { from, to } = range(params)
    return db().from('suppliers').select('*').range(from, to)
  },

  getById: (id: number) => db().from('suppliers').select('*').eq('id', id).single(),

  create: (data: any) => db().from('suppliers').insert(data).select().single(),

  update: (id: number, data: any) =>
    db().from('suppliers').update(data).eq('id', id).select().single(),

  delete: (id: number) => db().from('suppliers').delete().eq('id', id),

  search: (q: string) => db().from('suppliers').select('*').ilike('name', `%${q}%`),

  getSummary: notMigrated('suppliersAPI.getSummary'),
  getActive: notMigrated('suppliersAPI.getActive'),

  getPurchases: (supplierId: number) =>
    db().from('purchases').select('*').eq('supplier_id', supplierId),
}

// =============================================
// 👥 CUSTOMERS
// =============================================
export const customersAPI = {
  getAll: (params?: { skip?: number; limit?: number }) => {
    const { from, to } = range(params)
    return db().from('customers').select('*').range(from, to)
  },

  getById: (id: number) => db().from('customers').select('*').eq('id', id).single(),

  create: (data: any) => db().from('customers').insert(data).select().single(),

  update: (id: number, data: any) =>
    db().from('customers').update(data).eq('id', id).select().single(),

  delete: (id: number) => db().from('customers').delete().eq('id', id),

  search: (q: string) => db().from('customers').select('*').ilike('name', `%${q}%`),

  getSummary: notMigrated('customersAPI.getSummary'),

  getActive: () => db().from('customers').select('*').eq('status', '01'),

  getInvoices: (customerId: number) =>
    db().from('invoices').select('*').eq('customer_id', customerId),

  updateCreditLimit: (customerId: number, creditLimit: number) =>
    db().from('customers').update({ credit_limit: creditLimit }).eq('id', customerId).select().single(),

  getCreditStatus: notMigrated('customersAPI.getCreditStatus'),
}

// =============================================
// 📊 CATEGORIES
// =============================================
export const categoriesAPI = {
  getAll: () => db().from('categories').select('*').order('name'),

  list: () => db().from('categories').select('*').order('name'),

  getById: (id: number) => db().from('categories').select('*').eq('id', id).single(),

  getProducts: (id: number) => db().from('products').select('*').eq('category_id', id),

  create: (data: any) => db().from('categories').insert(data).select().single(),

  update: (id: number, data: any) =>
    db().from('categories').update(data).eq('id', id).select().single(),

  delete: (id: number) => db().from('categories').delete().eq('id', id),
}

// =============================================
// 💱 CURRENCIES (CRUD + historial)
// =============================================
export const currenciesAPI = {
  getAll: (params?: { skip?: number; limit?: number; is_active?: boolean }) => {
    let q = db().from('currencies').select('*')
    if (params?.is_active !== undefined) q = q.eq('is_active', params.is_active)
    const { from, to } = range(params)
    return q.range(from, to)
  },

  getById: (id: number) => db().from('currencies').select('*').eq('id', id).single(),

  create: (data: any) => db().from('currencies').insert(data).select().single(),

  update: (id: number, data: any) =>
    db().from('currencies').update(data).eq('id', id).select().single(),

  delete: (id: number) => db().from('currencies').delete().eq('id', id),

  updateRate: async (id: number, data: any) => {
    const supabase = db()
    const { data: currency, error } = await supabase.from('currencies').select('*').eq('id', id).single()
    if (error || !currency) return { data: null, error }

    const newRate = parseFloat(data.new_rate)
    const { data: updated, error: updError } = await supabase
      .from('currencies')
      .update({ exchange_rate: newRate, last_rate_update: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (updError) return { data: null, error: updError }

    await supabase.from('currency_rate_history').insert({
      currency_id: id,
      old_rate: currency.exchange_rate,
      new_rate: newRate,
      rate_difference: newRate - currency.exchange_rate,
      change_type: data.change_type ?? 'manual',
      change_source: data.change_source ?? null,
      change_reason: data.change_reason ?? null,
      provider_metadata: data.provider_metadata ?? null,
    })

    return { data: updated, error: null }
  },

  getRateHistory: (id: number, limit: number = 100) =>
    db().from('currency_rate_history').select('*').eq('currency_id', id).order('changed_at', { ascending: false }).limit(limit),

  getStatistics: notMigrated('currenciesAPI.getStatistics'),
  setBaseCurrency: notMigrated('currenciesAPI.setBaseCurrency'),
  convert: notMigrated('currenciesAPI.convert'),

  getConversionFactors: () => db().from('currencies').select('*'),

  calculateIGTF: notMigrated('currenciesAPI.calculateIGTF'),
  getIGTFConfigs: () => db().from('igtf_config').select('*'),
  createIGTFConfig: (data: any) => db().from('igtf_config').insert(data).select().single(),

  validateISO: async (code: string) => {
    const valid = /^[A-Z]{3}$/.test(code?.toUpperCase() ?? '')
    return { data: { valid, code: code?.toUpperCase(), message: valid ? 'Código válido' : 'Código inválido' }, error: null }
  },
}

// =============================================
// SISTEMA ESCRITORIO (pendiente de migrar)
// =============================================
export const coinsAPI = {
  // En el sistema escritorio "coins" es una vista de monedas -> tabla currencies
  getBaseCoin: () =>
    db().from('currencies').select('*').eq('is_base_currency', true).single(),

  getActiveCoins: () =>
    db().from('currencies').select('*').eq('show_in_browsers', true).eq('is_active', true),

  getAll: (params?: { skip?: number; limit?: number }) => {
    const { from, to } = range(params)
    return db().from('currencies').select('*').range(from, to)
  },

  getById: (coinId: number) =>
    db().from('currencies').select('*').eq('id', coinId).single(),

  create: (data: any) => db().from('currencies').insert(data).select().single(),

  update: (coinId: number, data: any) =>
    db().from('currencies').update(data).eq('id', coinId).select().single(),

  delete: (coinId: number) => db().from('currencies').delete().eq('id', coinId),

  updateRate: async (coinId: number, salesAliquot: number, buyAliquot?: number) => {
    const supabase = db()
    const { data: coin, error } = await supabase.from('currencies').select('*').eq('id', coinId).single()
    if (error || !coin) return { data: null, error }

    const { data, error: updError } = await supabase
      .from('currencies')
      .update({ exchange_rate: salesAliquot })
      .eq('id', coinId)
      .select()
      .single()
    if (updError) return { data: null, error: updError }

    await supabase.from('coin_history').insert({
      currency_id: coinId,
      sales_aliquot: salesAliquot,
      buy_aliquot: buyAliquot ?? salesAliquot,
      register_date: new Date().toISOString().slice(0, 10),
      register_hour: new Date().toTimeString().slice(0, 8),
    })

    return { data, error: null }
  },
}

export const coinHistoryAPI = {
  getAll: (params?: { currency_id?: number; skip?: number; limit?: number }) => {
    let q = db().from('coin_history').select('*')
    if (params?.currency_id) q = q.eq('currency_id', params.currency_id)
    const { from, to } = range(params)
    return q.order('register_date', { ascending: false }).range(from, to)
  },

  getById: (id: number) => db().from('coin_history').select('*').eq('id', id).single(),

  create: (data: any) => db().from('coin_history').insert(data).select().single(),

  createBatch: (data: any[]) => db().from('coin_history').insert(data).select(),

  getLatestByCurrency: (currencyId: number) =>
    db().from('coin_history').select('*').eq('currency_id', currencyId).order('register_date', { ascending: false }).limit(1).maybeSingle(),
}

// =============================================
// 📏 UNITS
// =============================================
export const unitsAPI = {
  getAll: (params?: { skip?: number; limit?: number; active_only?: boolean }) => {
    let q = db().from('units').select('*')
    if (params?.active_only) q = q.eq('is_active', true)
    const { from, to } = range(params)
    return q.range(from, to)
  },

  getById: (id: number) => db().from('units').select('*').eq('id', id).single(),

  create: (data: any) => db().from('units').insert(data).select().single(),

  update: (id: number, data: any) =>
    db().from('units').update(data).eq('id', id).select().single(),

  delete: (id: number) => db().from('units').delete().eq('id', id),
}

// =============================================
// 📊 REPORTS (SENIAT) — pendiente de migrar
// =============================================
export const reportsAPI = {
  getSalesBook: (params: { start_date: string; end_date: string; invoice_type?: string }) =>
    db().rpc('get_sales_book', { p_start_date: params.start_date, p_end_date: params.end_date }),

  getPurchaseBook: (params: { start_date: string; end_date: string; purchase_type?: string }) =>
    db().rpc('get_purchase_book', { p_start_date: params.start_date, p_end_date: params.end_date }),

  getSalesSummary: (params: { start_date: string; end_date: string; group_by?: string }) =>
    db().rpc('get_sales_summary', {
      p_start_date: params.start_date,
      p_end_date: params.end_date,
      p_group_by: params.group_by || 'month',
    }),

  getCashFlow: (params: { start_date: string; end_date: string }) =>
    db().rpc('get_cash_flow', { p_start_date: params.start_date, p_end_date: params.end_date }),
}

// =============================================
// 📄 PURCHASE CREDIT NOTES
// =============================================
export const purchaseCreditNotesAPI = {
  create: (purchaseId: number, data: any) =>
    db().from('purchase_credit_movements').insert({ ...data, purchase_id: purchaseId }).select().single(),

  getAll: (params?: { skip?: number; limit?: number }) => {
    const { from, to } = range(params)
    return db().from('purchase_credit_movements').select('*').range(from, to)
  },
}

// =============================================
// 🔐 PROTECTED / HEALTH — pendiente
// =============================================
export const protectedAPI = {
  protected: notMigrated('protectedAPI.protected'),
  adminOnly: notMigrated('protectedAPI.adminOnly'),
  managerOnly: notMigrated('protectedAPI.managerOnly'),
}

export const healthAPI = {
  check: notMigrated('healthAPI.check'),
  root: notMigrated('healthAPI.root'),
}

// =============================================
// 💰 RATES (BCV) — pendiente de migrar
// =============================================
export const ratesAPI = {
  getTodayRate: async (fromCurrency: string, toCurrency: string) => {
    const fromId = await resolveCurrencyId(fromCurrency)
    const toId = await resolveCurrencyId(toCurrency)
    if (!fromId || !toId) return { data: null, error: { message: 'Moneda no encontrada' } }
    const today = new Date().toISOString().slice(0, 10)
    return db()
      .from('daily_rates')
      .select('*')
      .eq('base_currency_id', fromId)
      .eq('target_currency_id', toId)
      .eq('rate_date', today)
      .maybeSingle()
  },

  getLatestRate: async (fromCurrency: string, toCurrency: string) => {
    const fromId = await resolveCurrencyId(fromCurrency)
    const toId = await resolveCurrencyId(toCurrency)
    if (!fromId || !toId) return { data: null, error: { message: 'Moneda no encontrada' } }
    return db()
      .from('daily_rates')
      .select('*')
      .eq('base_currency_id', fromId)
      .eq('target_currency_id', toId)
      .order('rate_date', { ascending: false })
      .limit(1)
      .maybeSingle()
  },

  getRateHistory: async (fromCurrency: string, toCurrency: string, limit?: number) => {
    const fromId = await resolveCurrencyId(fromCurrency)
    const toId = await resolveCurrencyId(toCurrency)
    if (!fromId || !toId) return { data: null, error: { message: 'Moneda no encontrada' } }
    return db()
      .from('daily_rates')
      .select('*')
      .eq('base_currency_id', fromId)
      .eq('target_currency_id', toId)
      .order('rate_date', { ascending: false })
      .limit(limit || 100)
  },

  syncBCVRates: (forceRefresh = false) =>
    db().functions.invoke('bcv-sync', { body: { force_refresh: forceRefresh } }),

  getBCVStatus: async () => {
    const { data, error } = await db()
      .from('daily_rates')
      .select('*')
      .eq('source', 'BCV')
      .order('rate_date', { ascending: false })
      .limit(1)
      .maybeSingle()
    return { data: { available: !!data, last_update: data?.rate_date ?? null }, error }
  },

  convert: async (amount: number, fromCurrency: string, toCurrency: string, rateDate?: string, manualRate?: number) => {
    const rate = manualRate ?? (await ratesAPI.getLatestRate(fromCurrency, toCurrency)).data?.exchange_rate ?? null
    if (rate == null) return { data: { amount, converted: null, rate: null }, error: { message: 'Tasa no disponible' } }
    return { data: { amount, converted: amount * rate, rate }, error: null }
  },

  createManualRate: async (fromCurrency: string, toCurrency: string, rateDate: string, exchangeRate: number, notes?: string) => {
    const fromId = await resolveCurrencyId(fromCurrency)
    const toId = await resolveCurrencyId(toCurrency)
    if (!fromId || !toId) return { data: null, error: { message: 'Moneda no encontrada' } }
    return db()
      .from('daily_rates')
      .upsert(
        {
          base_currency_id: fromId,
          target_currency_id: toId,
          rate_date: rateDate,
          exchange_rate: exchangeRate,
          source: 'MANUAL',
          notes: notes ?? null,
          is_active: true,
        },
        { onConflict: 'company_id,base_currency_id,target_currency_id,rate_date' }
      )
      .select()
      .single()
  },
}

// =============================================
// PRECIOS DE REFERENCIA — pendiente de migrar
// =============================================
export const referencePricesAPI = {
  getProductReferencePrice: async (productId: number, referenceCurrency: string = 'USD') => {
    const { data: product, error } = await db()
      .from('products')
      .select('id, name, price, price_usd')
      .eq('id', productId)
      .single()
    if (error || !product) return { data: null, error: error ?? { message: 'Producto no encontrado' } }

    const priceRef = referenceCurrency === 'USD' ? product.price_usd : null
    return {
      data: {
        product_id: product.id,
        product_name: product.name,
        price_reference: priceRef,
        reference_currency: referenceCurrency,
        available: priceRef != null,
        price_legacy: product.price ?? null,
      },
      error: null,
    }
  },

  getProductsSummary: async (productIds: number[]) => {
    const { data: products, error } = await db()
      .from('products')
      .select('id, name, price, price_usd')
      .in('id', productIds)
    if (error) return { data: null, error }

    const { rate } = await getUsdVesRate()
    const summary = (products ?? []).map((p: any) => {
      const priceRef = p.price_usd
      return {
        product_id: p.id,
        product_name: p.name,
        price_reference: priceRef,
        price_ves: priceRef != null && rate != null ? round2(priceRef * rate) : null,
        reference_currency: 'USD',
        exchange_rate: rate,
        has_reference_price: priceRef != null,
      }
    })
    return { data: summary, error: null }
  },

  calculateInvoiceItem: async (
    productId: number,
    quantity: number,
    priceReferenceOverride?: number,
    paymentMethod: string = 'transferencia',
    manualExchangeRate?: number,
  ) => {
    const { data: product, error } = await db()
      .from('products')
      .select('id, name, price_usd')
      .eq('id', productId)
      .single()
    if (error || !product) return { data: null, error: error ?? { message: 'Producto no encontrado' } }

    const priceRef = priceReferenceOverride ?? product.price_usd
    if (priceRef == null) {
      return { data: null, error: { message: 'El producto no tiene precio de referencia (price_usd)' } }
    }

    const { rate, source } = await getUsdVesRate(manualExchangeRate)
    if (rate == null) {
      return { data: null, error: { message: 'No hay tasa USD→VES disponible. Sincroniza BCV o usa tasa manual.' } }
    }

    const unitPriceTarget = round2(priceRef * rate)
    const subtotalRef = round2(priceRef * quantity)
    const subtotalTarget = round2(unitPriceTarget * quantity)

    const ivaPercentage = 16
    const ivaAmount = round2((subtotalTarget * ivaPercentage) / 100)

    const igtfExempt = ['efectivo', 'cash'].includes(paymentMethod.toLowerCase())
    const igtfPercentage = igtfExempt ? 0 : 3
    const igtfAmount = igtfExempt ? 0 : round2(((subtotalTarget + ivaAmount) * 3) / 100)

    const totalItem = round2(subtotalTarget + ivaAmount + igtfAmount)

    return {
      data: {
        product_id: productId,
        product_name: product.name,
        quantity,
        unit_price_reference: round2(priceRef),
        unit_price_target: unitPriceTarget,
        subtotal_reference: subtotalRef,
        subtotal_target: subtotalTarget,
        exchange_rate: rate,
        rate_date: new Date().toISOString().slice(0, 10),
        rate_source: source,
        iva_percentage: ivaPercentage,
        iva_amount: ivaAmount,
        igtf_percentage: igtfPercentage,
        igtf_amount: igtfAmount,
        igtf_exempt: igtfExempt,
        total_item: totalItem,
      },
      error: null,
    }
  },

  calculateInvoiceTotals: async (
    items: any[],
    customerId?: number,
    paymentMethod: string = 'transferencia',
    manualExchangeRate?: number,
    discountPercentage?: number,
  ) => {
    if (!items?.length) {
      return { data: null, error: { message: 'La lista de items no puede estar vacía' } }
    }

    const calculated: any[] = []
    let subtotalReference = 0
    let subtotalTarget = 0
    let ivaAmount = 0
    let igtfAmount = 0
    let exchangeRate: number | null = null
    let rateDate: string | null = null
    let rateSource: string | null = null

    for (const item of items) {
      const { data, error } = await referencePricesAPI.calculateInvoiceItem(
        item.product_id,
        item.quantity,
        item.price_reference_override,
        paymentMethod,
        manualExchangeRate,
      )
      if (error || !data) return { data: null, error }
      calculated.push(data)
      subtotalReference += data.subtotal_reference
      subtotalTarget += data.subtotal_target
      ivaAmount += data.iva_amount
      igtfAmount += data.igtf_amount
      exchangeRate = data.exchange_rate
      rateDate = data.rate_date
      rateSource = data.rate_source
    }

    subtotalReference = round2(subtotalReference)
    subtotalTarget = round2(subtotalTarget)
    ivaAmount = round2(ivaAmount)
    igtfAmount = round2(igtfAmount)

    const discountAmount = discountPercentage ? round2((subtotalTarget * discountPercentage) / 100) : 0
    const totalAmount = round2(subtotalTarget + ivaAmount + igtfAmount - discountAmount)

    return {
      data: {
        reference_currency: 'USD',
        payment_currency: 'VES',
        items: calculated,
        subtotal_reference: subtotalReference,
        subtotal_target: subtotalTarget,
        iva_amount: ivaAmount,
        igtf_amount: igtfAmount,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        exchange_rate: exchangeRate,
        rate_date: rateDate,
        rate_source: rateSource,
      },
      error: null,
    }
  },
}

// =============================================
// SISTEMA ESCRITORIO: OPERACIONES DE VENTA — pendiente
// =============================================
export const salesOperationsAPI = {
  getAll: (params?: { skip?: number; limit?: number }) => {
    const { from, to } = range(params)
    return db().from('sales_operations').select('*').order('id', { ascending: false }).range(from, to)
  },

  getById: (id: number) =>
    db()
      .from('sales_operations')
      .select('*, coins:sales_operation_coins(*), details:sales_operation_details(*), taxes:sales_operation_taxes(*)')
      .eq('id', id)
      .single(),

  create: (data: any) => db().from('sales_operations').insert(data).select().single(),

  update: (id: number, data: any) =>
    db().from('sales_operations').update(data).eq('id', id).select().single(),

  delete: (id: number) => db().from('sales_operations').delete().eq('id', id),

  convert: (id: number, targetType: string) =>
    db().from('sales_operations').update({ operation_type: targetType }).eq('id', id).select().single(),

  getStats: notMigrated('salesOperationsAPI.getStats'),

  getByType: (operationType: string) =>
    db().from('sales_operations').select('*').eq('operation_type', operationType),

  getBudgets: () => db().from('sales_operations').select('*').eq('operation_type', 'BUDGET'),
  getOrders: () => db().from('sales_operations').select('*').eq('operation_type', 'ORDER'),
  getDeliveryNotes: () => db().from('sales_operations').select('*').eq('operation_type', 'DELIVERYNOTE'),
  getBills: () => db().from('sales_operations').select('*').eq('operation_type', 'BILL'),
  getCreditNotes: () => db().from('sales_operations').select('*').eq('operation_type', 'CREDITNOTE'),
  getDebitNotes: () => db().from('sales_operations').select('*').eq('operation_type', 'DEBITNOTE'),
}

export default db
