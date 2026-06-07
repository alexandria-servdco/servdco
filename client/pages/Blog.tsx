import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Clock, ArrowRight, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const BLOG_POSTS = [
  {
    category: "Healthy Living",
    title: "Organic Farm Sourcing: Reclaim Your Health",
    desc: "Why choosing farm-to-table organic ingredients makes a massive difference in nutrient density and daily energy levels.",
    date: "May 22, 2026",
    readTime: "4 min read",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80"
  },
  {
    category: "Meal Preparation",
    title: "How to Reclaim 12 Hours Every Single Week",
    desc: "A deep dive into session-based weekly meal prep planning. How private cooks help busy working professionals eat healthy.",
    date: "May 18, 2026",
    readTime: "6 min read",
    image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=500&auto=format&fit=crop&q=80"
  },
  {
    category: "Culinary Inspiration",
    title: "Aromatics & Spices: The Heart of Indian Cooking",
    desc: "Cook Priya Patel shares her top kitchen secrets for grinding custom garam masala and harnessing wellness in standard cooking.",
    date: "May 15, 2026",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=500&auto=format&fit=crop&q=80"
  }
];

export default function Blog() {
  return (
    <div className="min-h-screen bg-[#111111] text-[#F5F5F5] font-sans selection:bg-[#FF7A59]/20 selection:text-[#FF7A59]">
      <Navbar />
      <div className="h-[85px]" />

      {/* Hero Header */}
      <section className="py-20 bg-[#161616] border-b border-white/5 relative overflow-hidden text-center space-y-4">
        <div className="absolute top-0 right-1/4 w-[300px] h-[300px] rounded-full bg-[#FF7A59]/3 blur-[90px] pointer-events-none" />
        <p className="text-[#FF7A59] font-bold text-xs uppercase tracking-widest">Servd Co Chronicles</p>
        <h1 className="text-4xl lg:text-5xl font-bold font-serif text-white tracking-tight">Our Kitchen Stories.</h1>
        <p className="text-[#A8A8A8] text-sm max-w-xl mx-auto">
          Explore recipes, organic farm sourcing advice, wellness principles, and success stories from our network of local private cooks.
        </p>
      </section>

      {/* Blog Grid */}
      <section className="py-20 bg-[#111111]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {BLOG_POSTS.map((post, idx) => (
              <div 
                key={idx} 
                className="bg-[#2A2A2A] rounded-[24px] overflow-hidden border border-white/5 shadow-2xl flex flex-col group card-hover"
              >
                {/* Image */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/10">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  
                  {/* Category label overlay */}
                  <span className="absolute top-4 left-4 px-3 py-1 bg-[#111111]/80 backdrop-blur-sm rounded-full text-[10px] font-bold text-[#FF7A59] uppercase tracking-wider border border-[#FF7A59]/10">
                    {post.category}
                  </span>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] text-[#A8A8A8] font-bold uppercase tracking-wider">
                      <span>{post.date}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Clock size={11} />
                        <span>{post.readTime}</span>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-white font-serif group-hover:text-[#FF7A59] transition-colors leading-snug">
                      {post.title}
                    </h3>

                    <p className="text-xs text-[#A8A8A8] leading-relaxed font-medium">
                      {post.desc}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      toast.info("Article coming soon", {
                        description: "Full blog posts will be available after launch. Contact us for early access.",
                      })
                    }
                    className="text-[#FF7A59] text-xs font-bold flex items-center gap-1.5 pt-2 group-hover:underline self-start"
                  >
                    Read Article <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
}
