import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#F5F0E7] flex flex-col items-center justify-center p-4 text-center font-sans antialiased animate-fade-in">
      <div className="h-12 w-12 rounded-xl bg-[#EEF2EC] border border-[#C5CDC0] flex items-center justify-center text-[#68745B] mb-4 shadow-sm">
        <Compass className="h-6 w-6" />
      </div>
      <h1 className="text-4xl font-serif font-extrabold tracking-tight text-[#302C27]">404</h1>
      <p className="mt-2 text-base font-serif font-semibold text-[#302C27]">Page Not Found</p>
      <p className="mt-1 text-xs text-[#777064] max-w-sm">
        The requested URL was not found on this CoursePilot workspace.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#68745B] hover:bg-[#56614A] text-white text-xs font-semibold transition-all shadow-paper active:scale-[0.98]"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Return to Workspace
      </Link>
    </div>
  );
}
