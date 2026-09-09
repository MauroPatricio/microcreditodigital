import React from 'react';
import { useAuth } from '../context/AuthContext';

const PermissionGuard = ({ permission, role, children, fallback = null }) => {
    const { hasPermission, hasRole } = useAuth();

    let allowed = true;

    if (permission) {
        allowed = allowed && hasPermission(permission);
    }

    if (role) {
        const rolesArr = Array.isArray(role) ? role : [role];
        allowed = allowed && hasRole(...rolesArr);
    }

    if (!allowed) {
        return fallback;
    }

    return <>{children}</>;
};

export default PermissionGuard;
