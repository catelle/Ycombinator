'use client';

import Link from 'next/link';
import { Package, Users, BookOpen, ShoppingCart, Shield, Calendar } from 'lucide-react';
import { useSimpleAuth as useAuth } from '@/hooks/useSimpleAuth';

export default function AdminDashboard() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-yellow-400 text-xl">Loading...</div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Admin <span className="text-yellow-400">Dashboard</span>
          </h1>
          <p className="text-gray-400">Manage your elite mentorship platform</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/admin/products" className="bg-gray-900 p-8 rounded-2xl border border-yellow-500/20 hover:border-yellow-500/40 hover:shadow-2xl transition-all transform hover:scale-105">
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
              <Package className="h-8 w-8 text-black" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-white">Products</h3>
            <p className="text-gray-400">Manage premium products and inventory</p>
          </Link>
          
          <Link href="/admin/mentors" className="bg-gray-900 p-8 rounded-2xl border border-yellow-500/20 hover:border-yellow-500/40 hover:shadow-2xl transition-all transform hover:scale-105">
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
              <Users className="h-8 w-8 text-black" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-white">Mentors</h3>
            <p className="text-gray-400">Manage mentor profiles and specialties</p>
          </Link>
          
          <Link href="/admin/blog" className="bg-gray-900 p-8 rounded-2xl border border-yellow-500/20 hover:border-yellow-500/40 hover:shadow-2xl transition-all transform hover:scale-105">
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
              <BookOpen className="h-8 w-8 text-black" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-white">Blog Posts</h3>
            <p className="text-gray-400">Manage educational content and articles</p>
          </Link>
          
          <Link href="/admin/orders" className="bg-gray-900 p-8 rounded-2xl border border-yellow-500/20 hover:border-yellow-500/40 hover:shadow-2xl transition-all transform hover:scale-105">
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
              <ShoppingCart className="h-8 w-8 text-black" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-white">Orders</h3>
            <p className="text-gray-400">View and manage customer orders</p>
          </Link>
          
          <Link href="/admin/bookings" className="bg-gray-900 p-8 rounded-2xl border border-yellow-500/20 hover:border-yellow-500/40 hover:shadow-2xl transition-all transform hover:scale-105">
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
              <Calendar className="h-8 w-8 text-black" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-white">Bookings</h3>
            <p className="text-gray-400">Manage mentorship sessions and bookings</p>
          </Link>
          
          <Link href="/admin/users" className="bg-gray-900 p-8 rounded-2xl border border-yellow-500/20 hover:border-yellow-500/40 hover:shadow-2xl transition-all transform hover:scale-105">
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
              <Shield className="h-8 w-8 text-black" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-white">Users</h3>
            <p className="text-gray-400">Manage user accounts and permissions</p>
          </Link>
        </div>
      </div>
    </div>
  );
}