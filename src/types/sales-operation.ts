// ✅ SISTEMA ESCRITORIO: Operaciones de Venta

export type OperationType = 'BUDGET' | 'ORDER' | 'DELIVERYNOTE' | 'BILL' | 'CREDITNOTE' | 'DEBITNOTE';

// ✅ SISTEMA ESCRITORIO: Operación de venta principal
export interface SalesOperation {
  id: number;
  company_id: number;

  // ✅ Identificación
  correlative: number;
  operation_type: OperationType;
  document_no?: string;
  document_no_internal?: string;
  control_no?: string;

  // ✅ Fechas
  emission_date: string;  // DateTime
  register_date: string;  // DateTime
  register_hour?: string;
  expiration_date?: string;  // DateTime

  // ✅ Cliente (información duplicada para historial)
  client_id: number;
  client_name?: string;
  client_tax_id?: string;
  client_address?: string;
  client_phone?: string;
  client_name_fiscal?: number;  // 0=Ordinario, 1=No Contribuyente, 2=Formal

  // ✅ Ubicación
  seller: string;
  store: string;
  locations: string;
  user_code?: string;
  station: string;

  // ✅ Estados
  wait: boolean;
  pending: boolean;
  canceled: boolean;
  delivered: boolean;
  begin_used: boolean;

  // ✅ Totales de detalles
  total_amount: number;
  total_net_details: number;
  total_tax_details: number;
  total_details: number;

  // ✅ Descuentos y fletes
  percent_discount: number;
  discount: number;
  percent_freight: number;
  freight: number;

  // ✅ Totales con impuestos
  total_net: number;
  total_tax: number;
  total: number;

  // ✅ Pagos
  credit: number;
  cash: number;

  // ✅ Costos
  total_net_cost: number;
  total_tax_cost: number;
  total_cost: number;

  // ✅ Configuración de precio
  type_price: number;
  total_count_details: number;

  // ✅ Flete
  freight_tax: string;
  freight_aliquot: number;

  // ✅ Retenciones
  total_retention_tax: number;
  total_retention_municipal: number;
  total_retention_islr: number;
  retention_tax_prorration: number;
  retention_islr_prorration: number;
  retention_municipal_prorration: number;

  // ✅ Total operación
  total_operation: number;

  // ✅ Impresora fiscal
  fiscal_impresion: boolean;
  fiscal_printer_serial: string;
  fiscal_printer_z: string;
  fiscal_printer_date?: string;  // DateTime

  // ✅ Configuración adicional
  coin_code: string;
  sale_point: boolean;
  restorant: boolean;

  // ✅ Envío
  address_send: string;
  contact_send: string;
  phone_send: string;
  total_weight: number;

  // ✅ IGTF
  free_tax: boolean;
  total_exempt: number;
  base_igtf: number;
  percent_igtf: number;
  igtf: number;

  // ✅ Orden de compra relacionada
  shopping_order_document_no: string;
  shopping_order_date?: string;  // DateTime

  // ✅ Comentarios
  operation_comments?: string;
  description?: string;

  // Relaciones
  client?: {
    id: number;
    name: string;
    tax_id?: string;
  };
  coins?: SalesOperationCoin[];
  details?: SalesOperationDetail[];
  taxes?: SalesOperationTax[];

  created_at: string;
  updated_at: string;
}

// ✅ SISTEMA ESCRITORIO: Montos en diferentes monedas
export interface SalesOperationCoin {
  id: number;
  company_id: number;
  sales_operation_id: number;
  main_correlative: number;
  coin_code: string;  // ✅ VARCHAR(3) - ISO 4217: USD, VES, EUR
  currency_id: number | null;  // ✅ FK a currencies.id (Desktop ERP)
  factor_type: number;
  buy_aliquot: number;
  sales_aliquot: number;
  total_net_details: number;
  total_tax_details: number;
  total_details: number;
  discount: number;
  freight: number;
  total_net: number;
  total_tax: number;
  total: number;
  credit: number;
  cash: number;
  total_net_cost: number;
  total_tax_cost: number;
  total_cost: number;
  total_operation: number;
  total_retention_tax: number;
  total_retention_municipal: number;
  total_retention_islr: number;
  retention_tax_prorration: number;
  retention_islr_prorration: number;
  retention_municipal_prorration: number;
  total_exempt: number;
  created_at: string;
  updated_at: string;
}

