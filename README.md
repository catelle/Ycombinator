# NappyMine - 4C Hair Care Platform

A comprehensive platform for 4C hair care products and mentoring services built with Next.js, Firebase, and TypeScript.

## Features

- **Product Catalog**: Browse and search hair care products with categories and filters
- **Shopping Cart**: Add products to cart with localStorage persistence
- **Checkout**: Simulate order placement (saves to Firestore)
- **Mentor Booking**: View mentor profiles and book sessions
- **Blog**: Educational content and hair care tips
- **Mobile-First Design**: Responsive design optimized for mobile devices

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Firebase Firestore
- **Hosting**: Firebase Hosting
- **Icons**: Lucide React

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Firestore Database
3. Enable Firebase Hosting
4. Copy your Firebase config and update `src/lib/firebase.ts`

### 3. Update Firebase Configuration

Replace the placeholder values in `src/lib/firebase.ts` with your actual Firebase config:

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### 4. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### 5. Seed Sample Data

Use the Firebase Console to manually add sample data from `scripts/seed-data.js` to these collections:
- `products`
- `mentors` 
- `blog`

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Firestore Schema

### Products Collection
```typescript
{
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  inStock: boolean;
}
```

### Mentors Collection
```typescript
{
  name: string;
  bio: string;
  specialties: string[];
  imageUrl: string;
  hourlyRate: number;
  availability: string[];
}
```

### Orders Collection
```typescript
{
  items: CartItem[];
  total: number;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  createdAt: Date;
}
```

### Bookings Collection
```typescript
{
  mentorId: string;
  clientName: string;
  clientEmail: string;
  date: string;
  time: string;
  notes?: string;
  createdAt: Date;
}
```

### Blog Collection
```typescript
{
  title: string;
  content: string;
  excerpt: string;
  imageUrl: string;
  category: string;
  publishedAt: Date;
}
```

## Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Firebase Hosting

```bash
firebase login
firebase init hosting
firebase deploy
```

## Project Structure

```
src/
├── app/                 # Next.js app router pages
│   ├── products/       # Product listing and details
│   ├── cart/           # Shopping cart
│   ├── checkout/       # Order placement
│   ├── mentors/        # Mentor profiles and booking
│   ├── blog/           # Blog posts
│   └── order-success/  # Order confirmation
├── components/         # Reusable React components
├── hooks/             # Custom React hooks
├── lib/               # Firebase configuration
└── types/             # TypeScript type definitions
```

## Key Features Implementation

- **Cart Management**: Uses localStorage with React hooks for persistence
- **Real-time Data**: Firestore integration with React hooks
- **Mobile-First**: Tailwind CSS responsive design
- **Type Safety**: Full TypeScript implementation
- **SEO Friendly**: Next.js static generation

## Future Enhancements

- User authentication and profiles
- Payment integration (Stripe/PayPal)
- Real-time chat with mentors
- Advanced product filtering
- Inventory management
- Order tracking
- Email notifications