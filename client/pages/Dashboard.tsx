import { Bell, Heart, ChevronRight, Calendar, Users, Calendar as CalendarIcon, Gift } from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";

export default function Dashboard() {
  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />

      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-border px-8 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Welcome back, Sarah!</h1>
            <p className="text-foreground/70 mt-1">Good food brings families closer. Let's find your next amazing meal.</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2">
              <Bell size={24} className="text-foreground/60" />
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-primary rounded-full"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-border">
              <img
                src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop"
                alt="Sarah"
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="font-semibold text-foreground text-sm">Sarah Johnson</p>
                <p className="text-xs text-foreground/60">Family Account</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-8 space-y-8">
          {/* Referral Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 bg-secondary rounded-3xl p-8">
              <h3 className="text-2xl font-bold text-foreground mb-4">Give $20, Get $20</h3>
              <p className="text-foreground/80 text-sm mb-8">Invite a friend to Servd Co and you'll both get $20 when they book!</p>
              <button className="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-semibold hover:bg-primary/90 transition-colors">
                Invite Friends
              </button>
              <div className="mt-8 pt-8 border-t border-border/30">
                <img
                  src="https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=200&h=200&fit=crop"
                  alt="Referral"
                  className="w-full rounded-2xl object-cover h-40"
                />
              </div>
            </div>

            {/* Upcoming Bookings */}
            <div className="md:col-span-2 bg-white rounded-3xl p-8 border border-border">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-foreground">Upcoming Bookings</h2>
                <a href="#" className="text-primary font-semibold text-sm hover:opacity-80">View all</a>
              </div>

              <div className="space-y-4">
                {/* Booking Card */}
                <div className="flex gap-6 pb-6 border-b border-border">
                  <img
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
                    alt="Chef Maria"
                    className="w-24 h-24 rounded-2xl object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground text-lg">Chef Maria</h3>
                    <p className="text-sm text-foreground/70 mb-2">Comfort Food - Family Meals</p>
                    <div className="flex items-center gap-4 text-sm text-foreground/60 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar size={16} />
                        <span>May 24, 2024</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CalendarIcon size={16} />
                        <span>6:00 PM</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users size={16} />
                        <span>Dinner for 4</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="inline-block px-3 py-1 bg-accent/20 text-accent text-xs font-semibold rounded-full">Confirmed</span>
                      <span className="font-bold text-foreground">$96.00</span>
                    </div>
                  </div>
                </div>

                {/* Second Booking */}
                <div className="flex gap-6">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"
                    alt="Chef James"
                    className="w-24 h-24 rounded-2xl object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground text-lg">Chef James</h3>
                    <p className="text-sm text-foreground/70 mb-2">Meal Prep - Healthy</p>
                    <div className="flex items-center gap-4 text-sm text-foreground/60 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar size={16} />
                        <span>May 28, 2024</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CalendarIcon size={16} />
                        <span>11:00 AM</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users size={16} />
                        <span>Meal Prep (5 meals)</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">Pending</span>
                      <span className="font-bold text-foreground">$125.00</span>
                    </div>
                  </div>
                </div>
              </div>

              <button className="w-full mt-6 py-2.5 text-primary font-semibold text-sm hover:opacity-80 transition">
                View All Bookings
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Suggested For You */}
            <div className="lg:col-span-2">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-foreground">Suggested For You</h2>
                <a href="#" className="text-primary font-semibold text-sm">View all</a>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {["Priya", "Alex", "Tasha"].map((name, i) => (
                  <div key={i} className="bg-white rounded-2xl overflow-hidden border border-border">
                    <img
                      src={`https://images.unsplash.com/photo-${1494790108377 + i}?w=200&h=200&fit=crop`}
                      alt={`Chef ${name}`}
                      className="w-full aspect-square object-cover"
                    />
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-foreground">Chef {name}</h3>
                        <button className="text-primary hover:scale-110 transition">
                          <Heart size={18} />
                        </button>
                      </div>
                      <div className="flex items-center gap-1 mb-3">
                        <span className="text-sm text-foreground/80">4.9</span>
                        <span className="text-yellow-400">★</span>
                        <span className="text-xs text-foreground/60">(128)</span>
                      </div>
                      <p className="text-xs text-foreground/70 mb-3">Indian • Vegetarian</p>
                      <p className="text-sm font-semibold text-foreground mb-4">Starting at $27/meal</p>
                      <button className="w-full py-2 border border-primary text-primary rounded-full text-sm font-semibold hover:bg-primary/10 transition">
                        View Profile
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Referral Stats */}
              <div className="bg-white rounded-2xl p-6 border border-border">
                <button className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                      <Gift size={20} className="text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-foreground text-sm">Refer a friend</p>
                      <p className="text-xs text-foreground/60">Get $20 credit when they book!</p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-foreground/40" />
                </button>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-2xl p-6 border border-border">
                <h3 className="font-bold text-foreground mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  <div className="flex gap-3 pb-4 border-b border-border">
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                      <Calendar size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Your booking with Chef Maria is confirmed</p>
                      <p className="text-xs text-foreground/60">2h ago</p>
                    </div>
                  </div>
                  <div className="flex gap-3 pb-4 border-b border-border">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                      <Heart size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">You added Chef Priya to your favorites</p>
                      <p className="text-xs text-foreground/60">1d ago</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                      <Users size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">You left a review for Chef James</p>
                      <p className="text-xs text-foreground/60">3d ago</p>
                    </div>
                  </div>
                </div>
                <a href="#" className="block mt-4 text-primary text-sm font-semibold hover:opacity-80">View all</a>
              </div>

              {/* Your Favorite Chefs */}
              <div className="bg-white rounded-2xl p-6 border border-border">
                <h3 className="font-bold text-foreground mb-4">Your Favorite Chefs</h3>
                <div className="space-y-3">
                  {["Maria", "James", "Priya"].map((name, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={`https://images.unsplash.com/photo-${1494790108377 + i}?w=40&h=40&fit=crop`}
                          alt={name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-sm font-semibold text-foreground">Chef {name}</p>
                          <p className="text-xs text-foreground/60">From $25/meal</p>
                        </div>
                      </div>
                      <Heart size={18} className="text-primary fill-primary" />
                    </div>
                  ))}
                </div>
                <a href="#" className="block mt-4 text-primary text-sm font-semibold hover:opacity-80">View all</a>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-primary to-primary/80 rounded-3xl p-12 text-center text-primary-foreground">
            <h2 className="text-3xl font-bold mb-4">Want to make mealtime even easier?</h2>
            <p className="text-lg opacity-90 mb-8">Schedule weekly meals with your favorite chef.</p>
            <div className="grid grid-cols-3 gap-8 mb-8">
              <div>
                <CalendarIcon size={32} className="mx-auto mb-4 opacity-80" />
                <p className="font-semibold">Weekly meal plans</p>
                <p className="text-sm opacity-80">Save time every week</p>
              </div>
              <div>
                <Gift size={32} className="mx-auto mb-4 opacity-80" />
                <p className="font-semibold">Exclusive discounts</p>
                <p className="text-sm opacity-80">For recurring bookings</p>
              </div>
              <div>
                <Calendar size={32} className="mx-auto mb-4 opacity-80" />
                <p className="font-semibold">Flexible anytime</p>
                <p className="text-sm opacity-80">Reschedule easily</p>
              </div>
            </div>
            <button className="px-8 py-3.5 bg-white text-primary rounded-full font-semibold hover:bg-opacity-90 transition-colors">
              Schedule Now
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
