import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface TempOrderData {
  productId: string;
  productName: string;
  productType: "one-time" | "subscription";
  amount: number;
  imageUrl?: string;
}

interface OrderState {
  tempOrder: TempOrderData | null;
  setTempOrder: (order: TempOrderData) => void;
  clearTempOrder: () => void;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set) => ({
      tempOrder: null,
      setTempOrder: (order) => set({ tempOrder: order }),
      clearTempOrder: () => set({ tempOrder: null }),
    }),
    {
      name: "order-storage",
    }
  )
);
