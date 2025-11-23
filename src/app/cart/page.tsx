'use client';

import { useCart } from '@/hooks/useCart';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, Plus, Minus } from 'lucide-react';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, total, clearCart } = useCart();

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Your cart is empty</p>
          <Link 
            href="/products"
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {cart.map(item => (
            <div key={item.product.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center space-x-4">
                <div className="relative h-20 w-20 flex-shrink-0">
                  <Image
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    fill
                    className="object-cover rounded"
                  />
                </div>
                
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{item.product.name}</h3>
                  <p className="text-gray-600">{item.product.category}</p>
                  <p className="text-purple-600 font-bold">${item.product.price}</p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="text-right">
                  <p className="font-bold">${(item.product.price * item.quantity).toFixed(2)}</p>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-red-500 hover:text-red-700 mt-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 h-fit">
          <h2 className="text-xl font-bold mb-4">Order Summary</h2>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping:</span>
              <span>Free</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
          
          <Link
            href="/checkout"
            className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 block text-center font-semibold"
          >
            Proceed to Checkout
          </Link>
          
          <button
            onClick={clearCart}
            className="w-full mt-2 text-gray-500 hover:text-gray-700 text-sm"
          >
            Clear Cart
          </button>
        </div>
      </div>
    </div>
  );
}