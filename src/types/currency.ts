/**
 * Tipos para el Sistema de Monedas Venezolano
 * Incluye soporte para IGTF, conversión, y registro histórico
 */

// ==================== MONEDAS ====================

export interface Currency {
  id: number;
  company_id: number;
  code: string;              // ISO 4217: USD, VES, EUR
  name: string;              // Nombre completo
  symbol: string;            // $, Bs, €
  exchange_rate: string;    // Tasa actual (NUMERIC(20,10))
  decimal_places: number;   // Decimales para display

  // Configuración
  is_base_currency: boolean;
  is_active: boolean;

  // Factor de conversión (lógica venezolana)
  conversion_factor: string | null;  // NUMERIC(20,10)
  conversion_method: 'direct' | 'inverse' | 'via_usd' | 'undefined' | null;

  // IGTF (Impuesto a Grandes Transacciones Financieras)
  applies_igtf: boolean;
  igtf_rate: string | null;      // Tasa de IGTF (3.00)
  igtf_exempt: boolean;
  igtf_min_amount: string | null;  // Monto mínimo para aplicar IGTF

  // Actualización automática
  rate_update_method: 'manual' | 'api_bcv' | 'api_binance' | 'api_fixer' | 'scraper' | 'scheduled' | 'webhook';
  last_rate_update: string | null;   // DateTime ISO
  next_rate_update: string | null;
  rate_source_url: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;

  // Auditoría
  created_by: number | null;
  updated_by: number | null;

  notes: string | null;
  config: string | null;
}

// ==================== HISTORIAL DE TASAS ====================

export interface CurrencyRateHistory {
  id: number;
  currency_id: number;
  company_id: number;

  // Valores
  old_rate: string;           // NUMERIC(20,10)
  new_rate: string;           // NUMERIC(20,10)
  rate_difference: string;    // NUMERIC(20,10)
  rate_variation_percent: string | null;  // NUMERIC(10,4)

  // Metadata del cambio
  changed_by: number | null;
  change_type: 'manual' | 'automatic_api' | 'scheduled' | 'correction';
  change_source: string | null;  // ej: 'api_bcv', 'user_admin'
  user_ip: string | null;
  changed_at: string;         // DateTime ISO
  change_reason: string | null;
  provider_metadata: string | null;  // JSON con info del proveedor
}

// ==================== IGTF ====================

export interface IGTFConfig {
  id: number;
  company_id: number;
  currency_id: number;

  // Contribuyente especial
  is_special_contributor: boolean;

  // Configuración de tasa
  igtf_rate: string;           // NUMERIC(5,2)
  min_amount_local: string | null;    // NUMERIC(20,2)
  min_amount_foreign: string | null;  // NUMERIC(20,2)

  // Exenciones
  is_exempt: boolean;
  exempt_transactions: string | null;      // JSON array
  applicable_payment_methods: string | null;  // JSON array

  // Vigencia
  valid_from: string;         // DateTime ISO
  valid_until: string | null;  // DateTime ISO

  // Auditoría
  created_at: string;
  created_by: number | null;
  notes: string | null;
}

// ==================== CONVERSIÓN ====================

export interface CurrencyConversion {
  original_amount: number;
  original_currency: string;
  converted_amount: number;
  target_currency: string;
  exchange_rate_used: number;
  conversion_method: string;
  rate_metadata: {
    rate: number;
    method: string;
    source: string;
    last_update: string | null;
    currency_id: number;
    decimal_places: number;
  };
}

// ==================== IGTF CÁLCULO ====================

export interface IGTFResult {
  original_amount: number;
  igtf_amount: number;
  igtf_applied: boolean;
  total_with_igtf: number;
  metadata: {
    currency_code: string;
    applies: boolean;
    rate: number;
    reason: string;
    igtf_config_id: number | null;
  };
}

// ==================== FACTORES DE CONVERSIÓN ====================

export interface ConversionFactor {
  code: string;
  name: string;
  symbol: string;
  exchange_rate: number;
  conversion_method: string | null;
  conversion_factor: number | null;
  is_base: boolean;
  applies_igtf: boolean;
  igtf_rate: number | null;
  decimal_places: number;
}

// ==================== ESTADÍSTICAS ====================

export interface CurrencyStatistics {
  currency_code: string;
  currency_name: string;
  current_rate: number;
  decimal_places: number;
  is_base: boolean;
  applies_igtf: boolean;
  igtf_rate: number | null;

  total_rate_changes: number;
  last_change: CurrencyRateHistory | null;
  first_change: CurrencyRateHistory | null;
  avg_variation_percent: number;
  max_variation_percent: number;
  min_variation_percent: number;

  created_at: string;
  last_update: string;
}

// ==================== FORMS ====================

export interface CurrencyCreateForm {
  code: string;              // ISO 4217
  name: string;
  symbol: string;
  exchange_rate: string;    // Hasta 10 decimales
  decimal_places?: number;
  is_base_currency?: boolean;

  // Conversión
  conversion_method?: 'direct' | 'inverse' | 'via_usd';

  // IGTF
  applies_igtf?: boolean;
  igtf_rate?: string;         // Default: "3.00"
  igtf_exempt?: boolean;
  igtf_min_amount?: string;

  // Actualización automática
  rate_update_method?: 'manual' | 'api_bcv' | 'api_binance' | 'api_fixer' | 'scraper' | 'scheduled' | 'webhook';
  rate_source_url?: string;

  notes?: string;
}

export interface CurrencyUpdateForm {
  name?: string;
  symbol?: string;
  exchange_rate?: string;
  decimal_places?: number;
  is_active?: boolean;

  conversion_method?: 'direct' | 'inverse' | 'via_usd';

  applies_igtf?: boolean;
  igtf_rate?: string;
  igtf_exempt?: boolean;
  igtf_min_amount?: string;

  rate_update_method?: 'manual' | 'api_bcv' | 'api_binance' | 'api_fixer' | 'scraper' | 'scheduled' | 'webhook';
  rate_source_url?: string;

  notes?: string;
}

export interface CurrencyRateUpdateForm {
  new_rate: string;          // Hasta 10 decimales
  change_reason?: string;
  change_type?: 'manual' | 'automatic_api' | 'scheduled' | 'correction';
  change_source?: string;
  provider_metadata?: any;
}

export interface IGTFConfigCreateForm {
  company_id: number;
  currency_id: number;

  is_special_contributor?: boolean;
  igtf_rate: string;
  min_amount_local?: string;
  min_amount_foreign?: string;

  is_exempt?: boolean;
  exempt_transactions?: string[];
  applicable_payment_methods?: string[];

  valid_from: string;         // DateTime ISO
  valid_until?: string;        // DateTime ISO

  notes?: string;
}

// ==================== VALIDACIÓN ====================

export interface ISOValidationResult {
  valid: boolean;
  code: string;
  currency_name?: string;
  message: string;
}
