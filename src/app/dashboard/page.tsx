'use client';

import { useSimpleAuth as useAuth } from '@/hooks/useSimpleAuth';
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Booking, MentorshipSession, Subscription, Message } from '@/types';
import Link from 'next/link';
import { Calendar, Clock, Video, MessageSquare, Package, Crown, Users, Gift } from 'lucide-react';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [sessions, setSessions] = useState<MentorshipSession[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    // Fetch bookings
    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('clientId', '==', user.id)
    );
    const bookingsSnapshot = await getDocs(bookingsQuery);
    const bookingsData = bookingsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate()
    })) as Booking[];
    setBookings(bookingsData);

    // Fetch sessions
    const sessionsQuery = query(
      collection(db, 'mentorshipSessions'),
      where('clientId', '==', user.id)
    );
    const sessionsSnapshot = await getDocs(sessionsQuery);
    const sessionsData = sessionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate()
    })) as MentorshipSession[];
    setSessions(sessionsData);

    // Fetch subscription
    const subQuery = query(
      collection(db, 'subscriptions'),
      where('userId', '==', user.id)
    );
    const subSnapshot = await getDocs(subQuery);
    if (!subSnapshot.empty) {
      const subData = subSnapshot.docs[0];
      setSubscription({
        id: subData.id,
        ...subData.data(),
        startDate: subData.data().startDate.toDate(),
        endDate: subData.data().endDate.toDate()
      } as Subscription);
    }

    // Count unread messages
    const messagesQuery = query(
      collection(db, 'messages'),
      where('receiverId', '==', user.id),
      where('read', '==', false)
    );
    const messagesSnapshot = await getDocs(messagesQuery);
    setUnreadMessages(messagesSnapshot.size);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-yellow-400 text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Please sign in to access your dashboard</h1>
          <Link href="/" className="text-yellow-400 hover:text-yellow-300">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Welcome back, <span className="text-yellow-400">{user.name}</span>
          </h1>
          <div className="flex items-center space-x-4">
            <p className="text-gray-400 capitalize">{user.role} Dashboard</p>
            {subscription && (
              <div className="flex items-center bg-yellow-400/20 px-3 py-1 rounded-full">
                <Crown className="h-4 w-4 text-yellow-400 mr-2" />
                <span className="text-yellow-400 font-medium capitalize">{subscription.type} Member</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900 rounded-2xl p-6 border border-yellow-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Sessions</p>
                <p className="text-2xl font-bold text-yellow-400">{sessions.filter(s => s.status === 'scheduled').length}</p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-400" />
            </div>
          </div>
          
          <div className="bg-gray-900 rounded-2xl p-6 border border-yellow-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Messages</p>
                <p className="text-2xl font-bold text-yellow-400">{unreadMessages}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-yellow-400" />
            </div>
          </div>
          
          <div className="bg-gray-900 rounded-2xl p-6 border border-yellow-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Completed</p>
                <p className="text-2xl font-bold text-yellow-400">{sessions.filter(s => s.status === 'completed').length}</p>
              </div>
              <Users className="h-8 w-8 text-yellow-400" />
            </div>
          </div>
          
          <div className="bg-gray-900 rounded-2xl p-6 border border-yellow-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Subscription</p>
                <p className="text-2xl font-bold text-yellow-400">{subscription ? 'Active' : 'None'}</p>
              </div>
              <Crown className="h-8 w-8 text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upcoming Sessions */}
          <div className="lg:col-span-2 bg-gray-900 rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <Calendar className="h-6 w-6 text-yellow-400 mr-3" />
              Upcoming Sessions
            </h2>
            {bookings.length > 0 ? (
              <div className="space-y-4">
                {bookings.slice(0, 3).map(booking => (
                  <div key={booking.id} className="bg-black rounded-xl p-4 border border-yellow-500/20">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-yellow-400">{booking.date}</h3>
                        <div className="flex items-center text-gray-300 text-sm mt-1">
                          <Clock className="h-4 w-4 mr-2" />
                          {booking.time}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => {
                            const roomId = `session-${booking.id}-${Date.now()}`;
                            window.open(`/video-call/${roomId}`, '_blank', 'width=1200,height=800');
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm flex items-center"
                        >
                          <Video className="h-4 w-4 mr-1" />
                          Join
                        </button>
                        <Link 
                          href="/messages"
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm flex items-center"
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Chat
                        </Link>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      booking.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                      booking.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {booking.status}
                    </span>
                    {booking.notes && (
                      <p className="text-gray-400 text-sm mt-2">{booking.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">No upcoming sessions</p>
                <Link 
                  href="/mentors"
                  className="inline-block bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-6 py-2 rounded-lg font-bold hover:from-yellow-500 hover:to-yellow-700 transition-all"
                >
                  Book a Session
                </Link>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            {/* Subscription Card */}
            <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl p-6 text-black">
              <div className="flex items-center mb-4">
                <Crown className="h-6 w-6 mr-2" />
                <h3 className="font-bold text-lg">Membership</h3>
              </div>
              {subscription ? (
                <div>
                  <p className="font-bold capitalize">{subscription.type} Plan</p>
                  <p className="text-sm opacity-80">Expires: {subscription.endDate.toLocaleDateString()}</p>
                  <button className="mt-3 bg-black text-yellow-400 px-4 py-2 rounded-lg font-bold text-sm">
                    Manage Plan
                  </button>
                </div>
              ) : (
                <div>
                  <p className="font-bold mb-2">Unlock Premium Features</p>
                  <p className="text-sm opacity-80 mb-3">Get unlimited sessions, priority booking, and exclusive content</p>
                  <Link href="/subscription" className="bg-black text-yellow-400 px-4 py-2 rounded-lg font-bold text-sm inline-block">
                    Upgrade Now
                  </Link>
                </div>
              )}
            </div>

            {/* Afro Box */}
            <div className="bg-gray-900 rounded-2xl p-6 border border-yellow-500/20">
              <div className="flex items-center mb-4">
                <Gift className="h-6 w-6 text-yellow-400 mr-2" />
                <h3 className="font-bold text-white">Monthly Afro Box</h3>
              </div>
              <p className="text-gray-400 text-sm mb-4">Curated hair care products delivered monthly</p>
              <Link href="/afro-box" className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-4 py-2 rounded-lg font-bold text-sm inline-block">
                Subscribe
              </Link>
            </div>

            {/* Messages */}
            <div className="bg-gray-900 rounded-2xl p-6 border border-yellow-500/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white">Messages</h3>
                {unreadMessages > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">{unreadMessages}</span>
                )}
              </div>
              <p className="text-gray-400 text-sm mb-4">Connect with your mentors</p>
              <Link href="/messages" className="text-yellow-400 hover:text-yellow-300 font-medium">
                View All Messages →
              </Link>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link 
            href="/mentors"
            className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black p-4 rounded-2xl font-bold text-center hover:from-yellow-500 hover:to-yellow-700 transition-all transform hover:scale-105"
          >
            Find Mentors
          </Link>
          <Link 
            href="/products"
            className="bg-gray-900 border border-yellow-500/20 text-white p-4 rounded-2xl font-bold text-center hover:bg-gray-800 transition-all"
          >
            Shop Products
          </Link>
          <Link 
            href="/afro-box"
            className="bg-gray-900 border border-yellow-500/20 text-white p-4 rounded-2xl font-bold text-center hover:bg-gray-800 transition-all"
          >
            Afro Box
          </Link>
          <Link 
            href="/subscription"
            className="bg-gray-900 border border-yellow-500/20 text-white p-4 rounded-2xl font-bold text-center hover:bg-gray-800 transition-all"
          >
            Upgrade Plan
          </Link>
        </div>
      </div>
    </div>
  );
}