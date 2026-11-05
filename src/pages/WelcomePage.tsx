import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, Sparkles } from 'lucide-react';

export const WelcomePage: React.FC = () => {
  return (
    <main className="relative flex min-h-screen min-h-[100svh] items-center justify-center overflow-hidden bg-slate-950 px-4 py-8 text-white sm:px-6">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_20%,rgba(37,99,235,0.28),transparent_45%),radial-gradient(ellipse_at_10%_90%,rgba(14,165,233,0.12),transparent_45%)]" />
      <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center text-center">
        <Link to="/" className="inline-flex items-center gap-3" aria-label="Company Tech welcome page">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-blue-300 ring-1 ring-white/15">
            <Building2 size={22} />
          </span>
          <span>
            <span className="block text-base font-bold tracking-tight">Company Tech</span>
            <span className="block text-[10px] uppercase tracking-[0.18em] text-slate-400">Internship Portal</span>
          </span>
        </Link>

        <div className="mt-12 w-full max-w-4xl sm:mt-14">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1.5 text-xs font-medium text-blue-200">
            <Sparkles size={14} /> Opportunities to learn by doing
          </div>
          <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
            Build skills.<br />Make your next move.
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-sm leading-7 text-slate-300 sm:text-lg">
            Find a role that fits your ambition, apply in a few steps, and follow your internship journey from one place.
          </p>
          <Link
            to="/home"
            className="mt-9 inline-flex items-center gap-2 rounded-lg bg-blue-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-950/40 transition-colors hover:bg-blue-400"
          >
            Get Started
            <ArrowRight size={16} />
          </Link>
          <p className="mt-5 text-xs text-slate-500">Internship opportunities, secure applications, and status tracking.</p>
        </div>
      </div>
    </main>
  );
};
