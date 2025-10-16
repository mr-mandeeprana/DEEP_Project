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
  }, [user]);

  const checkAdminRole = async () => {
    if (!user) return;

    try {
      // First check if this is the designated admin email
      if (user.email === ADMIN_EMAIL) {
        // Ensure the admin role exists in the database
        await ensureAdminRole(user.id);
        setRole('superadmin');
        setIsLoading(false);
        return;
      }

      // Check for assigned admin role in database
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No role found
          setRole(null);
        } else {
          console.error('Error checking admin role:', error);
        }
      } else {
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
    try {
      // Check if admin role already exists
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!existingRole) {
        // Create superadmin role for the designated admin email
        const { error } = await supabase
          .from('user_roles')
          .insert([{
            user_id: userId,
            role: 'superadmin'
          }]);

        if (error) {
          console.error('Error creating admin role:', error);
        } else {
          console.log('Admin role created for designated admin email');
        }
      }
    } catch (error) {
      console.error('Error ensuring admin role:', error);
    }
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
