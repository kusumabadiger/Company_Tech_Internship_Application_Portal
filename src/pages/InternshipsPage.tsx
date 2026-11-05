import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Search, CheckCircle, Code, Shield, Users, Sparkles, Building2 } from 'lucide-react';
import { INTERNSHIP_ROLES } from '../types';
import { ROLE_DETAILS } from '../config/roles';
import { useAuth } from '../context/AuthContext';

export const InternshipsPage: React.FC = () => {
  const navigate = useNavigate();
  const { firebaseUser } = useAuth();

  const handleApplyNavigation = (role?: string) => {
    const destination = role ? `/apply?role=${encodeURIComponent(role)}` : '/apply';

    if (!firebaseUser) {
      navigate('/auth', {
        state: {
          returnTo: destination,
          message: 'Please sign in or create an account to apply for this internship.',
        },
      });
      return false;
    }

    return true;
  };

  return (
    <div className="space-y-16 pb-20">
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white pt-16 pb-20 border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.12),transparent_50%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="mx-auto max-w-4xl space-y-6 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-medium text-blue-400">
              <Sparkles size={13} />
              <span>Open Opportunities</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Internship Opportunities at <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-sky-300">Company Tech</span>
            </h1>

            <p className="mx-auto max-w-3xl text-base sm:text-lg text-slate-300 leading-relaxed">
              Explore the internship tracks available across engineering, design, growth, communications, and operations. Each role includes hands-on project work, mentorship, and a structured application process.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                to="/apply"
                onClick={(event) => {
                  if (!firebaseUser) {
                    event.preventDefault();
                    handleApplyNavigation();
                  }
                }}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-md transition-colors"
              >
                Apply Now
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/track"
                className="inline-flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                <Search size={15} />
                Track Application
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 pt-8 border-t border-slate-800 text-center sm:grid-cols-3">
              <div>
                <div className="text-2xl font-bold text-white">12</div>
                <div className="text-xs text-slate-400">Specialized Roles</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">Project-based</div>
                <div className="text-xs text-slate-400">Hands-on Learning</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">Structured</div>
                <div className="text-xs text-slate-400">Mentored Experience</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Open Opportunities
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Explore Internship Roles
          </h2>
          <p className="text-sm text-slate-600">
            Select the role that matches your interests or academic background. Each internship is designed to provide practical exposure and measurable outcomes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {INTERNSHIP_ROLES.map((roleName) => {
            const role = ROLE_DETAILS[roleName];

            return (
              <div
                key={roleName}
                className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between hover:border-blue-400 hover:shadow-md transition-all duration-200 group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {role.department}
                    </span>
                    <span className="text-[11px] text-slate-400">Internship</span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {role.role}
                    </h3>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      {role.shortDescription}
                    </p>
                  </div>

                  <div className="pt-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
                      Core Focus
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {role.focusAreas.map((area) => (
                        <span
                          key={area}
                          className="text-[11px] px-2 py-0.5 bg-slate-50 border border-slate-200/80 rounded text-slate-600"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Company Tech</span>
                  <Link
                    to={`/apply?role=${encodeURIComponent(role.role)}`}
                    onClick={(event) => {
                      if (!firebaseUser) {
                        event.preventDefault();
                        handleApplyNavigation(role.role);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Apply for Role
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-2xl p-8 sm:p-12 border border-slate-800">
          <div className="max-w-3xl space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              About the Organization
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Empowering the Next Generation of Technologists
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Company Tech combines structured learning with real-world project execution. Interns work across product, engineering, growth, and operations teams to build skills that translate directly into professional opportunity.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6">
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Shield size={18} />
                </div>
                <h4 className="text-sm font-semibold">Transparent Review</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Structured application tracking keeps every candidate informed and secure.
                </p>
              </div>

              <div className="space-y-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Code size={18} />
                </div>
                <h4 className="text-sm font-semibold">Real-World Projects</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Interns contribute meaningfully to product delivery and technical execution.
                </p>
              </div>

              <div className="space-y-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Users size={18} />
                </div>
                <h4 className="text-sm font-semibold">Official Credentials</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Verified application records and offer letters are issued through the platform.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-50 via-slate-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-900">
              Already Submitted an Application?
            </h3>
            <p className="text-xs text-slate-600 max-w-xl">
              Track your application status and review updates using the application tracking workflow.
            </p>
          </div>
          <Link
            to="/track"
            className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition-colors"
          >
            <Search size={14} />
            Track Application Now
          </Link>
        </div>
      </section>
    </div>
  );
};
