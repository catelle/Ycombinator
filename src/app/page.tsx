import Link from "next/link";
import { ShoppingBag, Users, BookOpen, Mic, Briefcase, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-black via-gray-900 to-black text-white py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/5 to-yellow-600/5"></div>
        <div className="max-w-7xl mx-auto px-4 text-center relative">
          <div className="flex items-center justify-center mb-6">
            <Sparkles className="h-8 w-8 text-yellow-400 mr-3" />
            <span className="text-yellow-400 font-medium tracking-wider uppercase">Elite Mentorship Platform</span>
            <Sparkles className="h-8 w-8 text-yellow-400 ml-3" />
          </div>
          <h1 className="text-7xl font-bold mb-8 leading-tight">
            Elevate Your <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">Potential</span>
          </h1>
          <p className="text-xl mb-12 max-w-4xl mx-auto text-gray-300 leading-relaxed">
            Connect with world-class mentors in hair care, public speaking, and professional development. Transform your skills with personalized guidance.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link 
              href="/mentors"
              className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-10 py-4 rounded-xl font-bold hover:from-yellow-500 hover:to-yellow-700 transition-all shadow-2xl transform hover:scale-105"
            >
              Find Your Mentor
            </Link>
            <Link 
              href="/products"
              className="border-2 border-yellow-500 text-yellow-400 px-10 py-4 rounded-xl font-bold hover:bg-yellow-500 hover:text-black transition-all"
            >
              Shop Premium Products
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-5xl font-bold text-center mb-20 text-black">Elite Services & Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-8 bg-black rounded-3xl hover:shadow-2xl transition-all transform hover:scale-105">
              <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Users className="h-10 w-10 text-black" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-white">Hair Care Mentors</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">Expert guidance for 4C hair care and styling techniques.</p>
              <Link href="/mentors?category=hair-care" className="text-yellow-400 hover:text-yellow-300 font-bold inline-flex items-center">
                Explore →
              </Link>
            </div>
            <div className="text-center p-8 bg-black rounded-3xl hover:shadow-2xl transition-all transform hover:scale-105">
              <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Mic className="h-10 w-10 text-black" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-white">Public Speaking</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">Master the art of confident public speaking and presentation.</p>
              <Link href="/mentors?category=public-speaking" className="text-yellow-400 hover:text-yellow-300 font-bold inline-flex items-center">
                Explore →
              </Link>
            </div>
            <div className="text-center p-8 bg-black rounded-3xl hover:shadow-2xl transition-all transform hover:scale-105">
              <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Briefcase className="h-10 w-10 text-black" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-white">Professional Growth</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">Accelerate your career with strategic professional mentorship.</p>
              <Link href="/mentors?category=professional" className="text-yellow-400 hover:text-yellow-300 font-bold inline-flex items-center">
                Explore →
              </Link>
            </div>
            <div className="text-center p-8 bg-black rounded-3xl hover:shadow-2xl transition-all transform hover:scale-105">
              <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="h-10 w-10 text-black" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-white">Premium Products</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">Curated luxury products for your personal and professional needs.</p>
              <Link href="/products" className="text-yellow-400 hover:text-yellow-300 font-bold inline-flex items-center">
                Shop →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}