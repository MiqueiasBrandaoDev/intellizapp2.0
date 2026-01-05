import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  auth_id: string;
  nome: string;
  email: string;
  instancia?: string;
  plano_ativo: boolean;
  max_grupos: number;
  tokens_mes: number;
  horaResumo?: string;
  resumoDiaAnterior?: boolean;
  transcricao_ativa?: boolean;
  'transcricao-pvd'?: boolean;
  transcreverEu?: boolean;
  ludico?: boolean;
  agendamento?: boolean;
  'key-openai'?: string;
  ambiente?: 'prod' | 'dev';
  avatar_url?: string;
  criado_em?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, nome: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile from database using auth_id
  const fetchProfile = async (authId: string): Promise<UserProfile | null> => {
    try {
      console.log('🔍 Fetching profile for auth_id:', authId);
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('auth_id', authId)
        .single();

      if (error) {
        // Se não encontrar, pode ser que o perfil ainda não existe
        if (error.code === 'PGRST116') {
          console.log('📭 Profile not found for auth_id:', authId);
          return null;
        }
        console.error('❌ Error fetching profile:', error);
        return null;
      }

      console.log('✅ Profile found:', data);
      return data as UserProfile;
    } catch (error) {
      console.error('❌ Exception fetching profile:', error);
      return null;
    }
  };

  // Create profile for new users
  const createProfile = async (authId: string, email: string, nome: string, avatarUrl?: string): Promise<UserProfile | null> => {
    try {
      console.log('📝 Creating profile for:', { authId, email, nome });
      const newProfile = {
        auth_id: authId,
        nome: nome || email.split('@')[0],
        email: email,
        plano_ativo: false,
        max_grupos: 3,
        tokens_mes: 1000,
        avatar_url: avatarUrl,
        criado_em: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('usuarios')
        .insert([newProfile])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating profile:', error);
        return null;
      }

      console.log('✅ Profile created:', data);
      return data as UserProfile;
    } catch (error) {
      console.error('❌ Exception creating profile:', error);
      return null;
    }
  };

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      console.log('🚀 Initializing auth...');
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        console.log('📋 Current session:', currentSession ? 'exists' : 'null');

        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);

          // Fetch user profile using auth_id
          const userProfile = await fetchProfile(currentSession.user.id);
          if (userProfile) {
            setProfile(userProfile);
          } else {
            // Create profile if doesn't exist (for OAuth users)
            console.log('⚠️ No profile found, attempting to create...');
            const newProfile = await createProfile(
              currentSession.user.id,
              currentSession.user.email || '',
              currentSession.user.user_metadata?.full_name || currentSession.user.user_metadata?.name || '',
              currentSession.user.user_metadata?.avatar_url
            );
            if (newProfile) {
              setProfile(newProfile);
            } else {
              console.warn('⚠️ Could not create profile - table might not exist yet');
            }
          }

          // Dispatch event for other components
          window.dispatchEvent(new CustomEvent('userLoggedIn', {
            detail: { user: currentSession.user }
          }));
        }
      } catch (error) {
        console.error('❌ Error initializing auth:', error);
      } finally {
        console.log('✅ Auth initialization complete, setting loading to false');
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('Auth state changed:', event);

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        // Fetch or create profile
        let userProfile = await fetchProfile(newSession.user.id);

        if (!userProfile && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
          userProfile = await createProfile(
            newSession.user.id,
            newSession.user.email || '',
            newSession.user.user_metadata?.full_name || newSession.user.user_metadata?.name || '',
            newSession.user.user_metadata?.avatar_url
          );
        }

        setProfile(userProfile);

        window.dispatchEvent(new CustomEvent('userLoggedIn', {
          detail: { user: newSession.user }
        }));
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const userProfile = await fetchProfile(data.user.id);
        setProfile(userProfile);
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, nome: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: nome,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Create profile with auth_id
        await createProfile(data.user.id, email, nome);
      }
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setProfile(null);
      setSession(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user || !profile) return;

    try {
      const { data: updatedProfile, error } = await supabase
        .from('usuarios')
        .update(data)
        .eq('auth_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(updatedProfile as UserProfile);
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  };

  const value = {
    user,
    profile,
    session,
    signInWithEmail,
    signInWithGoogle,
    signUp,
    signOut,
    updateProfile,
    resetPassword,
    loading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
