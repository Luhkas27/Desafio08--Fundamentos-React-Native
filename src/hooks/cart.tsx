import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';
import api from '../services/api';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsStorage = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      productsStorage && setProducts(JSON.parse(productsStorage));
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async ({ id, title, image_url, price, quantity }) => {
      const productToAddCart: Product = {
        id,
        title,
        image_url,
        price,
        quantity: 1,
      };

      const productIndex = products.findIndex(product => product.id === id);

      if (productIndex > -1) {
        const newQuantity = products[productIndex].quantity + 1;
        products[productIndex].quantity = newQuantity;

        setProducts([...products]);
      } else {
        setProducts([...products, productToAddCart]);
      }

      AsyncStorage.setItem('@GoMarketplace:products', JSON.stringify(products));
    },
    [],
  );

  const increment = useCallback(
    async id => {
      const productIndex = products.findIndex(product => product.id === id);

      const newQuantity = products[productIndex].quantity + 1;
      products[productIndex].quantity = newQuantity;

      setProducts([...products]);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const newProducts = [...products];

      const productIndex = products.findIndex(product => product.id === id);

      const newQuantity = newProducts[productIndex].quantity - 1;
      newQuantity === 0
        ? newProducts.splice(productIndex, 1)
        : (newProducts[productIndex].quantity = newQuantity);

      setProducts([...products]);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
