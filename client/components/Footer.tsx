import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Top CTA Section */}
        <div className="py-16 md:py-20 border-b border-white/20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 md:gap-12">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Heart size={24} className="fill-current" />
                <h3 className="text-2xl md:text-2xl font-bold">Good food. Real people. Stronger families.</h3>
              </div>
              <p className="text-sm opacity-90 mt-2">Be part of our community.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-6 py-3.5 rounded-full bg-white text-foreground placeholder-foreground/50 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary focus:ring-white"
              />
              <button className="px-10 py-3.5 bg-white text-primary rounded-full text-sm font-bold hover:bg-opacity-90 transition-colors whitespace-nowrap">
                Join the Waitlist
              </button>
            </div>
          </div>
        </div>

        {/* Links Section */}
        <div className="py-16 border-b border-white/20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            <div>
              <h4 className="font-bold mb-5 text-xs uppercase tracking-widest opacity-90">Platform</h4>
              <ul className="space-y-3 text-sm opacity-80">
                <li><a href="#" className="hover:opacity-100 transition">How it works</a></li>
                <li><a href="#" className="hover:opacity-100 transition">For families</a></li>
                <li><a href="#" className="hover:opacity-100 transition">For chefs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-5 text-xs uppercase tracking-widest opacity-90">Company</h4>
              <ul className="space-y-3 text-sm opacity-80">
                <li><a href="#" className="hover:opacity-100 transition">About us</a></li>
                <li><a href="#" className="hover:opacity-100 transition">Blog</a></li>
                <li><a href="#" className="hover:opacity-100 transition">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-5 text-xs uppercase tracking-widest opacity-90">Legal</h4>
              <ul className="space-y-3 text-sm opacity-80">
                <li><a href="#" className="hover:opacity-100 transition">Privacy</a></li>
                <li><a href="#" className="hover:opacity-100 transition">Terms</a></li>
                <li><a href="#" className="hover:opacity-100 transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-5 text-xs uppercase tracking-widest opacity-90">Follow</h4>
              <ul className="space-y-3 text-sm opacity-80">
                <li><a href="#" className="hover:opacity-100 transition">Twitter</a></li>
                <li><a href="#" className="hover:opacity-100 transition">Instagram</a></li>
                <li><a href="#" className="hover:opacity-100 transition">Facebook</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="py-8 text-center text-sm opacity-70">
          <p>&copy; 2026 Servd Co. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
