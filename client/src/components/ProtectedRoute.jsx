import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Compass } from 'lucide-react';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F0E7] flex flex-col items-center justify-center p-4">
        <div className="h-12 w-12 rounded-xl bg-[#EEF2EC] border border-[#C5CDC0] flex items-center justify-center text-[#68745B] mb-4 shadow-sm">
          <Compass className="h-6 w-6 animate-spin text-[#68745B]" />
        </div>
        <p className="text-xs font-medium text-[#777064]">Verifying workspace session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
}
