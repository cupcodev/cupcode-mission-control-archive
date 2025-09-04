import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AccessDenied } from './AccessDenied';

interface RequireRoleProps {
  children: ReactNode;
  minRole: 'admin' | 'superadmin';
}

export const RequireRole = ({ children, minRole }: RequireRoleProps) => {
  const { profile, loading } = useAuth();

  if (loading) {
    return null; // Let ProtectedRoute handle loading state
  }

  const userRole = profile?.role || 'user';
  
  // Role hierarchy: user < admin < superadmin
  const hasPermission = () => {
    if (minRole === 'admin') {
      return userRole === 'admin' || userRole === 'superadmin';
    }
    if (minRole === 'superadmin') {
      return userRole === 'superadmin';
    }
    return false;
  };

  if (!hasPermission()) {
    return <AccessDenied />;
  }

  return <>{children}</>;
};