// src/types/supplier.ts
export interface Supplier {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  contact_person?: string;
  company_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupplierCreate {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  contact_person?: string;
}

export interface SupplierUpdate {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  contact_person?: string;
  is_active?: boolean;
}