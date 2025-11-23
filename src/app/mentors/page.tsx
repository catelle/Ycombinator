'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Mentor, Booking } from '@/types';
import { useSimpleAuth as useAuth } from '@/hooks/useSimpleAuth';
import Image from 'next/image';

export default function MentorsPage() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [bookingForm, setBookingForm] = useState({
    clientName: '',
    clientEmail: '',
    date: '',
    time: '',
    notes: ''
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchMentors = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'mentors'));
        const mentorsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Mentor[];
        setMentors(mentorsData);
      } catch (error) {
        console.error('Error fetching mentors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMentors();
  }, []);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMentor) return;
    
    setBookingLoading(true);
    try {
      const booking: Omit<Booking, 'id'> = {
        mentorId: selectedMentor.id,
        clientId: user?.id || '',
        clientName: bookingForm.clientName,
        clientEmail: bookingForm.clientEmail,
        date: bookingForm.date,
        time: bookingForm.time,
        notes: bookingForm.notes,
        status: 'pending',
        createdAt: new Date()
      };

      await addDoc(collection(db, 'bookings'), booking);
      alert('Booking successful! We will contact you soon.');
      setSelectedMentor(null);
      setBookingForm({ clientName: '', clientEmail: '', date: '', time: '', notes: '' });
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Error creating booking. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-yellow-400 text-xl">Loading mentors...</div>
      </div>
    );
  }

  const filteredMentors = mentors.filter(mentor => 
    !selectedCategory || mentor.category === selectedCategory
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-2 text-center">
          Elite <span className="text-yellow-400">Mentors</span>
        </h1>
        <p className="text-gray-400 text-center mb-8">Connect with world-class experts in their fields</p>
        
        <div className="flex justify-center mb-8">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-gray-900 border border-yellow-500/20 text-white px-6 py-3 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            <option value="hair-care">Hair Care</option>
            <option value="public-speaking">Public Speaking</option>
            <option value="professional">Professional Development</option>
          </select>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredMentors.map(mentor => (
            <div key={mentor.id} className="bg-gray-900 rounded-2xl overflow-hidden border border-yellow-500/20 hover:border-yellow-500/40 hover:shadow-2xl transition-all transform hover:scale-105">
              <div className="relative h-56">
                <Image
                  src={mentor.imageUrl}
                  alt={mentor.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-yellow-400 text-black px-3 py-1 rounded-full text-xs font-bold uppercase">
                    {mentor.category?.replace('-', ' ') || 'General'}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-bold text-xl mb-2 text-white">{mentor.name}</h3>
                <p className="text-gray-300 mb-4 line-clamp-3">{mentor.bio}</p>
                
                <div className="mb-4">
                  <h4 className="font-semibold mb-2 text-yellow-400">Specialties:</h4>
                  <div className="flex flex-wrap gap-2">
                    {mentor.specialties.map(specialty => (
                      <span key={specialty} className="bg-yellow-400/20 text-yellow-400 px-3 py-1 rounded-full text-sm font-medium">
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-between items-center mb-6">
                  <span className="text-2xl font-bold text-yellow-400">
                    ${mentor.hourlyRate}/hr
                  </span>
                </div>
                
                <button
                  onClick={() => setSelectedMentor(mentor)}
                  className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-black py-3 px-4 rounded-xl font-bold hover:from-yellow-500 hover:to-yellow-700 transition-all"
                >
                  Book Session
                </button>
              </div>
            </div>
          ))}
        </div>

        {selectedMentor && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-md border border-yellow-500/20">
              <h2 className="text-2xl font-bold mb-6 text-white">Book with <span className="text-yellow-400">{selectedMentor.name}</span></h2>
              
              <form onSubmit={handleBooking} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Your Name</label>
                  <input
                    type="text"
                    required
                    value={bookingForm.clientName}
                    onChange={(e) => setBookingForm({...bookingForm, clientName: e.target.value})}
                    className="w-full px-4 py-3 bg-black border border-yellow-500/20 rounded-xl text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Email</label>
                  <input
                    type="email"
                    required
                    value={bookingForm.clientEmail}
                    onChange={(e) => setBookingForm({...bookingForm, clientEmail: e.target.value})}
                    className="w-full px-4 py-3 bg-black border border-yellow-500/20 rounded-xl text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Preferred Date</label>
                  <input
                    type="date"
                    required
                    value={bookingForm.date}
                    onChange={(e) => setBookingForm({...bookingForm, date: e.target.value})}
                    className="w-full px-4 py-3 bg-black border border-yellow-500/20 rounded-xl text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Preferred Time</label>
                  <select
                    required
                    value={bookingForm.time}
                    onChange={(e) => setBookingForm({...bookingForm, time: e.target.value})}
                    className="w-full px-4 py-3 bg-black border border-yellow-500/20 rounded-xl text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  >
                    <option value="">Select time</option>
                    <option value="09:00">9:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="14:00">2:00 PM</option>
                    <option value="15:00">3:00 PM</option>
                    <option value="16:00">4:00 PM</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Notes (Optional)</label>
                  <textarea
                    rows={3}
                    value={bookingForm.notes}
                    onChange={(e) => setBookingForm({...bookingForm, notes: e.target.value})}
                    className="w-full px-4 py-3 bg-black border border-yellow-500/20 rounded-xl text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="Any specific topics or questions?"
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setSelectedMentor(null)}
                    className="flex-1 bg-gray-700 text-white py-3 px-4 rounded-xl hover:bg-gray-600 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black py-3 px-4 rounded-xl font-bold hover:from-yellow-500 hover:to-yellow-700 disabled:opacity-50 transition-all"
                  >
                    {bookingLoading ? 'Booking...' : 'Book Session'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}