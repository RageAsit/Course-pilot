import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Lock, Mail, User, ArrowLeft, Shield } from 'lucide-react';

export default function RegisterPage() {
  const handleSubmit = (e) => {
    e.preventDefault();
  };

  return (
    <div className="min-h-screen bg-[#090d16] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 mb-4 text-xs text-slate-400 hover:text-brand-300 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
        </Link>
        <div className="flex justify-center">
          <div className="h-10 w-10 rounded-xl bg-brand-600/20 border border-brand-500/40 flex items-center justify-center text-brand-400">
            <Compass className="h-6 w-6" />
          </div>
        </div>
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-white">Create an Account</h2>
        <p className="mt-1 text-xs text-slate-400">
          Start balancing academic deadlines with intelligent study scheduling
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="rounded-2xl border border-slate-800 bg-[#0f172a]/80 p-8 backdrop-blur-md shadow-xl">
          {/* Phase 1 notice */}
          <div className="mb-6 rounded-lg border border-brand-500/20 bg-brand-500/5 p-3 flex items-start gap-2.5">
            <Shield className="h-4 w-4 text-brand-400 mt-0.5 shrink-0" />
            <div className="text-xs text-slate-300">
              <span className="font-semibold text-brand-300">Phase 1 Architecture Shell:</span>{' '}
              Registration persistence and bcrypt password hashing will be implemented in Phase 2.
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="h-4 w-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  disabled
                  placeholder="Alex Rivera"
                  className="w-full rounded-lg border border-slate-800 bg-[#090d16]/70 pl-9 pr-3 py-2 text-xs text-slate-400 placeholder-slate-600 cursor-not-allowed focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                College Email Address
              </label>
              <div className="relative">
                <Mail className="h-4 w-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  disabled
                  placeholder="student@university.edu"
                  className="w-full rounded-lg border border-slate-800 bg-[#090d16]/70 pl-9 pr-3 py-2 text-xs text-slate-400 placeholder-slate-600 cursor-not-allowed focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="h-4 w-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  disabled
                  placeholder="••••••••••••"
                  className="w-full rounded-lg border border-slate-800 bg-[#090d16]/70 pl-9 pr-3 py-2 text-xs text-slate-400 placeholder-slate-600 cursor-not-allowed focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled
              className="w-full mt-2 py-2 px-4 rounded-lg bg-brand-600/50 text-slate-400 font-semibold text-xs cursor-not-allowed border border-brand-500/30"
            >
              Register (Active in Phase 2)
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
