'use client';

import Link from 'next/link';
import { ShoppingCart, User, LogOut } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useSimpleAuth as useAuth } from '@/hooks/useSimpleAuth';
import { useState, useEffect } from 'react';
import AuthModal from './AuthModal';

export default function Navbar() {
  const { itemCount } = useCart();
  const { user, logout, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Force re-render when user changes
  useEffect(() => {
    // This will trigger a re-render when user state changes
  }, [user]);

  return (
    <nav className="bg-black shadow-2xl border-b border-yellow-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
            EliteMentors
          </Link>
          
          <div className="hidden md:flex space-x-8">
            <Link href="/products" className="text-white hover:text-yellow-400 font-medium transition-colors">
              Products
            </Link>
            <Link href="/mentors" className="text-white hover:text-yellow-400 font-medium transition-colors">
              Mentors
            </Link>
            <Link href="/blog" className="text-white hover:text-yellow-400 font-medium transition-colors">
              Blog
            </Link>
            {user?.role === 'admin' && (
              <Link href="/admin" className="text-white hover:text-yellow-400 font-medium transition-colors">
                Admin
              </Link>
            )}
            {user && (
              <Link href="/dashboard" className="text-white hover:text-yellow-400 font-medium transition-colors">
                Dashboard
              </Link>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/cart" className="relative">
              <ShoppingCart className="h-6 w-6 text-white hover:text-yellow-400 transition-colors" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {itemCount}
                </span>
              )}
            </Link>
            
            {!loading && (
              user ? (
                <div className="flex items-center space-x-3">
                  <span className="text-white font-medium">{user.name}</span>
                  <button
                    onClick={logout}
                    className="text-white hover:text-yellow-400 transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-4 py-2 rounded-lg font-bold hover:from-yellow-500 hover:to-yellow-700 transition-all"
                >
                  Sign In
                </button>
              )
            )}
          </div>
        </div>
      </div>
      
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </nav>
  );
}