// ✅ SISTEMA ESCRITORIO: Detalles de la operación (líneas)
export interface SalesOperationDetail {
  id: number;
  company_id: number;
  sales_operation_id: number;
  main_correlative: number;
  line: number;

  // ✅ Producto (información duplicada)
  code_product?: string;
  description_product?: string;
  referenc?: string;
  mark?: string;
  model?: string;

  // ✅ Ubicación
  store?: string;
  locations?: string;

  // ✅ Unidad
  unit?: number;
  conversion_factor: number;
  unit_type: number;

  // ✅ Cantidades y Precios
  amount: number;
  unitary_cost: number;
  sale_tax: string;
  sale_aliquot: number;
  price: number;
  type_price: number;

  // ✅ Costos
  total_net_cost: number;
  total_tax_cost: number;
  total_cost: number;

  // ✅ Precios Brutos
  total_net_gross: number;
  total_tax_gross: number;
  total_gross: number;

  // ✅ Descuentos
  percent_discount: number;
  discount: number;

  // ✅ Totales
  total_net: number;
  total_tax: number;
  total: number;

  // ✅ Inventario
  pending_amount: number;
  buy_tax: string;
  buy_aliquot: number;
  update_inventory: boolean;
  amount_released_by_load_order: number;
  amount_discharged_by_load_delivery_note: number;

  // ✅ Adicionales
  product_type?: string;
  description?: string;
  technician: string;
  coin_code: string;  // ✅ VARCHAR(3) - ISO 4217: USD, VES, EUR
  total_weight: number;

  created_at: string;
  updated_at: string;
  currency_id?: number | null;  // ✅ FK a currencies.id (Desktop ERP)
}

// ✅ SISTEMA ESCRITORIO: Impuestos del documento
export interface SalesOperationTax {
  id: number;
  company_id: number;
  sales_operation_id: number;
  main_correlative: number;
  line: number;
  taxe_code: string;
  aliquot: number;
  taxable: number;
  tax: number;
  tax_type: number;
  created_at: string;
  updated_at: string;
  coin_code?: string;  // ✅ VARCHAR(3) - ISO 4217: USD, VES, EUR
  currency_id?: number | null;  // ✅ FK a currencies.id (Desktop ERP)
}

// ✅ SISTEMA ESCRITORIO: Para crear
export interface SalesOperationCreate {
  operation_type: OperationType;
  client_id: number;
  emission_date: string;  // DateTime
  register_date: string;  // DateTime
  correlative: number;

  // Opcionales - se pueden calcular
  total?: number;
  total_net?: number;
  total_tax?: number;
  discount?: number;
  freight?: number;

  // Configuración
  coin_code?: string;
  seller?: string;
  store?: string;
  locations?: string;
  station?: string;

  // Estado inicial
  wait?: boolean;
  pending?: boolean;
  canceled?: boolean;
  delivered?: boolean;
}

// ✅ SISTEMA ESCRITORIO: Para actualizar
export interface SalesOperationUpdate {
  document_no?: string;
  control_no?: string;
  emission_date?: string;
  expiration_date?: string;

  // Estados
  wait?: boolean;
  pending?: boolean;
  canceled?: boolean;
  delivered?: boolean;

  // Totales
  total?: number;
  total_net?: number;
  total_tax?: number;
  discount?: number;
  freight?: number;

  // Pagos
  credit?: number;
  cash?: number;

  // IGTF
  base_igtf?: number;
  percent_igtf?: number;
  igtf?: number;

  // Comentarios
  operation_comments?: string;
  description?: string;
}

// ✅ SISTEMA ESCRITORIO: Estadísticas
export interface SalesOperationStats {
  totals_by_type: {
    operation_type: OperationType;
    count: number;
    total_amount: number;
  }[];
  pending_count: number;
  delivered_count: number;
}
