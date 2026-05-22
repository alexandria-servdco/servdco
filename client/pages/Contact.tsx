import { Link } from "react-router-dom";
import { 
  Heart, Mail, Phone, MapPin, Send, Plus, Users, Calendar, 
  ShieldCheck, CreditCard, HelpCircle
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Contact() {
  return (
    <div className="min-h-screen bg-[#FFF9F6] font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        
        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 mb-16">
          
          {/* Left Side */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="mb-10">
              <p className="text-[#FF7A59] font-bold text-[11px] tracking-widest uppercase mb-4">
                Contact Us
              </p>
              <h1 className="text-5xl lg:text-[64px] font-bold text-[#1A1A1A] leading-[1.1] mb-6 font-serif">
                We'd love<br />to hear from you.
                <span className="inline-block ml-3">
                  <svg width="45" height="45" viewBox="0 0 24 24" fill="none" className="inline -mt-4" aria-hidden>
                    <path
                      d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                      stroke="#FF7A59"
                      strokeWidth="1.8"
                      fill="none"
                    />
                  </svg>
                </span>
              </h1>
              <p className="text-[#1A1A1A]/80 text-[15px] leading-relaxed max-w-[400px] font-medium">
                Have a question, need help, or want to partner with us? We're here for you and your family.
              </p>
            </div>

            <div className="relative mt-auto">
              <div className="w-full h-[320px] rounded-[32px] overflow-hidden shadow-sm mb-12">
                <img 
                  src="/contact-hero.png" 
                  alt="Family and chef enjoying a meal" 
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Three Contact Cards */}
              <div className="absolute -bottom-10 left-0 w-full flex justify-center gap-4 px-4">
                {/* Email Card */}
                <div className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[#F0E7E2] flex-1 text-center max-w-[180px]">
                  <div className="w-12 h-12 mx-auto rounded-full bg-[#FFF0EB] flex items-center justify-center text-[#FF7A59] mb-4">
                    <Mail size={20} strokeWidth={2} />
                  </div>
                  <h3 className="font-bold text-[#1A1A1A] text-[15px] mb-1">Email Us</h3>
                  <a href="mailto:hello@servdco.com" className="text-[#FF7A59] text-[13px] font-semibold hover:underline block mb-2">hello@servdco.com</a>
                  <p className="text-[#1A1A1A]/60 text-[11px] leading-relaxed">We typically reply within 24 hours</p>
                </div>

                {/* Phone Card */}
                <div className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[#F0E7E2] flex-1 text-center max-w-[180px]">
                  <div className="w-12 h-12 mx-auto rounded-full bg-[#FFF0EB] flex items-center justify-center text-[#FF7A59] mb-4">
                    <Phone size={20} strokeWidth={2} />
                  </div>
                  <h3 className="font-bold text-[#1A1A1A] text-[15px] mb-1">Call Us</h3>
                  <a href="tel:6501234567" className="text-[#FF7A59] text-[13px] font-semibold hover:underline block mb-2">(650) 123-4567</a>
                  <p className="text-[#1A1A1A]/60 text-[11px] leading-relaxed">Mon – Fri, 9am – 6pm EST</p>
                </div>

                {/* Visit Card */}
                <div className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[#F0E7E2] flex-1 text-center max-w-[180px]">
                  <div className="w-12 h-12 mx-auto rounded-full bg-[#FFF0EB] flex items-center justify-center text-[#FF7A59] mb-4">
                    <MapPin size={20} strokeWidth={2} />
                  </div>
                  <h3 className="font-bold text-[#1A1A1A] text-[15px] mb-1">Visit Us</h3>
                  <p className="text-[#1A1A1A]/80 text-[12px] font-medium leading-relaxed mt-1">
                    123 Community Way<br />Atlanta, GA 30303<br />USA
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="lg:col-span-5 relative z-10 pt-4 lg:pt-0 pb-12">
            <div className="bg-white rounded-[32px] p-8 lg:p-10 shadow-[0_8px_40px_rgba(0,0,0,0.04)] border border-[#F0E7E2]">
              <h2 className="text-[32px] font-bold text-[#1A1A1A] font-serif mb-2">Send us a message</h2>
              <p className="text-[#1A1A1A]/60 text-[14px] mb-8">Our team will get back to you as soon as possible.</p>

              <form className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-[#1A1A1A]">Full name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#1A1A1A]/40">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <input type="text" placeholder="Enter your full name" className="w-full pl-11 pr-4 py-3.5 bg-white border border-[#F0E7E2] rounded-xl text-[14px] placeholder:text-[#1A1A1A]/40 focus:outline-none focus:ring-2 focus:ring-[#FF7A59] transition-all" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-[#1A1A1A]">Email address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#1A1A1A]/40">
                      <Mail size={18} />
                    </div>
                    <input type="email" placeholder="Enter your email" className="w-full pl-11 pr-4 py-3.5 bg-white border border-[#F0E7E2] rounded-xl text-[14px] placeholder:text-[#1A1A1A]/40 focus:outline-none focus:ring-2 focus:ring-[#FF7A59] transition-all" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-[#1A1A1A]">Subject</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#1A1A1A]/40">
                      <HelpCircle size={18} />
                    </div>
                    <select className="w-full pl-11 pr-10 py-3.5 bg-white border border-[#F0E7E2] rounded-xl text-[14px] text-[#1A1A1A]/60 appearance-none focus:outline-none focus:ring-2 focus:ring-[#FF7A59] transition-all">
                      <option value="" disabled selected>What is this regarding?</option>
                      <option value="support">General Support</option>
                      <option value="chef">Chef Application</option>
                      <option value="booking">Meal Booking</option>
                      <option value="partnership">Partnership</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-[#1A1A1A]/60">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-[#1A1A1A]">Message</label>
                  <textarea 
                    placeholder="How can we help you?" 
                    rows={4}
                    className="w-full p-4 bg-white border border-[#F0E7E2] rounded-xl text-[14px] placeholder:text-[#1A1A1A]/40 focus:outline-none focus:ring-2 focus:ring-[#FF7A59] transition-all resize-none"
                  ></textarea>
                </div>

                <button type="button" className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#FF7A59] text-white rounded-xl text-[15px] font-bold hover:bg-[#e96a49] transition-all shadow-md active:scale-[0.98]">
                  Send Message
                  <Send size={18} />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* FAQ Preview */}
        <div className="bg-[#FFF0EB] rounded-[32px] p-10 lg:p-12 mb-16 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-10 gap-6">
            <div>
              <p className="text-[#FF7A59] font-bold text-[11px] tracking-widest uppercase mb-3">
                FAQ Preview
              </p>
              <h2 className="text-[32px] lg:text-[40px] font-bold text-[#1A1A1A] font-serif mb-2">
                Frequently Asked Questions
              </h2>
              <p className="text-[#1A1A1A]/70 text-[15px]">
                Here are some quick answers. Visit our <a href="#" className="text-[#FF7A59] font-semibold hover:underline">Help Center</a> for more.
              </p>
            </div>
            <button className="flex items-center gap-2 px-6 py-3 bg-white border border-[#F0E7E2] text-[#FF7A59] rounded-full text-[13px] font-bold hover:bg-gray-50 transition-colors shadow-sm whitespace-nowrap">
              View All FAQs <span className="text-[16px] leading-none">&rarr;</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: <Users />, title: "How does Servd Co. work?", text: "We connect families with trusted local chefs who prepare homemade meals with love." },
              { icon: <Calendar />, title: "How do I book a chef?", text: "Browse chefs, choose a date, and book a meal that fits your family's needs." },
              { icon: <ShieldCheck />, title: "Are the chefs background checked?", text: "Yes! All chefs are background checked and verified for your peace of mind." },
              { icon: <CreditCard />, title: "What payment methods do you accept?", text: "We accept all major credit cards and secure online payments." }
            ].map((faq, idx) => (
              <div key={idx} className="bg-[#FFF9F6] rounded-2xl p-6 flex gap-5 border border-[#F0E7E2] hover:border-[#FF7A59]/30 transition-colors group cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-[#FFF0EB] flex items-center justify-center text-[#FF7A59] flex-shrink-0 border border-[#FFE7DF]">
                  {faq.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-[#1A1A1A] text-[15px] mb-2">{faq.title}</h3>
                  <p className="text-[#1A1A1A]/70 text-[13px] leading-relaxed">{faq.text}</p>
                </div>
                <div className="flex-shrink-0 text-[#FF7A59] pt-1">
                  <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Map Section */}
        <div className="relative w-full h-[450px] rounded-[32px] overflow-hidden mb-8 shadow-sm border border-[#F0E7E2]">
          <img 
            src="/contact-map.png" 
            alt="Map location" 
            className="w-full h-full object-cover opacity-80"
          />
          {/* Custom Location Pin */}
          <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 drop-shadow-xl">
            <svg width="48" height="64" viewBox="0 0 24 24" fill="#FF7A59" className="text-[#FF7A59]">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" fill="white" />
            </svg>
          </div>

          {/* Floating Card */}
          <div className="absolute bottom-6 right-6 md:bottom-10 md:right-10 bg-white rounded-3xl p-8 shadow-2xl max-w-sm border border-[#F0E7E2]">
            <div className="flex gap-4 items-start mb-4">
              <div className="w-12 h-12 rounded-full bg-[#FFF0EB] flex items-center justify-center text-[#FF7A59] flex-shrink-0">
                <Users size={24} />
              </div>
              <div>
                <h3 className="font-bold text-[#1A1A1A] text-[20px] font-serif mb-2">We're here for you.</h3>
                <p className="text-[#1A1A1A]/70 text-[13px] leading-relaxed mb-6">
                  Whether you're a family looking for meals or a chef wanting to join our community, we'd love to connect.
                </p>
                <button className="px-6 py-2.5 bg-white border border-[#FF7A59] text-[#FF7A59] rounded-full text-[13px] font-bold hover:bg-[#FFF0EB] transition-colors">
                  Get in Touch
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="bg-[#FFF0EB] rounded-[24px] p-6 lg:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-[#FF7A59] flex items-center justify-center text-white flex-shrink-0 shadow-md">
              <Heart size={24} />
            </div>
            <div>
              <h3 className="font-bold text-[#1A1A1A] text-[20px] font-serif mb-1">Still have questions?</h3>
              <p className="text-[#1A1A1A]/70 text-[14px]">Our support team is just a message away.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-[#FF7A59] text-white rounded-xl text-[14px] font-bold hover:bg-[#e96a49] transition-all shadow-md">
              Email Us <Mail size={18} />
            </button>
            <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-white border border-[#F0E7E2] text-[#1A1A1A] rounded-xl text-[14px] font-bold hover:bg-gray-50 transition-all shadow-sm">
              <Phone size={18} /> Call Us
            </button>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
