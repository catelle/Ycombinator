export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'admin' | 'member' | 'suspended';
  createdAt: Date;
  verified?: boolean;
  suspended?: boolean;
  emailVerified?: boolean;
  matchLimit?: number;
}

export enum MatchState {
  OPEN = 'OPEN',
  UNLOCKED = 'UNLOCKED',
  LOCKED = 'LOCKED',
  VERIFIED = 'VERIFIED'
}

export type ProfileRole =
  | 'technical'
  | 'business'
  | 'product'
  | 'design'
  | 'marketing'
  | 'operations'
  | 'other';

export type CommitmentLevel = 'exploring' | 'part-time' | 'full-time' | 'weekends';

export interface Profile {
  id: string;
  userId: string;
  name: string;
  alias?: string;
  role: ProfileRole;
  skills: string[];
  languages: string[];
  achievements: string[];
  interests: string;
  commitment: CommitmentLevel;
  location: string;
  contactEmail?: string;
  contactPhone?: string;
  photoUrl?: string;
  verified?: boolean;
  completed?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicProfile {
  id: string;
  role: ProfileRole;
  skills: string[];
  languages: string[];
  achievements: string[];
  interests: string;
  commitment: CommitmentLevel;
  location: string;
}

export interface Match {
  id: string;
  userId: string;
  matchedUserId: string;
  score: number;
  state: MatchState;
  matchType: 'cofounder' | 'mentorship' | 'accountability';
  decision?: 'accepted' | 'rejected';
  unlockPaymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  type: 'basic' | 'premium';
  status: 'active' | 'cancelled' | 'expired';
  startDate: Date;
  endDate: Date;
  price: number;
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: 'FCFA';
  type: 'unlock' | 'verification' | 'subscription' | 'match' | 'match_limit';
  status: 'pending' | 'succeeded' | 'failed';
  provider: 'mobile-money' | 'cinetpay';
  reference: string;
  createdAt: Date;
  metadata?: Record<string, string | number | boolean>;
}

export interface VerificationRequest {
  id: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected';
  amount: number;
  createdAt: Date;
  updatedAt: Date;
  reviewedBy?: string;
}

export interface Team {
  id: string;
  ownerId: string;
  memberIds: string[];
  status: 'forming' | 'locked';
  maxMembers: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MatchRequest {
  id: string;
  requesterId: string;
  recipientId: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled' | 'matched';
  score: number;
  requesterPaid: boolean;
  recipientPaid: boolean;
  requesterPaymentId?: string;
  recipientPaymentId?: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  acceptedAt?: Date;
  matchedAt?: Date;
}

export interface Report {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reason: string;
  createdAt: Date;
}

export interface Block {
  id: string;
  blockerId: string;
  blockedUserId: string;
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  actorId: string;
  action: 'payment' | 'unlock' | 'lock' | 'verification';
  metadata: Record<string, string | number | boolean>;
  createdAt: Date;
}

export interface FeatureFlag {
  id: string;
  key: 'mentorship_matching' | 'accountability_partners';
  enabled: boolean;
  updatedAt: Date;
}

export interface AccompanimentRequest {
  id: string;
  teamId: string;
  userId: string;
  type: 'incubator' | 'accelerator' | 'platform';
  providerName?: string;
  createdAt: Date;
}
