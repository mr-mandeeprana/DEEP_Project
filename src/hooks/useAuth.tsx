import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
        
        // Ensure profile exists and update last login date when user signs in
        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(async () => {
            await ensureProfileExists(session.user.id, session.user.email || '');
            await updateLastLoginDate(session.user.id);
          }, 0);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      
      // Ensure profile exists for existing sessions
      if (session?.user) {
        await ensureProfileExists(session.user.id, session.user.email || '');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const ensureProfileExists = async (userId: string, userEmail: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!profile) {
        const displayName = userEmail.split('@')[0];
        const { data } = await supabase.rpc('generate_username', {
          base_name: displayName,
          user_id: userId
        });
        
        await supabase
          .from('profiles')
          .insert({
            user_id: userId,
            display_name: displayName,
            username: data || `user${Date.now()}`,
            credits: 50
          });
      }
    } catch (error) {
      console.error('Error ensuring profile exists:', error);
    }
  };

  const updateLastLoginDate = async (userId: string) => {
    try {
      await supabase
        .from('profiles')
        .update({ last_login_date: new Date().toISOString().split('T')[0] })
        .eq('user_id', userId);
    } catch (error) {
      console.error('Error updating last login date:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};