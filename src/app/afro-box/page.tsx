'use client';

import { useState } from 'react';
import { Gift, Star, Truck, Calendar } from 'lucide-react';
import Image from 'next/image';

export default function AfroBoxPage() {
  const [selectedBox, setSelectedBox] = useState('premium');

  const boxes = [
    {
      id: 'basic',
      name: 'Essential Box',
      price: 35,
      items: ['Moisturizing shampoo', 'Leave-in conditioner', 'Hair oil', 'Styling gel', 'Microfiber towel'],
      image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400'
    },
    {
      id: 'premium',
      name: 'Premium Box',
      price: 65,
      popular: true,
      items: ['Premium hair mask', 'Silk pillowcase', 'Scalp massager', 'Organic hair butter', 'Professional brush set', 'Hair vitamins'],
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400'
    },
    {
      id: 'luxury',
      name: 'Luxury Box',
      price: 95,
      items: ['Luxury hair treatment', 'Silk bonnet', 'Professional styling tools', 'Custom hair analysis', 'Exclusive products', 'Personal consultation'],
      image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400'
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Gift className="h-12 w-12 text-yellow-400 mr-4" />
            <h1 className="text-5xl font-bold">
              Monthly <span className="text-yellow-400">Afro Box</span>
            </h1>
          </div>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8">
            Curated premium hair care products delivered to your door every month. 
            Discover new brands and maintain your 4C hair with expert-selected items.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-center bg-gray-900 rounded-2xl p-6">
              <Truck className="h-8 w-8 text-yellow-400 mr-3" />
              <div>
                <p className="font-bold">Free Shipping</p>
                <p className="text-gray-400 text-sm">Worldwide delivery</p>
              </div>
            </div>
            <div className="flex items-center justify-center bg-gray-900 rounded-2xl p-6">
              <Star className="h-8 w-8 text-yellow-400 mr-3" />
              <div>
                <p className="font-bold">Expert Curated</p>
                <p className="text-gray-400 text-sm">By hair professionals</p>
              </div>
            </div>
            <div className="flex items-center justify-center bg-gray-900 rounded-2xl p-6">
              <Calendar className="h-8 w-8 text-yellow-400 mr-3" />
              <div>
                <p className="font-bold">Monthly Delivery</p>
                <p className="text-gray-400 text-sm">Cancel anytime</p>
              </div>
            </div>
          </div>
        </div>

        {/* Box Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {boxes.map(box => (
            <div 
              key={box.id}
              className={`relative bg-gray-900 rounded-3xl overflow-hidden border-2 transition-all cursor-pointer ${
                selectedBox === box.id 
                  ? 'border-yellow-500 transform scale-105' 
                  : 'border-gray-700 hover:border-yellow-500/50'
              } ${box.popular ? 'ring-2 ring-yellow-400' : ''}`}
              onClick={() => setSelectedBox(box.id)}
            >
              {box.popular && (
                <div className="absolute top-4 right-4 z-10">
                  <div className="bg-yellow-400 text-black px-3 py-1 rounded-full font-bold text-sm">
                    Popular
                  </div>
                </div>
              )}
              
              <div className="relative h-48">
                <Image
                  src={box.image}
                  alt={box.name}
                  fill
                  className="object-cover"
                />
              </div>
              
              <div className="p-6">
                <h3 className="text-2xl font-bold mb-2">{box.name}</h3>
                <div className="flex items-center mb-4">
                  <span className="text-3xl font-bold text-yellow-400">${box.price}</span>
                  <span className="text-gray-400 ml-2">/month</span>
                </div>
                
                <div className="mb-6">
                  <h4 className="font-semibold mb-3 text-yellow-400">What's Inside:</h4>
                  <ul className="space-y-2">
                    {box.items.map((item, index) => (
                      <li key={index} className="text-gray-300 text-sm flex items-center">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3 flex-shrink-0"></div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <button 
                  className={`w-full py-3 rounded-xl font-bold transition-all ${
                    selectedBox === box.id
                      ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black'
                      : 'bg-gray-800 text-white hover:bg-gray-700'
                  }`}
                >
                  {selectedBox === box.id ? 'Selected' : 'Select Box'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center bg-gradient-to-r from-yellow-400/10 to-yellow-600/10 rounded-3xl p-12">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Hair Care Routine?</h2>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who have discovered their perfect hair care products through our monthly boxes.
          </p>
          <button className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-12 py-4 rounded-xl font-bold text-lg hover:from-yellow-500 hover:to-yellow-700 transition-all transform hover:scale-105">
            Subscribe Now
          </button>
          <p className="text-gray-400 mt-4">First box ships within 3-5 business days • Cancel anytime</p>
        </div>
      </div>
    </div>
  );
}