import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";

import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import ChefDashboard from "./pages/ChefDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ChefRegistration from "./pages/ChefRegistration";
import FamilyRegistration from "./pages/FamilyRegistration";
import WaitlistPage from "./pages/WaitlistPage";
import About from "./pages/About";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import ForChefs from "./pages/ForChefs";
import HowItWorks from "./pages/HowItWorks";
import BrowseChefs from "./pages/BrowseChefs";
import ChefProfile from "./pages/ChefProfile";
import FAQ from "./pages/FAQ";
import Pricing from "./pages/Pricing";
import Blog from "./pages/Blog";
import Unauthorized from "./pages/Unauthorized";
import { GuestGuard, AuthGuard, RoleGuard } from "./components/Guards";
import ScrollToTopButton from "./components/ScrollToTopButton";

const queryClient = new QueryClient();

// Scroll restoration component
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

// Fade + slide transition wrapper
function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.45, ease: [0.25, 1, 0.5, 1] }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <ScrollToTopButton />
        <Routes>
          {/* Public pages accessible to everyone */}
          <Route path="/" element={<PageWrapper><Index /></PageWrapper>} />
          <Route path="/about" element={<PageWrapper><About /></PageWrapper>} />
          <Route path="/how-it-works" element={<PageWrapper><HowItWorks /></PageWrapper>} />
          <Route path="/browse-chefs" element={<PageWrapper><BrowseChefs /></PageWrapper>} />
          <Route path="/chef/:id" element={<PageWrapper><ChefProfile /></PageWrapper>} />
          <Route path="/for-chefs" element={<PageWrapper><ForChefs /></PageWrapper>} />
          <Route path="/contact" element={<PageWrapper><Contact /></PageWrapper>} />
          <Route path="/faq" element={<PageWrapper><FAQ /></PageWrapper>} />
          <Route path="/pricing" element={<PageWrapper><Pricing /></PageWrapper>} />
          <Route path="/blog" element={<PageWrapper><Blog /></PageWrapper>} />
          <Route path="/unauthorized" element={<PageWrapper><Unauthorized /></PageWrapper>} />
          <Route path="/waitlist" element={<PageWrapper><WaitlistPage /></PageWrapper>} />

          {/* Guest-only pages (redirects if already authenticated) */}
          <Route element={<GuestGuard />}>
            <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
            <Route path="/register" element={<PageWrapper><Register /></PageWrapper>} />
            <Route path="/register/family" element={<PageWrapper><FamilyRegistration /></PageWrapper>} />
            <Route path="/register/chef" element={<PageWrapper><ChefRegistration /></PageWrapper>} />
          </Route>

          {/* Protected routes */}
          <Route element={<AuthGuard />}>
            {/* Family Dashboard routes */}
            <Route element={<RoleGuard allowedRoles={["family"]} />}>
              <Route path="/dashboard/*" element={<PageWrapper><Dashboard /></PageWrapper>} />
              <Route path="/family-dashboard/*" element={<PageWrapper><Dashboard /></PageWrapper>} />
            </Route>

            {/* Chef Dashboard routes */}
            <Route element={<RoleGuard allowedRoles={["chef"]} />}>
              <Route path="/chef-dashboard/*" element={<PageWrapper><ChefDashboard /></PageWrapper>} />
            </Route>

            {/* Admin Dashboard routes */}
            <Route element={<RoleGuard allowedRoles={["admin"]} />}>
              <Route path="/admin-dashboard/*" element={<PageWrapper><AdminDashboard /></PageWrapper>} />
              <Route path="/admin/launch-control" element={<PageWrapper><AdminDashboard initialTab="launch_control" /></PageWrapper>} />
            </Route>
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
