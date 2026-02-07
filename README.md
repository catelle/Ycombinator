# NappyMine - Cofounder Matchmaking Platform

A matchmaking platform for cofounders and startup teams built with Next.js, MongoDB, and TypeScript.

## Features

- **Email + Password Authentication** with email verification and session cookies
- **Founder Profiles**: Role, skills, startup idea, commitment, and location
- **Rule-based Matching**: Compatibility scoring with role complementarity, skills, commitment, and location
- **Paid Unlocks**: Reveal identity and contact after a Mobile Money unlock
- **Team Locking**: 1:1 or group lock (max 5 members)
- **Optional Verification** with clear safety disclaimer
- **Admin Tools**: Manage users, matches, and verification requests
- **Light/Dark Theme** with user toggle

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: MongoDB (single source of truth)
- **Auth**: Email/password + verification + session cookies
- **Payments**: Mobile Money (abstracted service layer)
- **Icons**: Lucide React

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. MongoDB Setup

Create a MongoDB database and set the following environment variables (for example in `.env.local`):

```
MONGODB_URI="mongodb+srv://<user>:<password>@<cluster>/<db>?retryWrites=true&w=majority"
MONGODB_DB="nappymine"
```

### 3. Email Verification (EmailJS)

Configure EmailJS to send verification codes:

```
EMAILJS_SERVICE_ID="your_service_id"
EMAILJS_TEMPLATE_ID="your_template_id"
EMAILJS_PUBLIC_KEY="your_public_key"
EMAILJS_PRIVATE_KEY="your_private_key"
EMAILJS_ORIGIN="https://your-domain.com"
```

Template params expected: `to_email`, `to_name`, `verification_code`.

### 4. Mobile Money

Payments are abstracted in `src/lib/payments.ts`. Replace the mock implementation with your provider SDK.

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## MongoDB Collections

### Users
```typescript
{
  _id: string;
  email: string;
  name: string;
  phone: string;
  role: 'admin' | 'member' | 'suspended';
  emailVerified: boolean;
  verified?: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Profiles
```typescript
{
  _id: string;
  userId: string;
  name: string;
  alias?: string;
  role: 'technical' | 'business' | 'product' | 'design' | 'marketing' | 'operations' | 'other';
  skills: string[];
  interests: string;
  commitment: 'exploring' | 'part-time' | 'full-time' | 'weekends';
  location: string;
  contactEmail?: string;
  contactPhone?: string;
  photoUrl?: string;
  verified?: boolean;
}
```

### Matches
```typescript
{
  _id: string;
  userId: string;
  matchedUserId: string;
  score: number;
  state: 'OPEN' | 'UNLOCKED' | 'LOCKED' | 'VERIFIED';
  matchType: 'cofounder' | 'mentorship' | 'accountability';
}
```

## Deployment

### Build for Production

```bash
npm run build
```

### Deploy

Deploy to your hosting provider of choice. Ensure MongoDB environment variables are configured.

## Project Structure

```
src/
├── app/                 # Next.js app router pages
│   ├── profile/        # Founder profile flow
│   ├── matches/        # Match browsing and unlocks
│   ├── team/           # Team locking + verification
│   └── admin/          # Admin tools
├── components/         # Reusable React components
├── hooks/             # Custom React hooks
├── lib/               # MongoDB + service modules
└── types/             # TypeScript type definitions
```

## Key Features Implementation

- **Matching Engine**: Rule-based compatibility scoring with modular services
- **Session Auth**: Server-stored sessions backed by MongoDB
- **Payments**: Mobile Money service abstraction with audit logging
- **Trust & Safety**: Reporting, blocking, and verification workflows
