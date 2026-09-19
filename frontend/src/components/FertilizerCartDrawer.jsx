import React, { useState } from 'react';
import { useCart } from '../context/CartContext';

const FertilizerCartDrawer = () => {
    const {
        cartItems,
        cartCount,
        cartTotal,
        totalCommission,
        isCartOpen,
        setIsCartOpen,
        updateQuantity,
        removeFromCart,
        clearCart,
        placeOrder,
        lastOrder,
        setLastOrder
    } = useCart();

    const [deliveryType, setDeliveryType] = useState('pacs');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderComplete, setOrderComplete] = useState(null);

    if (!isCartOpen) return null;

    const handleCheckout = () => {
        setIsSubmitting(true);
        setTimeout(() => {
            const order = placeOrder({
                deliveryType: deliveryType === 'pacs' ? 'PACS Society Pickup (Free)' : 'Doorstep Tractor Delivery',
                address: deliveryType === 'pacs' ? 'Block PACS Center / Kisan Seva Kendra' : 'Farm Gate Delivery'
            });
            setIsSubmitting(false);
            setOrderComplete(order);
        }, 900);
    };

    const handleClose = () => {
        setIsCartOpen(false);
        setOrderComplete(null);
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
            <div 
                className="w-full max-w-md bg-white dark:bg-[#121c16] h-full shadow-2xl flex flex-col border-l border-emerald-500/20 text-gray-900 dark:text-gray-100 overflow-hidden font-display antialiased animate-slide-left"
                style={{ animationDuration: '0.25s' }}
            >
                {/* ── Header ── */}
                <div className="px-5 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between shadow-md">
                    <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-2xl">shopping_cart</span>
                        <div>
                            <h2 className="text-base font-extrabold leading-tight">Fertilizer Cart & Order</h2>
                            <p className="text-[11px] text-emerald-100 font-medium">Subsidized Government NBS Rates</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleClose}
                        className="p-1.5 rounded-full hover:bg-white/20 active:scale-95 transition-all"
                    >
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>

                {/* ── Order Complete State ── */}
                {orderComplete ? (
                    <div className="flex-1 p-6 flex flex-col items-center justify-center text-center overflow-y-auto">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mb-4 ring-8 ring-emerald-500/10 animate-bounce">
                            <span className="material-symbols-outlined text-3xl">check_circle</span>
                        </div>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white mb-1">Order Placed Successfully!</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                            Receipt generated and forwarded to your local PACS Cooperative Dealer.
                        </p>

                        <div className="w-full bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 text-left mb-5 space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-400 font-medium">Order Number:</span>
                                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{orderComplete.orderId}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-400 font-medium">Fulfillment:</span>
                                <span className="font-bold text-gray-700 dark:text-gray-200">{orderComplete.deliveryType}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-400 font-medium">Total Bags:</span>
                                <span className="font-bold text-gray-700 dark:text-gray-200">{orderComplete.items.reduce((s, i) => s + i.quantity, 0)} Bags</span>
                            </div>
                            <div className="flex justify-between text-sm pt-2 border-t border-emerald-500/15">
                                <span className="font-bold text-gray-800 dark:text-gray-200">Payable at Delivery:</span>
                                <span className="font-black text-emerald-600 dark:text-emerald-400 text-base">₹{orderComplete.totalAmount.toLocaleString('en-IN')}</span>
                            </div>
                        </div>

                        {/* Commission notification */}
                        <div className="w-full bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-left mb-6 flex items-start gap-2.5">
                            <span className="material-symbols-outlined text-blue-500 text-lg shrink-0 mt-0.5">monetization_on</span>
                            <div>
                                <p className="text-[11px] font-bold text-blue-700 dark:text-blue-300 leading-tight">Partner Affiliate Commission Credited</p>
                                <p className="text-[10px] text-blue-600/80 dark:text-blue-300/80 mt-0.5">
                                    ₹{orderComplete.commissionEarned} (3.5%) will be credited to KisanSahayak directly by IFFCO / KRIBHCO manufacturer.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleClose}
                            className="w-full py-3 rounded-xl bg-emerald-600 text-white font-extrabold text-sm active:scale-95 transition-all shadow-lg shadow-emerald-600/30"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                ) : cartItems.length === 0 ? (
                    /* ── Empty Cart State ── */
                    <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-3">
                            <span className="material-symbols-outlined text-4xl text-slate-400">production_quantity_limits</span>
                        </div>
                        <h3 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-1">Your cart is empty</h3>
                        <p className="text-xs text-gray-400 max-w-xs mb-5">
                            Generate an NPK Soil Prescription or add Urea, DAP, and Potash directly to place an order.
                        </p>
                        <button
                            onClick={handleClose}
                            className="px-6 py-2.5 rounded-xl bg-emerald-600/10 border border-emerald-600/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs active:scale-95 transition-all"
                        >
                            Browse Fertilizers
                        </button>
                    </div>
                ) : (
                    /* ── Active Cart Items ── */
                    <>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {/* Commission Info Banner */}
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 flex items-start gap-2.5">
                                <span className="material-symbols-outlined text-amber-500 text-lg shrink-0 mt-0.5">handshake</span>
                                <div className="text-[11px] leading-snug">
                                    <span className="font-bold text-amber-800 dark:text-amber-300 block mb-0.5">
                                        Subsidized Dealer Affiliate Model
                                    </span>
                                    <span className="text-gray-600 dark:text-gray-300">
                                        You pay exact GOI subsidized MRP. KisanSahayak receives a <strong>3.5% affiliate commission</strong> directly from fertilizer manufacturers.
                                    </span>
                                </div>
                            </div>

                            {/* Cart items list */}
                            {cartItems.map((item) => (
                                <div 
                                    key={item.id}
                                    className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-3 flex items-center gap-3 shadow-sm"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-2xl">
                                            {item.id === 'urea' ? 'grain' : item.id === 'dap' ? 'energy_savings_leaf' : 'compost'}
                                        </span>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">{item.name}</h4>
                                            <button 
                                                onClick={() => removeFromCart(item.id)}
                                                className="text-gray-400 hover:text-red-500 transition-colors ml-1"
                                                title="Remove"
                                            >
                                                <span className="material-symbols-outlined text-sm">delete</span>
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                                            {item.nutrientGrade} • {item.bagWeightKg} kg bag
                                        </p>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                                                ₹{item.mrp.toFixed(2)} <span className="text-[9px] font-normal text-gray-400">/ bag</span>
                                            </span>

                                            {/* Quantity controls */}
                                            <div className="flex items-center gap-2 bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-0.5">
                                                <button 
                                                    onClick={() => updateQuantity(item.id, -1)}
                                                    className="text-gray-500 hover:text-emerald-500 active:scale-90 text-xs font-bold"
                                                >
                                                    -
                                                </button>
                                                <span className="text-xs font-extrabold text-gray-800 dark:text-gray-100 min-w-4 text-center">
                                                    {item.quantity}
                                                </span>
                                                <button 
                                                    onClick={() => updateQuantity(item.id, 1)}
                                                    className="text-gray-500 hover:text-emerald-500 active:scale-90 text-xs font-bold"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Delivery Options */}
                            <div className="pt-2">
                                <label className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 block mb-2">
                                    Fulfillment Method
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setDeliveryType('pacs')}
                                        className={`p-2.5 rounded-xl border text-left transition-all ${
                                            deliveryType === 'pacs'
                                                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
                                                : 'bg-white/5 border-slate-200 dark:border-white/10 text-gray-500'
                                        }`}
                                    >
                                        <div className="flex items-center gap-1 text-xs">
                                            <span className="material-symbols-outlined text-sm">storefront</span>
                                            PACS Society
                                        </div>
                                        <p className="text-[9px] text-gray-400 mt-0.5 font-normal">Pick up at local depot (Free)</p>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setDeliveryType('home')}
                                        className={`p-2.5 rounded-xl border text-left transition-all ${
                                            deliveryType === 'home'
                                                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
                                                : 'bg-white/5 border-slate-200 dark:border-white/10 text-gray-500'
                                        }`}
                                    >
                                        <div className="flex items-center gap-1 text-xs">
                                            <span className="material-symbols-outlined text-sm">local_shipping</span>
                                            Farm Gate
                                        </div>
                                        <p className="text-[9px] text-gray-400 mt-0.5 font-normal">Tractor trolley delivery</p>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ── Footer / Checkout ── */}
                        <div className="p-4 bg-slate-50 dark:bg-black/30 border-t border-slate-200 dark:border-white/10 space-y-3">
                            <div className="space-y-1.5 text-xs">
                                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                                    <span>Total Fertilizer Quantity:</span>
                                    <span className="font-bold text-gray-800 dark:text-gray-200">{cartCount} Bags</span>
                                </div>
                                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                                    <span>Platform Referral Incentive:</span>
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">₹{totalCommission} (Paid by IFFCO)</span>
                                </div>
                                <div className="flex justify-between text-base font-black text-gray-900 dark:text-white pt-1 border-t border-slate-200 dark:border-white/10">
                                    <span>Total Payable:</span>
                                    <span className="text-emerald-600 dark:text-emerald-400">₹{cartTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleCheckout}
                                disabled={isSubmitting}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-emerald-600/30 disabled:opacity-50 cursor-pointer"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Connecting to PACS Dealer...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-lg">check_circle</span>
                                        Confirm Fertilizer Order
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default FertilizerCartDrawer;
