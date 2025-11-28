export interface ProductionOrderResponse {
  id: number;
  name: string;
  code: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  quantity: number;
  start_date: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductionOrderCreateData {
  name: string;
  code: string;
  quantity: number;
  start_date: string;
  end_date?: string;
}

export interface ProductionOrderUpdateData extends Partial<ProductionOrderCreateData> {
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}