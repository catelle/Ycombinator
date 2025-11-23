// Sample data seeding script for Firestore
// Run this after setting up Firebase to populate initial data

const sampleProducts = [
  {
    name: "Moisture Lock Shampoo",
    description: "Gentle cleansing shampoo specifically formulated for 4C hair to retain moisture while removing buildup.",
    price: 24.99,
    category: "Shampoo",
    imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400",
    inStock: true
  },
  {
    name: "Deep Conditioning Mask",
    description: "Intensive weekly treatment to restore elasticity and shine to dry, damaged 4C hair.",
    price: 32.99,
    category: "Conditioner",
    imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
    inStock: true
  },
  {
    name: "Leave-In Moisturizer",
    description: "Daily leave-in treatment that provides long-lasting hydration and heat protection.",
    price: 18.99,
    category: "Leave-In",
    imageUrl: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400",
    inStock: true
  }
];

const sampleMentors = [
  {
    name: "Sarah Johnson",
    bio: "Licensed cosmetologist with 10+ years specializing in natural hair care. Passionate about helping clients embrace their natural texture.",
    specialties: ["Protective Styling", "Hair Growth", "Product Selection"],
    imageUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400",
    hourlyRate: 75,
    availability: ["Monday", "Wednesday", "Friday"]
  },
  {
    name: "Maya Williams",
    bio: "Natural hair educator and curl specialist. Helps clients develop personalized routines for healthy 4C hair.",
    specialties: ["Curl Patterns", "Scalp Health", "DIY Treatments"],
    imageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
    hourlyRate: 65,
    availability: ["Tuesday", "Thursday", "Saturday"]
  }
];

const sampleBlogPosts = [
  {
    title: "The Ultimate 4C Hair Care Routine",
    content: "Discover the essential steps for maintaining healthy 4C hair...",
    excerpt: "Learn the fundamental steps every 4C hair owner should know for optimal hair health.",
    imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400",
    category: "Hair Care",
    publishedAt: new Date()
  },
  {
    title: "Best Protective Styles for 4C Hair",
    content: "Explore protective styling options that promote growth...",
    excerpt: "Protective styles that keep your hair healthy while looking fabulous.",
    imageUrl: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=400",
    category: "Styling",
    publishedAt: new Date()
  }
];

console.log('Sample data ready for seeding:');
console.log('Products:', sampleProducts.length);
console.log('Mentors:', sampleMentors.length);
console.log('Blog Posts:', sampleBlogPosts.length);