import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

type AdminRole = 'superadmin' | 'admin' | 'moderator' | 'viewer' | null;

// Admin email that should have automatic superadmin privileges
const ADMIN_EMAIL = 'this.application.deep@gmail.com';

export const useAdminRole = () => {
  const [role, setRole] = useState<AdminRole>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      checkAdminRole();
    } else {
      setRole(null);
      setIsLoading(false);
    }
  }, [user?.id]); // Changed from [user] to [user?.id] to prevent infinite re-renders

  const checkAdminRole = async () => {
    if (!user) return;

    try {
      // First check if this is the designated admin email
      if (user.email === ADMIN_EMAIL) {
        console.log('Designated admin email detected, setting superadmin role');
        setRole('superadmin');
        setIsLoading(false);
        return;
      }

      // Check for assigned admin role in database using the new safe function
      console.log('Checking database for admin role for user:', user.id);
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No role found
          console.log('No admin role found for user');
          setRole(null);
        } else {
          console.error('Error checking admin role:', error);
          setRole(null);
        }
      } else {
        console.log('Admin role found:', data?.role);
        setRole(data?.role as AdminRole);
      }
    } catch (error) {
      console.error('Error checking admin role:', error);
      setRole(null);
    } finally {
      setIsLoading(false);
    }
  };

  const ensureAdminRole = async (userId: string) => {
    // Note: Admin roles should be pre-created in the database or created by existing superadmins
    // This function now only checks if the role exists, but doesn't create it from client-side
    // to avoid RLS policy conflicts
    console.log('Admin role check for user:', userId, '- Role should be pre-created in database');
  };

  const hasRole = (requiredRole: 'superadmin' | 'admin' | 'moderator' | 'viewer') => {
    if (!role) return false;

    // Superadmin has all permissions
    if (role === 'superadmin') return true;

    // Admin has admin, moderator and viewer permissions
    if (role === 'admin' && ['admin', 'moderator', 'viewer'].includes(requiredRole)) return true;

    // Moderator has moderator and viewer permissions
    if (role === 'moderator' && ['moderator', 'viewer'].includes(requiredRole)) return true;

    // Viewer only has viewer permissions
    if (role === 'viewer' && requiredRole === 'viewer') return true;

    return false;
  };

  return {
    role,
    isLoading,
    isAdmin: role !== null,
    hasRole,
    isSuperAdmin: role === 'superadmin',
    isAdminOrHigher: role === 'superadmin' || role === 'admin',
    canManageUsers: role === 'superadmin' || role === 'admin',
    canModerateContent: role === 'superadmin' || role === 'admin' || role === 'moderator',
  };
};
