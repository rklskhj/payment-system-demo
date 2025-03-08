import { useState, useEffect } from "react";

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  // 로컬 스토리지에서 장바구니 불러오기!
  useEffect(() => {
    const storedCart = localStorage.getItem("cart");
    if (storedCart) {
      try {
        setItems(JSON.parse(storedCart));
      } catch (e) {
        console.error("장바구니 데이터를 불러오는 중 오류 발생:", e);
      }
    }
    setLoading(false);
  }, []);

  // 장바구니 변경 시 로컬 스토리지에 저장
  useEffect(() => {
    if (!loading) {
      localStorage.setItem("cart", JSON.stringify(items));
    }
  }, [items, loading]);

  const addItem = (item: Omit<CartItem, "quantity">) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((i) => i.id === item.id);
      if (existingItem) {
        return prevItems.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prevItems, { ...item, quantity: 1 }];
    });
  };

  const removeItem = (id: string) => {
    setItems((prevItems) => prevItems.filter((i) => i.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems((prevItems) =>
      prevItems.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return {
    items,
    totalPrice,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    isLoading: loading,
  };
}
