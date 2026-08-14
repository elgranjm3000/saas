// Empresa actualizada para Venezuela
export interface Company {
  id: number;
  name: string;
  legal_name?: string | null;
  tax_id: string; // RIF
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  currency: string; // USD, VES, etc.
  exchange_rate?: number | null;
  timezone: string;
  invoice_prefix: string;
  logo_url?: string | null;
  next_invoice_number: number;
  created_at: string;
  is_active: boolean;

  // Venezuela SENIAT
  iva_retention_agent?: boolean; // Agente de retención IVA
  islr_retention_agent?: boolean; // Agente de retención ISLR
  require_customer_tax_id_threshold?: number;
}

export interface CompanySettings {
  currency: string;
  timezone: string;
  date_format: string;
  invoice_prefix: string;
  next_invoice_number: number;
  low_stock_threshold: number;
  auto_increment_invoice: boolean;
  require_customer_tax_id: boolean;
}

export interface CompanyDashboard {
  company: Company;
  total_products: number;
  total_customers: number;
  total_warehouses: number;
  monthly_sales: number;
  pending_invoices: number;
  low_stock_products: number;
}
