import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Building2, Shield, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Footer: React.FC = () => {
  const navigate = useNavigate();
  const { firebaseUser, isAdmin } = useAuth();
  const location = useLocation();
  const isAdminPortal = isAdmin && location.pathname.startsWith('/admin');
  const isHomePage = location.pathname === '/home';

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
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Mission */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-400">
                <Building2 size={18} />
              </div>
              <span className="text-white font-bold tracking-tight text-base">Company Tech</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Internship Application & Management Automation System. Streamlining applicant registration, decision workflows, offer-letter generation, and status tracking.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Navigation</h4>
            <ul className="space-y-1.5 text-xs">
              {isAdminPortal ? (
                <li>
                  <Link to="/admin" className="hover:text-white transition-colors">Applications</Link>
                </li>
              ) : (
                <>
                  <li><Link to="/home" className="hover:text-white transition-colors">Home</Link></li>
                  <li><Link to="/internships" className="hover:text-white transition-colors">Internship Opportunities (12 Roles)</Link></li>
                  <li><Link to="/about" className="hover:text-white transition-colors">About Company Tech</Link></li>
                  <li><Link to="/track" className="hover:text-white transition-colors">Track Application Status</Link></li>
                  {firebaseUser ? (
                    <li><Link to="/dashboard" className="hover:text-white transition-colors">My Portal</Link></li>
                  ) : !isHomePage ? (
                    <li><Link to="/apply" onClick={handleApplyClick} className="hover:text-white transition-colors">Apply Now</Link></li>
                  ) : null}
                </>
              )}
            </ul>
          </div>

          {/* Architecture & Reliability */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Architecture</h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-emerald-500" />
                Firebase Cloud Firestore
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-emerald-500" />
                Firebase Authentication
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-emerald-500" />
                Server-side PDF Generation (pdf-lib)
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-emerald-500" />
                Transactional Email (Resend)
              </li>
            </ul>
          </div>

          {/* Demonstration Notice */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Shield size={13} className="text-blue-400" />
              Demonstration Notice
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Company Tech is a demonstration organization for this internship management automation prototype. No affiliation with any real-world commercial entity is claimed.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© 2026 Company Tech. All rights reserved.</p>
          <p className="text-slate-400">Repository: company-tech-internship-management-system</p>
        </div>
      </div>
    </footer>
  );
};
