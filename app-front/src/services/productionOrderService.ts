import { api } from './api';
import { 
  ProductionOrderResponse, 
  ProductionOrderCreateData, 
  ProductionOrderUpdateData 
} from '../types/production-order';

export const productionOrderService = {
    // CREATE
    createProductionOrder: async (productionOrderData: ProductionOrderCreateData): Promise<ProductionOrderResponse> => {
        const response = await api.post<ProductionOrderResponse>('/orders/', productionOrderData);
        return response.data;
    },

    // READ
    getProductionOrders: async (): Promise<ProductionOrderResponse[]> => {
        const response = await api.get<ProductionOrderResponse[]>('/orders/');
        return response.data;
    },

    getProductionOrder: async (id: number): Promise<ProductionOrderResponse> => {
        const response = await api.get<ProductionOrderResponse>(`/orders/${id}`);
        return response.data;
    },

    // UPDATE
    updateProductionOrder: async (id: number, productionOrderData: Partial<ProductionOrderUpdateData>): Promise<ProductionOrderResponse> => {
        const response = await api.put<ProductionOrderResponse>(`/orders/${id}`, productionOrderData);
        return response.data;
    },

    // DELETE
    deleteProductionOrder: async (id: number): Promise<void> => {
        await api.delete(`/orders/${id}`);
    },

    // OUTRAS OPERAÇÕES ESPECÍFICAS DE ORDEM DE PRODUÇÃO
    getProductionOrdersByStatus: async (status: string): Promise<ProductionOrderResponse[]> => {
        const response = await api.get<ProductionOrderResponse[]>(`/orders/status/${status}`);
        return response.data;
    },

    searchProductionOrders: async (query: string): Promise<ProductionOrderResponse[]> => {
        const response = await api.get<ProductionOrderResponse[]>(`/orders/search?q=${query}`);
        return response.data;
    },

    createFromSalesOrder: async (salesOrderId: number) => {
        const response = await api.post(
            `/orders/from-sales-order/${salesOrderId}`
        );
        return response.data;
    },
    async generatePdf(order: ProductionOrderResponse) {
        return api.post("/orders/pdf", order, {
        responseType: "blob",
        });
    },

};