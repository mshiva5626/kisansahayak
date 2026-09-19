import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CartContext = createContext(null);

export const useCart = () => {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error('useCart must be used within CartProvider');
    return ctx;
};

const CART_STORAGE_KEY = 'kisan_fertilizer_cart';
const ORDERS_STORAGE_KEY = 'kisan_fertilizer_orders';

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');
        } catch {
            return [];
        }
    });

    const [isCartOpen, setIsCartOpen] = useState(false);
    const [lastOrder, setLastOrder] = useState(null);

    // Save cart to local storage whenever updated
    useEffect(() => {
        try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
        } catch (err) {
            console.error('Failed to persist cart:', err);
        }
    }, [cartItems]);

    // Add item (or increment if exists)
    const addToCart = useCallback((fertilizer, quantity = 1) => {
        setCartItems(prev => {
            const existingIndex = prev.findIndex(item => item.id === fertilizer.id);
            if (existingIndex > -1) {
                const updated = [...prev];
                updated[existingIndex].quantity += quantity;
                return updated;
            }
            return [...prev, {
                id: fertilizer.id,
                name: fertilizer.name,
                nutrientGrade: fertilizer.nutrientGrade,
                bagWeightKg: fertilizer.bagWeightKg,
                mrp: fertilizer.mrp,
                subsidized: fertilizer.subsidized,
                manufacturer: fertilizer.manufacturer,
                commissionRate: fertilizer.commissionRate || 0.035,
                quantity: quantity
            }];
        });
        setIsCartOpen(true);
    }, []);

    // Add multiple items at once (e.g. from recommended NPK prescription)
    const addMultipleToCart = useCallback((itemsList) => {
        setCartItems(prev => {
            const updated = [...prev];
            itemsList.forEach(({ fertilizer, bags }) => {
                if (bags <= 0) return;
                const idx = updated.findIndex(i => i.id === fertilizer.id);
                if (idx > -1) {
                    updated[idx].quantity += bags;
                } else {
                    updated.push({
                        id: fertilizer.id,
                        name: fertilizer.name,
                        nutrientGrade: fertilizer.nutrientGrade,
                        bagWeightKg: fertilizer.bagWeightKg,
                        mrp: fertilizer.mrp,
                        subsidized: fertilizer.subsidized,
                        manufacturer: fertilizer.manufacturer,
                        commissionRate: fertilizer.commissionRate || 0.035,
                        quantity: bags
                    });
                }
            });
            return updated;
        });
        setIsCartOpen(true);
    }, []);

    // Update quantity (+1 or -1)
    const updateQuantity = useCallback((id, delta) => {
        setCartItems(prev => {
            return prev.map(item => {
                if (item.id === id) {
                    const newQty = item.quantity + delta;
                    return newQty > 0 ? { ...item, quantity: newQty } : null;
                }
                return item;
            }).filter(Boolean);
        });
    }, []);

    // Remove single item
    const removeFromCart = useCallback((id) => {
        setCartItems(prev => prev.filter(item => item.id !== id));
    }, []);

    // Clear entire cart
    const clearCart = useCallback(() => {
        setCartItems([]);
    }, []);

    // Totals calculation
    const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const cartTotal = cartItems.reduce((sum, item) => sum + (item.mrp * item.quantity), 0);
    
    // Commission earned by KisanSahayak platform (3.5% paid by fertilizer manufacturer)
    const totalCommission = Number((cartTotal * 0.035).toFixed(2));

    // Place order
    const placeOrder = useCallback((details = {}) => {
        if (cartItems.length === 0) return null;

        const order = {
            orderId: 'KS-FERT-' + Math.floor(100000 + Math.random() * 900000),
            date: new Date().toISOString(),
            items: [...cartItems],
            totalAmount: cartTotal,
            commissionEarned: totalCommission,
            status: 'Confirmed - Awaiting PACS Dispatch',
            deliveryType: details.deliveryType || 'PACS Society Pickup',
            deliveryAddress: details.address || 'Village Primary Agriculture Credit Society (PACS Center)',
            farmerName: details.farmerName || 'Registered Farmer',
            phone: details.phone || '+91 98765 43210'
        };

        try {
            const existingOrders = JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY) || '[]');
            localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify([order, ...existingOrders]));
        } catch { /* ignored */ }

        setLastOrder(order);
        clearCart();
        return order;
    }, [cartItems, cartTotal, totalCommission, clearCart]);

    return (
        <CartContext.Provider value={{
            cartItems,
            cartCount,
            cartTotal,
            totalCommission,
            isCartOpen,
            setIsCartOpen,
            addToCart,
            addMultipleToCart,
            updateQuantity,
            removeFromCart,
            clearCart,
            placeOrder,
            lastOrder,
            setLastOrder
        }}>
            {children}
        </CartContext.Provider>
    );
};

export default CartContext;
