'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { BlogPost } from '@/types';
import { Plus, Trash2 } from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';

export default function AdminBlog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    imageUrl: '',
    category: ''
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const querySnapshot = await getDocs(collection(db, 'blog'));
    const postsData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      publishedAt: doc.data().publishedAt?.toDate() || new Date()
    })) as BlogPost[];
    setPosts(postsData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDoc(collection(db, 'blog'), {
      ...formData,
      publishedAt: new Date()
    });
    setFormData({ title: '', content: '', excerpt: '', imageUrl: '', category: '' });
    setShowForm(false);
    fetchPosts();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this blog post?')) {
      await deleteDoc(doc(db, 'blog', id));
      fetchPosts();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Manage Blog Posts</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-semibold hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg"
        >
          <Plus className="h-4 w-4" />
          Add Post
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map(post => (
          <div key={post.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
            <img src={post.imageUrl} alt={post.title} className="w-full h-40 object-cover rounded-lg mb-4" />
            <h3 className="font-bold text-lg text-gray-900 line-clamp-2 mb-2">{post.title}</h3>
            <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-medium mb-3 inline-block">{post.category}</span>
            <p className="text-gray-600 text-sm line-clamp-2 mb-4">{post.excerpt}</p>
            <button
              onClick={() => handleDelete(post.id)}
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
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Add Blog Post</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Post Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Hair Care, Styling, Tips"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Excerpt</label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  rows={2}
                  placeholder="Brief description of the post..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  rows={6}
                  placeholder="Full blog post content..."
                  required
                />
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
                  Add Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}