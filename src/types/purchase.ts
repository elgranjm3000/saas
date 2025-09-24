export interface Purchase {
  id: number;
  company_id: number;
  supplier_id: number;
  warehouse_id?: number;
  purchase_number: string;
  date: string;
  expected_delivery_date?: string;
  total_amount: number;
  status: 'pending' | 'approved' | 'received' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
  supplier?: Supplier;
  items: PurchaseItem[];
}

export interface PurchaseItem {
  id?: number;
  product_id: number;
  quantity: number;
  price_per_unit: number;
  total_price: number;
  product?: {
    id: number;
    name: string;
    sku: string;
  };
}

export interface PurchaseCreate {
  supplier_id: number;
  warehouse_id?: number;
  date: string;
  expected_delivery_date?: string;
  notes?: string;
  items: Omit<PurchaseItem, 'id'>[];
}

export interface PurchaseUpdate {
  supplier_id?: number;
  warehouse_id?: number;
  date?: string;
  expected_delivery_date?: string;
  status?: 'pending' | 'approved' | 'received' | 'cancelled';
  notes?: string;
  items?: Omit<PurchaseItem, 'id'>[];
}