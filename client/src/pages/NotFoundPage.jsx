import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#090d16] flex flex-col items-center justify-center p-4 text-center">
      <div className="h-12 w-12 rounded-xl bg-brand-600/20 border border-brand-500/40 flex items-center justify-center text-brand-400 mb-4">
        <Compass className="h-6 w-6" />
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight text-white">404</h1>
      <p className="mt-2 text-base font-medium text-slate-300">Page Not Found</p>
      <p className="mt-1 text-xs text-slate-400 max-w-sm">
        The requested URL was not found on this CoursePilot workspace.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Return to Dashboard
      </Link>
    </div>
  );
}
