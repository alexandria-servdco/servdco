import { Bell, ChevronLeft, ChevronRight, Check, X, Star, TrendingUp, Users, Calendar, MessageCircle, Shield, User, Settings, Circle as HelpCircle, MoveVertical as MoreVertical } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const chartData = [
  { date: "May 1", earnings: 180 },
  { date: "May 6", earnings: 320 },
  { date: "May 11", earnings: 280 },
  { date: "May 16", earnings: 450 },
  { date: "May 21", earnings: 380 },
  { date: "May 26", earnings: 520 },
];

export default function ChefDashboard() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex w-56 bg-background border-r border-border flex-col h-screen sticky top-0 p-6">
        {/* Logo */}
        <div className="mb-12">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <circle cx="50" cy="50" r="35" />
                <circle cx="50" cy="50" r="24" />
                <circle cx="50" cy="50" r="13" />
              </svg>
            </div>
            <span className="text-base font-bold text-foreground">Servd <span className="text-primary">co.</span></span>
          </div>
        </div>

        {/* Chef Profile */}
        <div className="mb-8 pb-8 border-b border-border">
          <div className="text-center">
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop"
              alt="Chef Maria"
              className="w-20 h-20 rounded-full object-cover mx-auto mb-3 border-4 border-primary/20"
            />
            <div className="flex items-center justify-center gap-1 mb-1">
              <h3 className="font-bold text-foreground text-base">Chef Maria</h3>
              <Check size={16} className="text-accent" />
            </div>
            <p className="text-xs text-foreground/70">Comfort Food Specialist</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 mb-8">
          <NavLink icon={Calendar} label="Dashboard" active />
          <NavLink icon={Calendar} label="Bookings" />
          <NavLink icon={Calendar} label="Calendar" />
          <NavLink icon={Star} label="Reviews" />
          <NavLink icon={Shield} label="Verification" />
          <NavLink icon={User} label="Profile" />
          <NavLink icon={Settings} label="Settings" />
        </nav>

        {/* Help Section */}
        <div className="mt-auto pt-8 border-t border-border">
          <button className="w-full flex items-start gap-3 p-4 rounded-2xl bg-secondary hover:bg-secondary/80 transition-colors group">
            <HelpCircle size={20} className="text-primary flex-shrink-0 mt-1" />
            <div className="text-left">
              <p className="font-semibold text-foreground text-sm">Need help?</p>
              <p className="text-xs text-foreground/70">We're here for you</p>
            </div>
            <ChevronRight size={16} className="text-foreground/40 ml-auto group-hover:text-foreground/60 transition-colors" />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-border px-8 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Good morning, Chef Maria!</h1>
            <p className="text-foreground/70 mt-1">You have 3 bookings today.</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2">
              <Bell size={24} className="text-foreground/60" />
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-primary rounded-full"></span>
            </button>
            <button className="flex items-center gap-3 pl-4 border-l border-border hover:bg-secondary p-2 rounded-lg transition-colors">
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop"
                alt="Chef Maria"
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="font-semibold text-foreground text-sm">Chef Maria</p>
                <p className="text-xs text-foreground/60">Verified Chef</p>
              </div>
              <ChevronRight size={16} className="text-foreground/40" />
            </button>
            <button className="px-6 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-semibold hover:bg-primary/90 transition-colors">
              + Add Availability
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {/* Top Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
              icon={Calendar}
              label="Total Bookings"
              value="28"
              change="+18%"
              subtext="This month"
            />
            <StatCard
              icon={TrendingUp}
              label="Total Earnings"
              value="$1,840"
              change="+22%"
              subtext="This month"
              bgColor="bg-emerald-50"
              iconColor="text-emerald-600"
            />
            <StatCard
              icon={Star}
              label="Average Rating"
              value="4.9"
              change=""
              stars
              subtext="(124 reviews)"
            />
            <StatCard
              icon={Users}
              label="Repeat Families"
              value="16"
              change="+12%"
              subtext="This month"
              bgColor="bg-orange-50"
              iconColor="text-primary"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* Upcoming Bookings */}
              <div className="bg-white rounded-2xl border border-border p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-foreground">Upcoming Bookings</h2>
                  <a href="#" className="text-primary font-semibold text-sm hover:opacity-80">View all</a>
                </div>

                <div className="space-y-4">
                  {[
                    { family: "The Johnson Family", type: "Family Dinner • Comfort Food", date: "Today, May 24", time: "6:00 PM", status: "Confirmed", image: "photo-1494790108377" },
                    { family: "The Patel Family", type: "Weekly Meal Prep • Healthy", date: "May 25, 2024", time: "11:00 AM", status: "Pending", image: "photo-1507003211169" },
                    { family: "The Williams Family", type: "Lunch & Dinner • Indian Food", date: "May 26, 2024", time: "5:30 PM", status: "Confirmed", image: "photo-1438761681033" },
                  ].map((booking, i) => (
                    <div key={i} className="flex gap-4 pb-4 border-b border-border last:border-0 last:pb-0">
                      <img
                        src={`https://images.unsplash.com/${booking.image}?w=80&h=80&fit=crop`}
                        alt={booking.family}
                        className="w-20 h-20 rounded-2xl object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-bold text-foreground">{booking.family}</h3>
                        <p className="text-sm text-foreground/70 mb-2">{booking.type}</p>
                        <div className="flex items-center gap-3 text-xs text-foreground/60 mb-3">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {booking.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {booking.time}
                          </span>
                        </div>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          booking.status === "Confirmed"
                            ? "bg-accent/20 text-accent"
                            : "bg-orange-100 text-orange-700"
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <button className="w-full mt-6 py-2.5 text-primary font-semibold text-sm hover:opacity-80">
                  View All Bookings →
                </button>
              </div>

              {/* Recent Reviews */}
              <div className="bg-white rounded-2xl border border-border p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-foreground">Recent Reviews</h2>
                  <a href="#" className="text-primary font-semibold text-sm hover:opacity-80">View all</a>
                </div>

                <div className="space-y-6">
                  {[
                    { name: "Jessica M.", rating: 5, text: "Chef Maria's meals are absolutely delicious! My kids love the homemade pastas and fresh soups. So grateful for her care! 🥰", date: "May 20, 2024", verified: true },
                    { name: "David R.", rating: 5, text: "Healthy, fresh and always on time. Maria is now part of our weekly routine!", date: "May 18, 2024", verified: true },
                  ].map((review, i) => (
                    <div key={i} className="pb-6 border-b border-border last:border-0 last:pb-0">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-foreground">{review.name}</p>
                            {review.verified && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-accent text-xs font-semibold rounded">
                                <Check size={12} />
                                Verified
                              </span>
                            )}
                          </div>
                          <div className="flex gap-1">
                            {Array(review.rating).fill(0).map((_, j) => (
                              <Star key={j} size={14} className="fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-foreground/60">{review.date}</p>
                      </div>
                      <p className="text-sm text-foreground/80 leading-relaxed">{review.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              {/* Booking Requests */}
              <div className="bg-white rounded-2xl border border-border p-6">
                <div className="flex items-center gap-2 mb-6">
                  <h2 className="text-xl font-bold text-foreground">Booking Requests</h2>
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                    2
                  </span>
                </div>

                <div className="space-y-4">
                  {[
                    { name: "Emily Parker", type: "Weekly Meal Prep", meals: "4 meals/week", date: "May 27", price: "$120" },
                    { name: "Michael Brown", type: "Family Dinner", people: "6 people", date: "May 28", price: "$150" },
                  ].map((request, i) => (
                    <div key={i} className="pb-4 border-b border-border last:border-0 last:pb-0">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3 flex-1">
                          <img
                            src={`https://images.unsplash.com/photo-${1494790108377 + i}?w=40&h=40&fit=crop`}
                            alt={request.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-semibold text-foreground text-sm">{request.name}</p>
                            <p className="text-xs text-foreground/70">{request.type}</p>
                            <p className="text-xs text-foreground/60 mt-1">
                              {request.meals || request.people}
                            </p>
                            <p className="text-xs text-foreground/60">{request.date}</p>
                          </div>
                        </div>
                        <p className="font-bold text-primary text-sm">{request.price}</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors">
                          Accept
                        </button>
                        <button className="flex-1 px-3 py-2 bg-secondary text-foreground rounded-lg text-xs font-semibold hover:bg-secondary/80 transition-colors">
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Availability Calendar */}
              <div className="bg-white rounded-2xl border border-border p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-foreground">Availability Calendar</h3>
                  <div className="flex gap-1">
                    <button className="p-1.5 hover:bg-secondary rounded transition-colors">
                      <ChevronLeft size={18} className="text-foreground/60" />
                    </button>
                    <button className="p-1.5 hover:bg-secondary rounded transition-colors">
                      <ChevronRight size={18} className="text-foreground/60" />
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-semibold text-foreground mb-4">May 2024</p>
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                      <div key={day} className="text-center text-xs font-semibold text-foreground/60 py-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {[28, 29, 30, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 12, 13, 14, 15, 16, 17, 18, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31].map((date, i) => {
                      let dayClass = "text-center py-1.5 text-xs font-medium rounded cursor-pointer transition-colors";
                      if (date === 24) {
                        dayClass += " bg-primary text-primary-foreground";
                      } else if ([5, 10, 15].includes(date)) {
                        dayClass += " bg-accent/20 text-accent";
                      } else if (date > 25) {
                        dayClass += " text-foreground/40";
                      } else {
                        dayClass += " text-foreground hover:bg-secondary";
                      }
                      return (
                        <div key={i} className={dayClass}>
                          {date}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-accent"></div>
                    <span className="text-foreground/70">Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <span className="text-foreground/70">Booked</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-foreground/20"></div>
                    <span className="text-foreground/70">Not available</span>
                  </div>
                </div>
              </div>

              {/* Profile Completion */}
              <div className="bg-white rounded-2xl border border-border p-6">
                <h3 className="font-bold text-foreground mb-4">Profile Completion</h3>
                <div className="relative w-32 h-32 mx-auto mb-6">
                  <svg className="w-full h-full" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="54" fill="none" stroke="#f0e7e2" strokeWidth="8" />
                    <circle
                      cx="60"
                      cy="60"
                      r="54"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeDasharray={`${(85 / 100) * 2 * Math.PI * 54} ${2 * Math.PI * 54}`}
                      className="text-primary transition-all"
                      style={{ transform: "rotate(-90deg)", transformOrigin: "60px 60px" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-2xl font-bold text-primary">85%</span>
                    <span className="text-xs text-foreground/70">Complete</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <CompletionItem label="Personal Information" done />
                  <CompletionItem label="Cuisine & Specialities" done />
                  <CompletionItem label="Photos (8/10)" />
                  <CompletionItem label="Documents (3/3)" />
                </div>

                <div className="mt-6 pt-6 border-t border-border">
                  <div className="flex items-start gap-3">
                    <Check size={20} className="text-accent flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground text-sm mb-1">You're verified!</p>
                      <p className="text-xs text-foreground/70">Your profile is visible to families.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Earnings Overview */}
          <div className="bg-white rounded-2xl border border-border p-8">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Earnings Overview</h2>
                <div className="flex gap-8">
                  <div>
                    <p className="text-sm text-foreground/70 mb-1">Top Earning Day</p>
                    <p className="font-bold text-foreground">May 20 <span className="text-primary">$420</span></p>
                  </div>
                  <div>
                    <p className="text-sm text-foreground/70 mb-1">Average Order Value</p>
                    <p className="font-bold text-foreground"><span className="text-primary">$65.80</span></p>
                  </div>
                </div>
              </div>
              <select className="px-4 py-2 border border-border rounded-lg text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                <option>This Month</option>
                <option>Last Month</option>
                <option>Last 3 Months</option>
              </select>
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0e7e2" />
                <XAxis dataKey="date" stroke="#1a1a1a" opacity={0.6} />
                <YAxis stroke="#1a1a1a" opacity={0.6} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #f0e7e2",
                    borderRadius: "12px",
                  }}
                  formatter={(value) => [`$${value}`, "Earnings"]}
                />
                <Line
                  type="monotone"
                  dataKey="earnings"
                  stroke="#FF7A59"
                  strokeWidth={3}
                  dot={{ fill: "#FF7A59", r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, change, subtext, bgColor = "bg-orange-50", iconColor = "text-primary", stars = false }) {
  return (
    <div className={`${bgColor} rounded-2xl p-6 border border-border`}>
      <div className="flex items-start justify-between mb-4">
        <Icon size={28} className={iconColor} />
      </div>
      <p className="text-sm text-foreground/70 mb-2">{label}</p>
      <div className="flex items-end gap-3 mb-2">
        <span className="text-3xl font-bold text-foreground">{value}</span>
        {change && (
          <span className="text-sm font-semibold text-accent mb-1">
            {change}
          </span>
        )}
      </div>
      {stars && (
        <div className="flex gap-0.5 mb-2">
          {Array(5).fill(0).map((_, i) => (
            <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />
          ))}
        </div>
      )}
      <p className="text-xs text-foreground/60">{subtext}</p>
    </div>
  );
}

function NavLink({ icon: Icon, label, active = false }) {
  return (
    <button
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        active
          ? "bg-secondary text-primary"
          : "text-foreground/70 hover:bg-secondary hover:text-primary"
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );
}

function CompletionItem({ label, done = false }) {
  return (
    <div className="flex items-center gap-3">
      {done ? (
        <Check size={16} className="text-accent flex-shrink-0" />
      ) : (
        <div className="w-4 h-4 rounded border border-foreground/30 flex-shrink-0" />
      )}
      <span className={`text-sm ${done ? "text-foreground/70" : "text-foreground"}`}>{label}</span>
    </div>
  );
}

const Clock = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
