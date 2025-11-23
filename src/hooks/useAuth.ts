'use client';

import { useState, useEffect } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User } from '@/types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUser({ id: firebaseUser.uid, ...userDoc.data() } as User);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      if (error.code === 'auth/operation-not-allowed') {
        throw new Error('Email/password authentication is not enabled. Please contact support.');
      }
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string, role: 'mentor' | 'client' = 'client') => {
    try {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
      const userData: Omit<User, 'id'> = {
        email,
        name,
        role,
        createdAt: new Date()
      };
      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
    } catch (error: any) {
      if (error.code === 'auth/operation-not-allowed') {
        throw new Error('Email/password authentication is not enabled. Please contact support.');
      }
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return {
    user,
    firebaseUser,
    loading,
    login,
    register,
    logout,
    isAdmin: user?.role === 'admin',
    isMentor: user?.role === 'mentor',
    isClient: user?.role === 'client'
  };
};