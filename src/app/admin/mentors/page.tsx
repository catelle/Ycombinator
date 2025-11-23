'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Mentor } from '@/types';
import { Plus, Trash2 } from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';

export default function AdminMentors() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    specialties: '',
    imageUrl: '',
    hourlyRate: '',
    availability: ''
  });

  useEffect(() => {
    fetchMentors();
  }, []);

  const fetchMentors = async () => {
    const querySnapshot = await getDocs(collection(db, 'mentors'));
    const mentorsData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Mentor[];
    setMentors(mentorsData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDoc(collection(db, 'mentors'), {
      ...formData,
      hourlyRate: parseFloat(formData.hourlyRate),
      specialties: formData.specialties.split(',').map(s => s.trim()),
      availability: formData.availability.split(',').map(s => s.trim())
    });
    setFormData({ name: '', bio: '', specialties: '', imageUrl: '', hourlyRate: '', availability: '' });
    setShowForm(false);
    fetchMentors();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this mentor?')) {
      await deleteDoc(doc(db, 'mentors', id));
      fetchMentors();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Manage Mentors</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-semibold hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg"
        >
          <Plus className="h-4 w-4" />
          Add Mentor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mentors.map(mentor => (
          <div key={mentor.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
            <img src={mentor.imageUrl} alt={mentor.name} className="w-full h-40 object-cover rounded-lg mb-4" />
            <h3 className="font-bold text-lg text-gray-900">{mentor.name}</h3>
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{mentor.bio}</p>
            <p className="text-amber-600 font-bold text-lg mb-3">${mentor.hourlyRate}/hr</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {mentor.specialties.slice(0, 2).map(specialty => (
                <span key={specialty} className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-medium">
                  {specialty}
                </span>
              ))}
            </div>
            <button
              onClick={() => handleDelete(mentor.id)}
              className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-all"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Add Mentor</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mentor Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Specialties (comma separated)</label>
                <input
                  type="text"
                  value={formData.specialties}
                  onChange={(e) => setFormData({...formData, specialties: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Protective Styling, Hair Growth, Product Selection"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hourly Rate</label>
                  <input
                    type="number"
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({...formData, hourlyRate: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
                  <input
                    type="text"
                    value={formData.availability}
                    onChange={(e) => setFormData({...formData, availability: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Monday, Wednesday, Friday"
                    required
                  />
                </div>
              </div>
              <ImageUpload
                onImageUploaded={(url) => setFormData({...formData, imageUrl: url})}
                currentImage={formData.imageUrl}
              />
              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-xl font-semibold hover:from-amber-600 hover:to-orange-600 transition-all"
                >
                  Add Mentor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}