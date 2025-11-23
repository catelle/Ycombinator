'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product } from '@/types';
import { useCart } from '@/hooks/useCart';
import Image from 'next/image';
import { useParams } from 'next/navigation';

export default function ProductDetailPage() {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const params = useParams();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const docRef = doc(db, 'products', params.id as string);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() } as Product);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading product...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Product not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="relative h-96 lg:h-[500px]">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover rounded-lg"
          />
        </div>
        
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <p className="text-gray-600 mb-4">{product.category}</p>
            <p className="text-4xl font-bold text-purple-600 mb-6">
              ${product.price}
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="text-gray-700 leading-relaxed">{product.description}</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium">Quantity:</label>
            <select
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="border rounded px-3 py-1"
            >
              {[1,2,3,4,5].map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>
          
          <button
            onClick={() => addToCart(product, quantity)}
            disabled={!product.inStock}
            className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 font-semibold"
          >
            {product.inStock ? 'Add to Cart' : 'Out of Stock'}
          </button>
          
          <div className="text-sm text-gray-600">
            {product.inStock ? (
              <span className="text-green-600">✓ In Stock</span>
            ) : (
              <span className="text-red-600">✗ Out of Stock</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}