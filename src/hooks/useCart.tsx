import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    return storagedCart ? JSON.parse(storagedCart) : [];
  });

  function updateCart(products: Product[]) {
    setCart(products);
    localStorage.setItem("@RocketShoes:cart", JSON.stringify(products));
  }

  const addProduct = async (productId: number) => {
    try {
      const product = cart.find((p) => productId === p.id);

      if (product) {
        return updateProductAmount({ amount: product.amount + 1, productId });
      }

      const { data } = await api.get(`products/${productId}`);

      updateCart([...cart, { ...data, amount: 1 }]);
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      if (!cart.find((p) => p.id === productId)) throw new Error();

      updateCart(cart.filter((p) => p.id !== productId));
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount < 1) throw new Error();

      const { data: stock } = await api.get<Stock>(`stock/${productId}`);

      if (stock.amount >= amount) {
        return updateCart(
          cart.map((p) => (productId === p.id ? { ...p, amount } : p))
        );
      }

      toast.error("Quantidade solicitada fora de estoque");
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
