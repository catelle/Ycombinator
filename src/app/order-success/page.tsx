import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export default function OrderSuccessPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
      <h1 className="text-3xl font-bold mb-4">Order Placed Successfully!</h1>
      <p className="text-gray-600 mb-8">
        Thank you for your order. We'll send you a confirmation email shortly with tracking information.
      </p>
      <div className="space-x-4">
        <Link 
          href="/products"
          className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700"
        >
          Continue Shopping
        </Link>
        <Link 
          href="/"
          className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}