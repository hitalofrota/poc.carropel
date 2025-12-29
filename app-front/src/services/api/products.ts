import { api } from "@/services/api";

export interface Product {
  id: number;
  name: string;
}

export const listProducts = async (): Promise<Product[]> => {
  const { data } = await api.get("/products/");
  return data;
};
