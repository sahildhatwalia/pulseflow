import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('pulseflow_token');
    if (token) {
      // Basic check if token exists. Real verification happens on API calls.
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
    setIsVerifying(false);
  }, []);

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600 mb-4" />
        <p className="text-slate-500 font-medium">Verifying clinical session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};
