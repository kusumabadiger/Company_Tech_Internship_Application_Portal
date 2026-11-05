import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BriefcaseBusiness, CheckCircle2, ShieldCheck, Users } from 'lucide-react';

const values = [
  {
    icon: BriefcaseBusiness,
    title: 'Practical opportunities',
    description: 'Explore structured internships across engineering, design, growth, communications, strategy, and operations.',
  },
  {
    icon: ShieldCheck,
    title: 'A clear application journey',
    description: 'Submit an application, keep your private tracking details, and follow each recorded review milestone.',
  },
  {
    icon: Users,
    title: 'Thoughtful review',
    description: 'Applications move through a consistent review process, with interview and decision updates recorded in one place.',
  },
];

export const AboutPage: React.FC = () => (
  <div className="bg-slate-50">
    <section className="relative overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.22),transparent_42%)]" />
      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-blue-300">About Company Tech</p>
        <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">A clearer path from application to opportunity.</h1>
        <p className="mt-6 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
          Company Tech is an internship portal built to make applying, reviewing, and tracking progress straightforward. Candidates can explore roles and follow their application through a secure, private status page.
        </p>
        <Link to="/internships" className="mt-8 inline-flex items-center gap-2 rounded-lg bg-blue-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-400">
          Explore internship opportunities <ArrowRight size={16} />
        </Link>
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="grid gap-6 md:grid-cols-3">
        {values.map(({ icon: Icon, title, description }) => (
          <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Icon size={21} />
            </div>
            <h2 className="text-base font-bold text-slate-900">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          </article>
        ))}
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-6 rounded-2xl border border-slate-200 bg-white p-7 sm:flex-row sm:items-center sm:p-9">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
            <CheckCircle2 size={15} /> Private application tracking
          </div>
          <h2 className="mt-2 text-xl font-bold text-slate-900">Know where your application stands.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Use your application ID and secret tracking token to view status updates and interview details.</p>
        </div>
        <Link to="/track" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50">
          Track an application <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  </div>
);
