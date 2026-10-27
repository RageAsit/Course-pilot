import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, Lock, Mail, User, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim() || !email.trim() || !password) {
      setFormError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await register(name.trim(), email.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      setFormError(err.message || 'Registration failed. Please check your information.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F0E7] text-[#302C27] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans antialiased animate-fade-in">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 mb-4 text-xs text-[#777064] hover:text-[#68745B] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Workspace
        </Link>
        <div className="flex justify-center">
          <div className="h-10 w-10 rounded-xl bg-[#EEF2EC] border border-[#C5CDC0] flex items-center justify-center text-[#68745B] shadow-sm">
            <Compass className="h-6 w-6" />
          </div>
        </div>
        <h2 className="mt-3 text-2xl font-serif font-bold tracking-tight text-[#302C27]">Create an Account</h2>
        <p className="mt-1 text-xs text-[#777064]">
          Start balancing academic deadlines with intelligent study scheduling
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="rounded-2xl border border-[#DED5C7] bg-[#FFFCF6] p-8 shadow-paper-elevated">
          {formError && (
            <div className="mb-5 rounded-lg border border-[#E8BDB7] bg-[#FBEBE8] p-3.5 flex items-start gap-3">
              <AlertCircle className="h-4 w-4 text-[#B94A3E] mt-0.5 shrink-0" />
              <div className="text-xs text-[#B94A3E]">{formError}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#302C27] mb-1.5">Full Name</label>
              <div className="relative">
                <User className="h-4 w-4 text-[#9A9285] absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Rivera"
                  className="w-full rounded-lg border border-[#DED5C7] bg-[#FAF6EE] pl-9 pr-3 py-2 text-xs text-[#302C27] placeholder-[#9A9285] focus:outline-none focus:border-[#68745B] focus:ring-1 focus:ring-[#68745B]/20 transition-colors shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#302C27] mb-1.5">
                College Email Address
              </label>
              <div className="relative">
                <Mail className="h-4 w-4 text-[#9A9285] absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="w-full rounded-lg border border-[#DED5C7] bg-[#FAF6EE] pl-9 pr-3 py-2 text-xs text-[#302C27] placeholder-[#9A9285] focus:outline-none focus:border-[#68745B] focus:ring-1 focus:ring-[#68745B]/20 transition-colors shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#302C27] mb-1.5">Password</label>
              <div className="relative">
                <Lock className="h-4 w-4 text-[#9A9285] absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full rounded-lg border border-[#DED5C7] bg-[#FAF6EE] pl-9 pr-3 py-2 text-xs text-[#302C27] placeholder-[#9A9285] focus:outline-none focus:border-[#68745B] focus:ring-1 focus:ring-[#68745B]/20 transition-colors shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#302C27] mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="h-4 w-4 text-[#9A9285] absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="w-full rounded-lg border border-[#DED5C7] bg-[#FAF6EE] pl-9 pr-3 py-2 text-xs text-[#302C27] placeholder-[#9A9285] focus:outline-none focus:border-[#68745B] focus:ring-1 focus:ring-[#68745B]/20 transition-colors shadow-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-[#68745B] hover:bg-[#56614A] text-white font-semibold text-xs transition-all shadow-paper flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Register</span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-[#777064]">
            Already have an account?{' '}
            <Link to="/login" className="text-[#68745B] hover:text-[#56614A] font-semibold underline underline-offset-2">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
