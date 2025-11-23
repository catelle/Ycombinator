'use client';

import { useState } from 'react';
import { Crown, Check, Star } from 'lucide-react';
import Link from 'next/link';

export default function SubscriptionPage() {
  const [selectedPlan, setSelectedPlan] = useState('premium');

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      price: 29,
      features: [
        '2 mentoring sessions/month',
        'Basic chat support',
        'Access to blog content',
        'Community forum access'
      ]
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 79,
      popular: true,
      features: [
        '6 mentoring sessions/month',
        'Priority booking',
        'Video call sessions',
        'Personal progress tracking',
        'Monthly Afro Box (Basic)',
        '24/7 chat support'
      ]
    },
    {
      id: 'elite',
      name: 'Elite',
      price: 149,
      features: [
        'Unlimited mentoring sessions',
        'VIP mentor access',
        'Personal styling consultation',
        'Custom hair care plan',
        'Premium Afro Box',
        'Exclusive events access',
        'Personal success manager'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6">
            Choose Your <span className="text-yellow-400">Elite</span> Plan
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Unlock premium mentorship experiences and accelerate your personal growth journey
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map(plan => (
            <div 
              key={plan.id}
              className={`relative bg-gray-900 rounded-3xl p-8 border-2 transition-all cursor-pointer ${
                selectedPlan === plan.id 
                  ? 'border-yellow-500 transform scale-105' 
                  : 'border-gray-700 hover:border-yellow-500/50'
              } ${plan.popular ? 'ring-2 ring-yellow-400' : ''}`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-yellow-400 text-black px-4 py-2 rounded-full font-bold text-sm flex items-center">
                    <Star className="h-4 w-4 mr-1" />
                    Most Popular
                  </div>
                </div>
              )}
              
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-center justify-center mb-4">
                  <span className="text-4xl font-bold text-yellow-400">${plan.price}</span>
                  <span className="text-gray-400 ml-2">/month</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="h-5 w-5 text-yellow-400 mr-3 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <button 
                className={`w-full py-3 rounded-xl font-bold transition-all ${
                  selectedPlan === plan.id
                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black'
                    : 'bg-gray-800 text-white hover:bg-gray-700'
                }`}
              >
                {selectedPlan === plan.id ? 'Selected' : 'Select Plan'}
              </button>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-12 py-4 rounded-xl font-bold text-lg hover:from-yellow-500 hover:to-yellow-700 transition-all transform hover:scale-105">
            Start Your Elite Journey
          </button>
          <p className="text-gray-400 mt-4">30-day money-back guarantee • Cancel anytime</p>
        </div>
      </div>
    </div>
  );
}