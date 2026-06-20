import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Mail, Phone, MapPin, CheckCircle, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { contactSchema, safeParse } from "@shared/validation";

export default function Contact() {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = safeParse(contactSchema, formState);
    if (parsed.success === false) {
      setError(parsed.error);
      return;
    }
    const { name, email, subject, message } = parsed.data;
    setLoading(true);
    setError("");
    try {
      await api.submitContact({ name, email, subject, message });
      setSubmitted(true);
      setFormState({ name: "", email: "", subject: "", message: "" });
      setTimeout(() => setSubmitted(false), 4000);
    } catch {
      setError("Failed to send message. Please try again or email hello@servdco.com.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111111] text-[#F5F5F5] font-sans selection:bg-[#FF7A59]/20 selection:text-[#FF7A59]">
      <Navbar />
      <div className="h-[85px]" />

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
          
          {/* Left Column: Details */}
          <div className="lg:col-span-6 space-y-10">
            <div className="space-y-4">
              <p className="text-[#FF7A59] font-bold text-xs uppercase tracking-widest">Contact Us</p>
              <h1 className="text-5xl lg:text-7xl font-bold font-serif leading-[1.05] text-white">
                We'd love<br />to hear from you.
              </h1>
              <p className="text-[#A8A8A8] text-sm md:text-base leading-relaxed max-w-md">
                Have a question, need assistance with your booking account, or want to partner with Servd Co? Our specialized local support team is ready to assist.
              </p>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              {/* Email */}
              <div className="bg-[#2A2A2A] rounded-2xl p-6 border border-white/5 shadow-xl space-y-4">
                <div className="w-10 h-10 rounded-full bg-[#FF7A59]/10 text-[#FF7A59] flex items-center justify-center">
                  <Mail size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Email Us</h3>
                  <a href="mailto:hello@servdco.com" className="text-xs text-[#FF7A59] font-semibold hover:underline block mt-1">hello@servdco.com</a>
                </div>
              </div>

              {/* Phone */}
              <div className="bg-[#2A2A2A] rounded-2xl p-6 border border-white/5 shadow-xl space-y-4">
                <div className="w-10 h-10 rounded-full bg-[#FF7A59]/10 text-[#FF7A59] flex items-center justify-center">
                  <Phone size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Call Us</h3>
                  <a href="tel:6501234567" className="text-xs text-[#FF7A59] font-semibold hover:underline block mt-1">(650) 123-4567</a>
                </div>
              </div>

              {/* Visit */}
              <div className="bg-[#2A2A2A] rounded-2xl p-6 border border-white/5 shadow-xl space-y-4">
                <div className="w-10 h-10 rounded-full bg-[#FF7A59]/10 text-[#FF7A59] flex items-center justify-center">
                  <MapPin size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Office</h3>
                  <p className="text-[11px] text-[#A8A8A8] leading-snug mt-1">Atlanta, GA 30303, USA</p>
                </div>
              </div>
            </div>

            {/* Supporting Hero Image */}
            <div className="rounded-[32px] overflow-hidden shadow-2xl border border-white/5 aspect-[16/10] bg-[#161616]">
              <img 
                src="/contact-hero.png" 
                alt="Cook preparing organic food" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Right Column: Form Card */}
          <div className="lg:col-span-6">
            <div className="bg-[#2A2A2A] rounded-[32px] p-8 lg:p-10 border border-white/5 shadow-2xl relative">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#FF7A59]/5 blur-2xl pointer-events-none" />
              
              {submitted ? (
                <div className="text-center py-16 space-y-4">
                  <div className="w-14 h-14 bg-[#2E7D66]/10 text-[#2E7D66] rounded-full flex items-center justify-center mx-auto border border-[#2E7D66]/20">
                    <CheckCircle size={28} />
                  </div>
                  <h3 className="text-2xl font-bold font-serif text-white">Message Sent!</h3>
                  <p className="text-xs text-[#A8A8A8] max-w-[280px] mx-auto leading-relaxed">
                    Thank you for reaching out. A specialized coordinator will respond to your email within 24 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold font-serif text-white">Send us a message</h2>
                    <p className="text-xs text-[#A8A8A8] mt-1.5">Fill out your details below and we will get back to you.</p>
                  </div>

                  <div className="space-y-4">
                    {/* Name */}
                    <div>
                      <label className="block text-[10px] font-bold text-white uppercase tracking-wider mb-1.5">Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Enter your name"
                        value={formState.name}
                        onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                        className="w-full px-4 py-3.5 bg-[#161616] border border-white/5 rounded-xl text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#FF7A59] transition-colors"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-[10px] font-bold text-white uppercase tracking-wider mb-1.5">Email Address</label>
                      <input
                        type="email"
                        required
                        placeholder="Enter your email"
                        value={formState.email}
                        onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                        className="w-full px-4 py-3.5 bg-[#161616] border border-white/5 rounded-xl text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#FF7A59] transition-colors"
                      />
                    </div>

                    {/* Subject */}
                    <div>
                      <label className="block text-[10px] font-bold text-white uppercase tracking-wider mb-1.5">Subject</label>
                      <input
                        type="text"
                        required
                        placeholder="What is this regarding?"
                        value={formState.subject}
                        onChange={(e) => setFormState({ ...formState, subject: e.target.value })}
                        className="w-full px-4 py-3.5 bg-[#161616] border border-white/5 rounded-xl text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#FF7A59] transition-colors"
                      />
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-[10px] font-bold text-white uppercase tracking-wider mb-1.5">Your Message</label>
                      <textarea
                        required
                        rows={5}
                        placeholder="How can we help your family or culinary career?"
                        value={formState.message}
                        onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                        className="w-full px-4 py-3.5 bg-[#161616] border border-white/5 rounded-xl text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#FF7A59] transition-colors resize-none"
                      />
                    </div>
                  </div>

                  {error && (
                    <p className="text-xs text-red-400 font-semibold">{error}</p>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-[#FF7A59] hover:bg-[#e96a49] disabled:opacity-60 text-white font-bold rounded-xl text-xs hover:scale-[1.01] transition-all shadow-md flex items-center justify-center gap-2 group"
                  >
                    {loading ? "Sending..." : "Send Message"}
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>
              )}

            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
