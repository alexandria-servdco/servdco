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
import { PageMetaManager } from "@/components/seo/PageMetaManager";
import { DeferredMonitoring } from "@/components/DeferredMonitoring";
import { cn } from "@/lib/utils";

import Index from "./pages/Index";
import { GuestGuard, AuthGuard, RoleGuard, AdminGuard, AccountStatusGuard } from "./components/Guards";
import { LaunchRegionGuard } from "./components/LaunchRegionGuard";
import { CookieConsentBanner, CookiePreferencesManager } from "@/components/legal/CookieConsentBanner";
import { SessionPolicyManager } from "@/hooks/useSessionPolicy";
import { LegalReacceptanceModal } from "@/components/legal/LegalReacceptanceModal";
import ScrollToTopButton from "./components/ScrollToTopButton";
import { PlatformSettingsHydrator } from "./components/PlatformSettingsHydrator";
import { OfflineBanner } from "@/components/OfflineBanner";

const Login = lazy(() => import("./pages/Login"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Register = lazy(() => import("./pages/Register"));
const ChefRegistration = lazy(() => import("./pages/ChefRegistration"));
const FamilyRegistration = lazy(() => import("./pages/FamilyRegistration"));
const WaitlistPage = lazy(() => import("./pages/WaitlistPage"));
const WaitlistDashboard = lazy(() => import("./pages/WaitlistDashboard"));
const MaintenancePage = lazy(() => import("./pages/MaintenancePage"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Careers = lazy(() => import("./pages/Careers"));
const CareerJob = lazy(() => import("./pages/CareerJob"));
const CareerApply = lazy(() => import("./pages/CareerApply"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ServerError = lazy(() => import("./pages/ServerError"));
const OfflinePage = lazy(() => import("./pages/OfflinePage"));
const ForChefs = lazy(() => import("./pages/ForChefs"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Unauthorized = lazy(() => import("./pages/Unauthorized"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Terms = lazy(() => import("./pages/Terms"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const LegalHub = lazy(() => import("./pages/LegalHub"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ChefDashboard = lazy(() => import("./pages/ChefDashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const BrowseChefs = lazy(() => import("./pages/BrowseChefs"));
const ChefProfile = lazy(() => import("./pages/ChefProfile"));

validateClientStartup();

function RouteFallback() {
  return (
    <div
      className="min-h-[40vh] p-6 md:p-10 animate-pulse space-y-4"
      role="status"
      aria-live="polite"
      aria-label="Loading page"
    >
      <div className="h-8 bg-white/10 rounded-lg max-w-md" />
      <div className="h-4 bg-white/5 rounded max-w-sm" />
      <div className="grid gap-3 pt-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-32 bg-white/5 rounded-2xl" />
        <div className="h-32 bg-white/5 rounded-2xl hidden sm:block" />
        <div className="h-32 bg-white/5 rounded-2xl hidden lg:block" />
      </div>
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
            ? "min-h-[100dvh] h-[100dvh] max-h-[100dvh] overflow-y-auto overflow-x-hidden overscroll-y-contain"
            : "min-h-screen overflow-x-hidden",
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
  viewportLocked,
}: {
  label: string;
  children: React.ReactNode;
  viewportLocked?: boolean;
}) {
  return (
    <PageWrapper routeLabel={label} viewportLocked={viewportLocked}>
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
          <Sonner theme="dark" richColors closeButton position="top-center" />
          <BrowserRouter>
            <DeferredMonitoring />
            <PageMetaManager />
            <OfflineBanner />
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
                  <LazyRoute label="about">
                    <About />
                  </LazyRoute>
                }
              />
              <Route
                path="/how-it-works"
                element={
                  <LazyRoute label="how-it-works">
                    <HowItWorks />
                  </LazyRoute>
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
                  <LazyRoute label="for-chefs">
                    <ForChefs />
                  </LazyRoute>
                }
              />
              <Route
                path="/contact"
                element={
                  <LazyRoute label="contact">
                    <Contact />
                  </LazyRoute>
                }
              />
              <Route
                path="/careers"
                element={
                  <LazyRoute label="careers">
                    <Careers />
                  </LazyRoute>
                }
              />
              <Route
                path="/careers/apply"
                element={
                  <LazyRoute label="careers-apply">
                    <CareerApply />
                  </LazyRoute>
                }
              />
              <Route
                path="/careers/:jobId"
                element={
                  <LazyRoute label="career-job">
                    <CareerJob />
                  </LazyRoute>
                }
              />
              <Route
                path="/faq"
                element={
                  <LazyRoute label="faq">
                    <FAQ />
                  </LazyRoute>
                }
              />
              <Route
                path="/pricing"
                element={
                  <LazyRoute label="pricing">
                    <Pricing />
                  </LazyRoute>
                }
              />
              <Route
                path="/unauthorized"
                element={
                  <LazyRoute label="unauthorized">
                    <Unauthorized />
                  </LazyRoute>
                }
              />
              <Route
                path="/waitlist"
                element={
                  <LazyRoute label="waitlist">
                    <WaitlistPage />
                  </LazyRoute>
                }
              />
              <Route
                path="/maintenance"
                element={
                  <LazyRoute label="maintenance">
                    <MaintenancePage />
                  </LazyRoute>
                }
              />
              <Route
                path="/privacy-policy"
                element={
                  <LazyRoute label="privacy">
                    <PrivacyPolicy />
                  </LazyRoute>
                }
              />
              <Route
                path="/terms"
                element={
                  <LazyRoute label="terms">
                    <Terms />
                  </LazyRoute>
                }
              />
              <Route
                path="/cookie-policy"
                element={
                  <LazyRoute label="cookies">
                    <CookiePolicy />
                  </LazyRoute>
                }
              />
              <Route
                path="/legal"
                element={
                  <LazyRoute label="legal">
                    <LegalHub />
                  </LazyRoute>
                }
              />

              <Route
                path="/reset-password"
                element={
                  <LazyRoute label="reset-password" viewportLocked>
                    <ResetPassword />
                  </LazyRoute>
                }
              />

              <Route element={<GuestGuard />}>
                <Route
                  path="/login"
                  element={
                    <LazyRoute label="login" viewportLocked>
                      <Login />
                    </LazyRoute>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <LazyRoute label="register" viewportLocked>
                      <Register />
                    </LazyRoute>
                  }
                />
                <Route
                  path="/register/family"
                  element={
                    <LazyRoute label="register-family" viewportLocked>
                      <FamilyRegistration />
                    </LazyRoute>
                  }
                />
                <Route
                  path="/register/chef"
                  element={
                    <LazyRoute label="register-chef" viewportLocked>
                      <ChefRegistration />
                    </LazyRoute>
                  }
                />
              </Route>

              <Route element={<AuthGuard />}>
                <Route element={<AccountStatusGuard />}>
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
              </Route>

              <Route
                path="/error"
                element={
                  <LazyRoute label="server-error">
                    <ServerError />
                  </LazyRoute>
                }
              />
              <Route
                path="/offline"
                element={
                  <LazyRoute label="offline">
                    <OfflinePage />
                  </LazyRoute>
                }
              />
              <Route
                path="*"
                element={
                  <LazyRoute label="not-found">
                    <NotFound />
                  </LazyRoute>
                }
              />
            </Routes>
            <CookieConsentBanner />
            <CookiePreferencesManager />
            <SessionPolicyManager />
            <LegalReacceptanceModal />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryProvider>
  </GlobalErrorBoundary>
);

createRoot(document.getElementById("root")!).render(<App />);
