// src/components/c3s/RoleGuard.tsx
import React from 'react';
import { useC3SStore } from '@/store/c3sStore';
import type { C3SRole } from '@/lib/mock-data/users';
import { getRoleDefaultPath, hasPermission, normalizeRole, type Permission } from '@/lib/rbac';
import { useLocation, Navigate } from 'react-router-dom';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: C3SRole[];
  requiredPermission?: Permission;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  requiredPermission
}) => {
  const { currentRole, isAuthenticated } = useC3SStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  }

  // Normalized Role validation to seamlessly support both canonical roles ('GUARD', 'GATEKEEPER') and aliases
  const canonicalCurrentRole = normalizeRole(currentRole);
  const isAllowed = allowedRoles
    ? allowedRoles.some((role) => normalizeRole(role) === canonicalCurrentRole || role === currentRole)
    : true;
  const hasPerm = requiredPermission ? hasPermission(currentRole, requiredPermission) : true;

  if (isAllowed && hasPerm) {
    return <>{children}</>;
  }

  // User is not authorized: DO NOT SHOW THE PAGE, NO SWITCH USER, NO ROLE ELEVATION REQUIRED
  // Redirect directly to the user's authorized role path
  return <Navigate to={getRoleDefaultPath(currentRole)} replace />;
};
