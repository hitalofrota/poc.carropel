export interface Product {
  id: number;
  name: string;
}

export interface OrderItem {
  product_id: number;
  quantity: number;
}

export interface SalesOrderPayload {
  order_number: string;
  customer: string;
  notes?: string;
  items: OrderItem[];
}
