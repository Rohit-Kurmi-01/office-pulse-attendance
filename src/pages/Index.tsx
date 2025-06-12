import React from 'react';
import { useAuth } from '@/context/useAuth';
import LoginForm from '@/components/LoginForm';
import EmployeeDashboard from './EmployeeDashboard';
import AdminDashboard from './AdminDashboard';

const Index = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  // Only allow access to the dashboard that matches the user's role
  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }
  if (user?.role === 'employee') {
    return <EmployeeDashboard />;
  }

  // Fallback: if user is authenticated but has no valid role, force logout or show error
  return <div className="text-center mt-10 text-red-600 font-bold">Access denied: Invalid user role.</div>;
};

export default Index;
