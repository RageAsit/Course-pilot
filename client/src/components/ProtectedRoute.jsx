import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Compass } from 'lucide-react';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex flex-col items-center justify-center p-4">
        <div className="h-12 w-12 rounded-xl bg-brand-600/20 border border-brand-500/40 flex items-center justify-center text-brand-400 mb-4 animate-pulse">
          <Compass className="h-6 w-6 animate-spin text-brand-400" />
        </div>
        <p className="text-sm font-medium text-slate-400">Verifying session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
}
