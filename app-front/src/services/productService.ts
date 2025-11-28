import { api } from './api';
import { ProductCreateData, ProductResponse } from '../types/product';

export const productService = {
    // CREATE
    createProduct: async (productData: ProductCreateData): Promise<ProductResponse> => {
        const response = await api.post<ProductResponse>('/products/', productData);
        return response.data;
    },

    // READ
    getProducts: async (): Promise<ProductResponse[]> => {
        const response = await api.get<ProductResponse[]>('/products/');
        return response.data;
    },

    getProduct: async (id: number): Promise<ProductResponse> => {
        const response = await api.get<ProductResponse>(`/products/${id}`);
        return response.data;
    },

    // UPDATE
    updateProduct: async (id: number, productData: Partial<ProductCreateData>): Promise<ProductResponse> => {
        const response = await api.put<ProductResponse>(`/products/${id}`, productData);
        return response.data;
    },

    // DELETE
    deleteProduct: async (id: number): Promise<void> => {
        await api.delete(`/products/${id}`);
    },

    // OUTRAS OPERAÇÕES ESPECÍFICAS DE PRODUTO
    searchProducts: async (query: string): Promise<ProductResponse[]> => {
        const response = await api.get<ProductResponse[]>(`/products/search?q=${query}`);
        return response.data;
    }
};