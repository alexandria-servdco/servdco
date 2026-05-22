import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, Heart } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Side - Image Section */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-amber-100 to-amber-200">
        {/* Background Image */}
        <img
          src="https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&h=1000&fit=crop"
          alt="Chef family"
          className="w-full h-full object-cover"
        />

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/40"></div>

        {/* Content Overlay */}
        <div className="absolute inset-0 flex flex-col justify-between p-12">
          {/* Text Section */}
          <div className="mt-auto">
            <h1 className="text-5xl font-bold text-white leading-tight mb-6">
              Real meals.
              <br />
              Made by real people.
              <br />
              <span className="text-primary">For your family.</span>
            </h1>

            <p className="text-white/90 text-base mb-8 max-w-md leading-relaxed">
              Connecting families with trusted local chefs who create homemade meals with care.
            </p>

            {/* Trust Badge */}
            <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-full px-4 py-3 w-fit">
              <Heart size={20} className="text-primary fill-primary" />
              <span className="text-white font-semibold text-sm">Trusted by families. Made with love.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 py-12 lg:py-0">
        <div className="max-w-md mx-auto w-full">
          {/* Logo */}
          <div className="mb-12">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <circle cx="50" cy="50" r="35" />
                  <circle cx="50" cy="50" r="24" />
                  <circle cx="50" cy="50" r="13" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-foreground">
                Servd <span className="text-primary">co.</span>
              </span>
            </div>
          </div>

          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-foreground mb-2">
              Welcome back <span className="text-red-500">❤️</span>
            </h2>
            <p className="text-foreground/70">Log in to your Servd Co. account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">
                Email address
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/60" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3.5 pl-12 border border-border rounded-lg text-foreground placeholder-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-semibold text-foreground">
                  Password
                </label>
                <a href="#" className="text-primary text-sm font-semibold hover:opacity-80 transition-opacity">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/60" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3.5 pl-12 pr-12 border border-border rounded-lg text-foreground placeholder-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/60 hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Log In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-3.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-base"
            >
              {isLoading ? "Logging in..." : "Log In"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-border"></div>
            <span className="text-foreground/60 text-sm font-medium">or</span>
            <div className="flex-1 h-px bg-border"></div>
          </div>

          {/* Google Button */}
          <button className="w-full px-6 py-3.5 border border-border rounded-lg font-semibold text-foreground hover:bg-secondary transition-colors flex items-center justify-center gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v8m-4-4h8" />
            </svg>
            Continue with Google
          </button>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-foreground/70 text-sm">
              Don't have an account?{" "}
              <a href="#" className="text-primary font-semibold hover:opacity-80 transition-opacity">
                Contact support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
