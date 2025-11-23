'use client';

import { useState } from 'react';
import { useCart } from '@/hooks/useCart';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order } from '@/types';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
  const { cart, total, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    shippingAddress: ''
  });
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const order: Omit<Order, 'id'> = {
        items: cart,
        total,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        shippingAddress: formData.shippingAddress,
        createdAt: new Date()
      };

      await addDoc(collection(db, 'orders'), order);
      clearCart();
      router.push('/order-success');
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Error processing order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-500">Your cart is empty</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-bold mb-4">Order Summary</h2>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            {cart.map(item => (
              <div key={item.product.id} className="flex justify-between">
                <span>{item.product.name} x {item.quantity}</span>
                <span>${(item.product.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t pt-2 font-bold flex justify-between">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-bold mb-4">Shipping Information</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.customerName}
                onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                required
                value={formData.customerEmail}
                onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Shipping Address</label>
              <textarea
                required
                rows={3}
                value={formData.shippingAddress}
                onChange={(e) => setFormData({...formData, shippingAddress: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 font-semibold"
            >
              {loading ? 'Processing...' : 'Place Order'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}