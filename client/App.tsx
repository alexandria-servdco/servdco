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
import { cn } from "@/lib/utils";

import Index from "./pages/Index";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Register from "./pages/Register";
import ChefRegistration from "./pages/ChefRegistration";
import FamilyRegistration from "./pages/FamilyRegistration";
import WaitlistPage from "./pages/WaitlistPage";
import WaitlistDashboard from "./pages/WaitlistDashboard";
import MaintenancePage from "./pages/MaintenancePage";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Careers from "./pages/Careers";
import CareerJob from "./pages/CareerJob";
import CareerApply from "./pages/CareerApply";
import NotFound from "./pages/NotFound";
import ForChefs from "./pages/ForChefs";
import HowItWorks from "./pages/HowItWorks";
import FAQ from "./pages/FAQ";
import Pricing from "./pages/Pricing";
import Unauthorized from "./pages/Unauthorized";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import CookiePolicy from "./pages/CookiePolicy";
import LegalHub from "./pages/LegalHub";
import { GuestGuard, AuthGuard, RoleGuard, AdminGuard } from "./components/Guards";
import { LaunchRegionGuard } from "./components/LaunchRegionGuard";
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
  viewportLocked,
}: {
  children: React.ReactNode;
  routeLabel?: string;
  viewportLocked?: boolean;
}) {
  return (
    <RouteErrorBoundary label={routeLabel}>
      <div
        id="main-content"
        tabIndex={-1}
        className={cn(
          "w-full flex flex-col outline-none animate-page-in",
          viewportLocked
            ? "h-[100dvh] max-h-[100dvh] overflow-hidden"
            : "min-h-screen",
        )}
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
                path="/careers"
                element={
                  <PageWrapper routeLabel="careers">
                    <Careers />
                  </PageWrapper>
                }
              />
              <Route
                path="/careers/apply"
                element={
                  <PageWrapper routeLabel="careers-apply">
                    <CareerApply />
                  </PageWrapper>
                }
              />
              <Route
                path="/careers/:jobId"
                element={
                  <PageWrapper routeLabel="career-job">
                    <CareerJob />
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
                path="/maintenance"
                element={
                  <PageWrapper routeLabel="maintenance">
                    <MaintenancePage />
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
                  <PageWrapper routeLabel="reset-password" viewportLocked>
                    <ResetPassword />
                  </PageWrapper>
                }
              />

              <Route element={<GuestGuard />}>
                <Route
                  path="/login"
                  element={
                    <PageWrapper routeLabel="login" viewportLocked>
                      <Login />
                    </PageWrapper>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <PageWrapper routeLabel="register" viewportLocked>
                      <Register />
                    </PageWrapper>
                  }
                />
                <Route
                  path="/register/family"
                  element={
                    <PageWrapper routeLabel="register-family" viewportLocked>
                      <FamilyRegistration />
                    </PageWrapper>
                  }
                />
                <Route
                  path="/register/chef"
                  element={
                    <PageWrapper routeLabel="register-chef" viewportLocked>
                      <ChefRegistration />
                    </PageWrapper>
                  }
                />
              </Route>

              <Route element={<AuthGuard />}>
                <Route
                  path="/waitlist-dashboard"
                  element={
                    <LazyRoute label="waitlist-dashboard">
                      <WaitlistDashboard />
                    </LazyRoute>
                  }
                />

                <Route element={<RoleGuard allowedRoles={["family"]} />}>
                  <Route element={<LaunchRegionGuard />}>
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
                </Route>

                <Route element={<RoleGuard allowedRoles={["chef"]} />}>
                  <Route element={<LaunchRegionGuard />}>
                    <Route
                      path="/chef-dashboard/*"
                      element={
                        <LazyRoute label="chef-dashboard">
                          <ChefDashboard />
                        </LazyRoute>
                      }
                    />
                  </Route>
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
