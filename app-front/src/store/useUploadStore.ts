import { create } from "zustand";

interface UploadResult {
  product_name: string;
  filename: string;
  detected_encoding: string;
  total_items: number;
  components: any[];
}

interface UploadStore {
  result: UploadResult | null;
  setResult: (data: UploadResult) => void;
}

export const useUploadStore = create<UploadStore>((set) => ({
  result: null,
  setResult: (data) => set({ result: data }),
}));
