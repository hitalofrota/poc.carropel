import { api } from "@/services/api";

export interface SalesOrderItemPayload {
  product_id: number;
  quantity: number;
  delivery_date?: string | null;
}

export interface SalesOrder {
  id: number;
  customer: string;
  items: SalesOrderItemPayload[];
}

export interface CreateSalesOrderPayload {
  customer: string;
  items: SalesOrderItemPayload[];
}

/* CREATE */
export const createSalesOrder = async (
  payload: CreateSalesOrderPayload
) => {
  const { data } = await api.post("/sales-orders/", payload);
  return data;
};

/* GET ONE */
export const getSalesOrder = async (id: number): Promise<SalesOrder> => {
  const { data } = await api.get(`/sales-orders/${id}`);
  return data;
};

/* UPDATE */
export const updateSalesOrder = async (
  id: number,
  payload: CreateSalesOrderPayload
) => {
  const { data } = await api.put(`/sales-orders/${id}`, payload);
  return data;
};
