import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth, resolvePostAuthRoute } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { UserDashboard } from './pages/UserDashboard';

// Pages
import { LandingPage } from './pages/LandingPage';
import { AboutPage } from './pages/AboutPage';
import { InternshipsPage } from './pages/InternshipsPage';
import { ApplyPage } from './pages/ApplyPage';
import { ConfirmationPage } from './pages/ConfirmationPage';
import { TrackPage } from './pages/TrackPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AuthPage } from './pages/AuthPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminDetailView } from './pages/AdminDetailView';
import { WelcomePage } from './pages/WelcomePage';

function AuthRouteGuard() {
  const location = useLocation();
  const { firebaseUser, isAdmin, loading } = useAuth();
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">Loading...</div>;
  }

  if (firebaseUser && firebaseUser.emailVerified) {
    return <Navigate to={resolvePostAuthRoute(firebaseUser, returnTo || (isAdmin ? '/admin' : '/dashboard'))} replace />;
  }

  return <AuthPage />;
}

function ApplicationRouteGuard() {
  const location = useLocation();
  const { firebaseUser, loading } = useAuth();
  const returnTo = `${location.pathname}${location.search}`;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">Loading...</div>;
  }

  if (!firebaseUser) {
    return (
      <Navigate
        to="/auth"
        replace
        state={{
          returnTo,
          message: 'Please sign in or create an account to apply for this internship.',
        }}
      />
    );
  }

  if (!firebaseUser.emailVerified) {
    return (
      <Navigate
        to="/auth"
        replace
        state={{
          returnTo,
          message: 'Please verify your email before continuing with your application.',
        }}
      />
    );
  }

  return <ApplyPage />;
}

function AdminRouteGuard() {
  const { firebaseUser, isAdmin, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">Loading...</div>;
  }

  if (!firebaseUser || !firebaseUser.emailVerified || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <AdminDashboard />;
}

function UserRouteGuard() {
  const { firebaseUser, isAdmin, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">Loading...</div>;
  }

  if (!firebaseUser || !firebaseUser.emailVerified) {
    return <Navigate to="/auth" replace />;
  }

  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return <UserDashboard />;
}

function AppShell() {
  const location = useLocation();
  const isWelcomePage = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased selection:bg-blue-500 selection:text-white">
      {!isWelcomePage && <Navbar />}
      <main className="grow">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<WelcomePage />} />
          <Route path="/home" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/internships" element={<InternshipsPage />} />
          <Route path="/auth" element={<AuthRouteGuard />} />
          <Route path="/apply" element={<ApplicationRouteGuard />} />
          <Route path="/application-confirmation" element={<ConfirmationPage />} />
          <Route path="/track" element={<TrackPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Verified normal-user routes */}
          <Route path="/dashboard" element={<UserRouteGuard />} />
          <Route path="/profile" element={<Navigate to="/dashboard" replace />} />

          {/* Protected Administrator Routes */}
          <Route path="/admin" element={<AdminRouteGuard />} />
          <Route path="/admin/profile" element={<Navigate to="/admin" replace />} />
          <Route path="/admin/applications" element={<Navigate to="/admin" replace />} />
          <Route path="/admin/applications/:applicationId" element={<AdminDetailView />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!isWelcomePage && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </AuthProvider>
  );
}
