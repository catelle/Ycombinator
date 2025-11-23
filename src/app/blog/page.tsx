'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { BlogPost } from '@/types';
import Link from 'next/link';
import Image from 'next/image';

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const q = query(collection(db, 'blog'), orderBy('publishedAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const postsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          publishedAt: doc.data().publishedAt.toDate()
        })) as BlogPost[];
        setPosts(postsData);
      } catch (error) {
        console.error('Error fetching blog posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const filteredPosts = posts.filter(post => 
    !selectedCategory || post.category === selectedCategory
  );

  const categories = [...new Set(posts.map(p => p.category))];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading blog posts...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Hair Care Tips & Guides</h1>
      
      <div className="mb-6">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPosts.map(post => (
          <article key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="relative h-48">
              <Image
                src={post.imageUrl}
                alt={post.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm">
                  {post.category}
                </span>
                <time className="text-gray-500 text-sm">
                  {post.publishedAt.toLocaleDateString()}
                </time>
              </div>
              
              <h2 className="font-bold text-xl mb-3 line-clamp-2">
                <Link href={`/blog/${post.id}`} className="hover:text-purple-600">
                  {post.title}
                </Link>
              </h2>
              
              <p className="text-gray-600 mb-4 line-clamp-3">
                {post.excerpt}
              </p>
              
              <Link 
                href={`/blog/${post.id}`}
                className="text-purple-600 hover:text-purple-800 font-medium"
              >
                Read More →
              </Link>
            </div>
          </article>
        ))}
      </div>

      {filteredPosts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No blog posts found.</p>
        </div>
      )}
    </div>
  );
}