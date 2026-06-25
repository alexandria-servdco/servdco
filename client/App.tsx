import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { QueryProvider } from "@/providers/QueryProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { lazy, Suspense, useEffect } from "react";
import { GlobalErrorBoundary } from "@/components/errors/GlobalErrorBoundary";
import { RouteErrorBoundary } from "@/components/errors/RouteErrorBoundary";
import { validateClientStartup } from "@/lib/env/validateStartup";
import { initAnalytics } from "@/lib/analytics";
import { initSentry } from "@/lib/monitoring/sentry";
import { PageMetaManager } from "@/components/seo/PageMetaManager";

import Index from "./pages/Index";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Register from "./pages/Register";
import ChefRegistration from "./pages/ChefRegistration";
import FamilyRegistration from "./pages/FamilyRegistration";
import WaitlistPage from "./pages/WaitlistPage";
import About from "./pages/About";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import ForChefs from "./pages/ForChefs";
import HowItWorks from "./pages/HowItWorks";
import FAQ from "./pages/FAQ";
import Pricing from "./pages/Pricing";
import Blog from "./pages/Blog";
import Unauthorized from "./pages/Unauthorized";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import CookiePolicy from "./pages/CookiePolicy";
import LegalHub from "./pages/LegalHub";
import { GuestGuard, AuthGuard, RoleGuard, AdminGuard } from "./components/Guards";
import ScrollToTopButton from "./components/ScrollToTopButton";
import { PlatformSettingsHydrator } from "./components/PlatformSettingsHydrator";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const ChefDashboard = lazy(() => import("./pages/ChefDashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const BrowseChefs = lazy(() => import("./pages/BrowseChefs"));
const ChefProfile = lazy(() => import("./pages/ChefProfile"));

validateClientStartup();
void initSentry();
initAnalytics();

function RouteFallback() {
  return (
    <div
      className="min-h-[40vh] flex items-center justify-center text-[#A8A8A8] text-sm"
      role="status"
      aria-live="polite"
    >
      Loading…
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function PageWrapper({
  children,
  routeLabel,
}: {
  children: React.ReactNode;
  routeLabel?: string;
}) {
  return (
    <RouteErrorBoundary label={routeLabel}>
      <div
        id="main-content"
        tabIndex={-1}
        className="w-full min-h-screen flex flex-col outline-none animate-page-in"
      >
        {children}
      </div>
    </RouteErrorBoundary>
  );
}

function LazyRoute({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <PageWrapper routeLabel={label}>
      <Suspense fallback={<RouteFallback />}>{children}</Suspense>
    </PageWrapper>
  );
}

const App = () => (
  <GlobalErrorBoundary>
    <QueryProvider>
      <AuthProvider>
        <PlatformSettingsHydrator />
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <PageMetaManager />
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[#FF7A59] focus:text-white focus:rounded-md focus:font-bold focus:text-sm"
            >
              Skip to main content
            </a>
            <ScrollToTop />
            <ScrollToTopButton />
            <Routes>
              <Route
                path="/"
                element={
                  <PageWrapper routeLabel="home">
                    <Index />
                  </PageWrapper>
                }
              />
              <Route
                path="/about"
                element={
                  <PageWrapper routeLabel="about">
                    <About />
                  </PageWrapper>
                }
              />
              <Route
                path="/how-it-works"
                element={
                  <PageWrapper routeLabel="how-it-works">
                    <HowItWorks />
                  </PageWrapper>
                }
              />
              <Route
                path="/browse-chefs"
                element={
                  <LazyRoute label="browse-chefs">
                    <BrowseChefs />
                  </LazyRoute>
                }
              />
              <Route
                path="/chef/:id"
                element={
                  <LazyRoute label="chef-profile">
                    <ChefProfile />
                  </LazyRoute>
                }
              />
              <Route
                path="/for-chefs"
                element={
                  <PageWrapper routeLabel="for-chefs">
                    <ForChefs />
                  </PageWrapper>
                }
              />
              <Route
                path="/contact"
                element={
                  <PageWrapper routeLabel="contact">
                    <Contact />
                  </PageWrapper>
                }
              />
              <Route
                path="/faq"
                element={
                  <PageWrapper routeLabel="faq">
                    <FAQ />
                  </PageWrapper>
                }
              />
              <Route
                path="/pricing"
                element={
                  <PageWrapper routeLabel="pricing">
                    <Pricing />
                  </PageWrapper>
                }
              />
              <Route
                path="/blog"
                element={
                  <PageWrapper routeLabel="blog">
                    <Blog />
                  </PageWrapper>
                }
              />
              <Route
                path="/unauthorized"
                element={
                  <PageWrapper routeLabel="unauthorized">
                    <Unauthorized />
                  </PageWrapper>
                }
              />
              <Route
                path="/waitlist"
                element={
                  <PageWrapper routeLabel="waitlist">
                    <WaitlistPage />
                  </PageWrapper>
                }
              />
              <Route
                path="/privacy-policy"
                element={
                  <PageWrapper routeLabel="privacy">
                    <PrivacyPolicy />
                  </PageWrapper>
                }
              />
              <Route
                path="/terms"
                element={
                  <PageWrapper routeLabel="terms">
                    <Terms />
                  </PageWrapper>
                }
              />
              <Route
                path="/cookie-policy"
                element={
                  <PageWrapper routeLabel="cookies">
                    <CookiePolicy />
                  </PageWrapper>
                }
              />
              <Route
                path="/legal"
                element={
                  <PageWrapper routeLabel="legal">
                    <LegalHub />
                  </PageWrapper>
                }
              />

              <Route
                path="/reset-password"
                element={
                  <PageWrapper routeLabel="reset-password">
                    <ResetPassword />
                  </PageWrapper>
                }
              />

              <Route element={<GuestGuard />}>
                <Route
                  path="/login"
                  element={
                    <PageWrapper routeLabel="login">
                      <Login />
                    </PageWrapper>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <PageWrapper routeLabel="register">
                      <Register />
                    </PageWrapper>
                  }
                />
                <Route
                  path="/register/family"
                  element={
                    <PageWrapper routeLabel="register-family">
                      <FamilyRegistration />
                    </PageWrapper>
                  }
                />
                <Route
                  path="/register/chef"
                  element={
                    <PageWrapper routeLabel="register-chef">
                      <ChefRegistration />
                    </PageWrapper>
                  }
                />
              </Route>

              <Route element={<AuthGuard />}>
                <Route element={<RoleGuard allowedRoles={["family"]} />}>
                  <Route
                    path="/dashboard/*"
                    element={
                      <LazyRoute label="family-dashboard">
                        <Dashboard />
                      </LazyRoute>
                    }
                  />
                  <Route
                    path="/family-dashboard/*"
                    element={
                      <LazyRoute label="family-dashboard">
                        <Dashboard />
                      </LazyRoute>
                    }
                  />
                </Route>

                <Route element={<RoleGuard allowedRoles={["chef"]} />}>
                  <Route
                    path="/chef-dashboard/*"
                    element={
                      <LazyRoute label="chef-dashboard">
                        <ChefDashboard />
                      </LazyRoute>
                    }
                  />
                </Route>

                <Route element={<AdminGuard />}>
                  <Route
                    path="/admin-dashboard/*"
                    element={
                      <LazyRoute label="admin-dashboard">
                        <AdminDashboard />
                      </LazyRoute>
                    }
                  />
                  <Route
                    path="/admin/launch-control"
                    element={
                      <LazyRoute label="admin-launch-control">
                        <AdminDashboard initialTab="launch_control" />
                      </LazyRoute>
                    }
                  />
                </Route>
              </Route>

              <Route
                path="*"
                element={
                  <PageWrapper routeLabel="not-found">
                    <NotFound />
                  </PageWrapper>
                }
              />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryProvider>
  </GlobalErrorBoundary>
);

createRoot(document.getElementById("root")!).render(<App />);
