import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cart')) || []; } catch { return []; }
  });
  const [orderType, setOrderType] = useState('delivery');

  useEffect(() => { localStorage.setItem('cart', JSON.stringify(cart)); }, [cart]);

  // MySQL utilise item.id (integer), accepte aussi item._id pour compatibilité
  const getItemId = (item) => item.id ?? item._id;

  const add = (item, qty = 1) => {
    const itemId = getItemId(item);
    setCart(prev => {
      const ex = prev.find(c => String(c.menuItem) === String(itemId));
      if (ex) {
        return prev.map(c =>
          String(c.menuItem) === String(itemId)
            ? { ...c, quantity: c.quantity + qty }
            : c
        );
      }
      return [...prev, {
        menuItem: itemId,
        name:     item.name,
        price:    parseFloat(item.price),
        image:    item.image || '',
        quantity: qty
      }];
    });
  };

  const remove = (id) =>
    setCart(prev => prev.filter(c => String(c.menuItem) !== String(id)));

  const updateQty = (id, qty) => {
    if (qty <= 0) { remove(id); return; }
    setCart(prev =>
      prev.map(c => String(c.menuItem) === String(id) ? { ...c, quantity: qty } : c)
    );
  };

  const clear = () => setCart([]);

  const subtotal    = cart.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0);
  const count       = cart.reduce((s, i) => s + i.quantity, 0);
  const deliveryFee = orderType === 'delivery' ? 3000 : 0;

  return (
    <CartContext.Provider value={{
      cart, orderType, setOrderType,
      add, remove, updateQty, clear,
      subtotal, count, deliveryFee,
      total: subtotal + deliveryFee
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
