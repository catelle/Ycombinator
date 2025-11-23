export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  inStock: boolean;
}

export interface Mentor {
  id: string;
  name: string;
  bio: string;
  specialties: string[];
  imageUrl: string;
  hourlyRate: number;
  availability: string[];
  category: 'hair-care' | 'public-speaking' | 'professional';
  userId?: string;
}

export interface Booking {
  id: string;
  mentorId: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  date: string;
  time: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: Date;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  imageUrl: string;
  category: string;
  publishedAt: Date;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  userId?: string;
  createdAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'mentor' | 'client';
  createdAt: Date;
}

export interface MentorshipSession {
  id: string;
  bookingId: string;
  mentorId: string;
  clientId: string;
  sessionNotes?: string;
  resources?: string[];
  nextSteps?: string;
  meetingRoomId?: string;
  status: 'scheduled' | 'in-progress' | 'completed';
  createdAt: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  type: 'basic' | 'premium' | 'elite';
  status: 'active' | 'cancelled' | 'expired';
  startDate: Date;
  endDate: Date;
  price: number;
}

export interface AfroBox {
  id: string;
  name: string;
  description: string;
  price: number;
  items: string[];
  imageUrl: string;
  category: 'hair-care' | 'styling' | 'premium';
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  read: boolean;
}

export interface MeetingRoom {
  id: string;
  sessionId: string;
  roomUrl: string;
  isActive: boolean;
  createdAt: Date;
}