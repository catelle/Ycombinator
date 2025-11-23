'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, query, where, collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from '@/types';

export const useSimpleAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // For demo purposes, create user if doesn't exist
    const q = query(collection(db, 'users'), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    let userData: User;
    
    if (querySnapshot.empty) {
      // Create new user on login
      const userId = Date.now().toString();
      userData = {
        id: userId,
        email,
        name: email.split('@')[0],
        role: 'client',
        createdAt: new Date()
      };
      await setDoc(doc(db, 'users', userId), userData);
    } else {
      const userDoc = querySnapshot.docs[0];
      userData = { id: userDoc.id, ...userDoc.data() } as User;
    }
    
    setUser(userData);
    localStorage.setItem('currentUser', JSON.stringify(userData));
  };

  const register = async (email: string, password: string, name: string, role: 'mentor' | 'client' = 'client') => {
    const userId = Date.now().toString();
    const userData: User = {
      id: userId,
      email,
      name,
      role,
      createdAt: new Date()
    };
    
    await setDoc(doc(db, 'users', userId), userData);
    setUser(userData);
    localStorage.setItem('currentUser', JSON.stringify(userData));
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  return {
    user,
    loading,
    login,
    register,
    logout,
    isAdmin: user?.role === 'admin',
    isMentor: user?.role === 'mentor',
    isClient: user?.role === 'client'
  };
};