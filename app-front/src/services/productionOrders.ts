import { api } from "@/services/api";

export const productionOrderService = {
  getPdfByOrderId: async (orderId: number): Promise<Blob> => {
    const response = await api.get(
      `/orders/${orderId}/pdf`,
      {
        responseType: "blob",
      }
    );

    return response.data;
  },
};
