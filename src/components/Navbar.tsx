import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Building2, Search, ArrowRight, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAdmin, firebaseUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isCurrent = (path: string) => location.pathname === path;
  const isHomePage = location.pathname === '/home';
  const isAdminPortal = isAdmin && location.pathname.startsWith('/admin');

  const handleSignOut = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const handleApplyClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!firebaseUser) {
      event.preventDefault();
      navigate('/auth', {
        state: {
          returnTo: '/apply',
          message: 'Please sign in or create an account to apply for this internship.',
        },
      });
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
        {firebaseUser && (
          <div className="bg-slate-900 text-white text-[11px] tracking-wide">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex items-center justify-end gap-2">
              <span className="font-medium">Signed in:</span>
              <span>{firebaseUser.email || 'Unknown email'}</span>
              <span className="text-slate-300">|</span>
              <span>{firebaseUser.emailVerified ? 'Email verified: Yes' : 'Email verified: No'}</span>
            </div>
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo & Name */}
            <Link to={isAdminPortal ? '/admin' : '/home'} className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-sm group-hover:bg-slate-800 transition-colors">
                <Building2 size={20} className="text-blue-400" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-slate-900 tracking-tight text-base leading-none">
                  Company Tech
                </span>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mt-0.5">
                  {isAdminPortal ? 'Admin Portal' : 'Internship Portal'}
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-600">
              {isAdminPortal ? (
                <Link to="/admin" aria-current={isCurrent('/admin') ? 'page' : undefined} className={`px-3 py-2 rounded-md hover:bg-slate-50 ${isCurrent('/admin') ? 'bg-blue-50 text-blue-800 font-semibold' : ''}`}>
                  Applications
                </Link>
              ) : (
                <>
                  <Link
                    to="/internships"
                    className={`px-3 py-2 rounded-md hover:text-slate-900 hover:bg-slate-50 transition-colors ${
                      isCurrent('/internships') ? 'text-slate-900 font-semibold bg-slate-50' : ''
                    }`}
                  >
                    Internship Opportunities
                  </Link>
                  <Link
                    to="/about"
                    className={`px-3 py-2 rounded-md hover:text-slate-900 hover:bg-slate-50 transition-colors ${
                      isCurrent('/about') ? 'text-slate-900 font-semibold bg-slate-50' : ''
                    }`}
                  >
                    About Us
                  </Link>
                  <Link
                    to="/track"
                    className={`px-3 py-2 rounded-md hover:text-slate-900 hover:bg-slate-50 transition-colors flex items-center gap-1.5 ${
                      isCurrent('/track') ? 'text-slate-900 font-semibold bg-slate-50' : ''
                    }`}
                  >
                    <Search size={14} className="text-slate-400" />
                    Track Application
                  </Link>
                </>
              )}
            </nav>

            {/* Right Action Items */}
            <div className="hidden md:flex items-center gap-2.5">
              {/* Auth & Apply CTAs */}
              {firebaseUser ? (
                <>
                  {!isAdminPortal && <Link to="/dashboard" className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900">My Portal</Link>}
                  <button
                    onClick={handleSignOut}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : !isHomePage ? (
                <Link
                  to="/auth"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
                >
                  Sign In
                </Link>
              ) : null}
              {!isAdminPortal && !firebaseUser && !isHomePage && <Link
                to="/apply"
                onClick={handleApplyClick}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md text-white bg-slate-900 hover:bg-slate-800 shadow-sm transition-colors"
              >
                Apply Now
                <ArrowRight size={13} />
              </Link>}

            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden items-center gap-2">
              {!isAdminPortal && !firebaseUser && !isHomePage && <Link
                to="/apply"
                onClick={handleApplyClick}
                className="px-2.5 py-1 text-xs font-semibold rounded text-white bg-slate-900"
              >
                Apply
              </Link>}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
            {isAdminPortal ? (
              <>
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-md bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800"
                >
                  Applications
                </Link>
                <button
                  onClick={handleSignOut}
                  className="mt-2 w-full border-t border-slate-100 px-3 pt-3 text-left text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/internships" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Internship Opportunities
                </Link>
                <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50">
                  About Us
                </Link>
                <Link to="/track" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Track Application
                </Link>
                {firebaseUser && <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-sm font-semibold text-blue-700 hover:bg-blue-50">
                  My Portal
                </Link>}
                {!firebaseUser && !isHomePage && <Link
                  to="/auth"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-900"
                >
                  Sign In / Create Account
                </Link>}
              </>
            )}
          </div>
        )}
      </header>

    </>
  );
};
