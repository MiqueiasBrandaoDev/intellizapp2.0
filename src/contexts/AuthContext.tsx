import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { apiService } from '@/services/api';

// Intervalo de verificação de sessão (5 minutos)
const SESSION_CHECK_INTERVAL = 5 * 60 * 1000;

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
  changePassword: (newPassword: string) => Promise<void>;
  refreshSession: () => Promise<boolean>;
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
  const sessionCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const userRef = useRef<User | null>(null);

  // Keep userRef in sync with user state
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Função para verificar e renovar sessão
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🔄 Verificando sessão...');
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();

      if (error || !currentSession) {
        console.log('⚠️ Sessão não encontrada, tentando refresh...');
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();

        if (refreshError || !refreshedSession) {
          console.error('❌ Falha ao renovar sessão:', refreshError);
          // Limpa o estado e redireciona para login
          setUser(null);
          setProfile(null);
          setSession(null);
          apiService.clearTokenCache();
          return false;
        }

        console.log('✅ Sessão renovada com sucesso');
        setSession(refreshedSession);
        setUser(refreshedSession.user);
        return true;
      }

      // Verifica se o token está prestes a expirar (menos de 10 minutos)
      const expiresAt = currentSession.expires_at;
      if (expiresAt) {
        const now = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = expiresAt - now;

        if (timeUntilExpiry < 600) { // 10 minutos
          console.log('⏰ Token expirando em breve, renovando...');
          const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();

          if (refreshError || !refreshedSession) {
            console.error('❌ Falha ao renovar sessão:', refreshError);
            return false;
          }

          console.log('✅ Sessão renovada com sucesso');
          setSession(refreshedSession);
          setUser(refreshedSession.user);
        }
      }

      return true;
    } catch (error) {
      console.error('❌ Erro ao verificar sessão:', error);
      return false;
    }
  }, []);

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
    let isMounted = true;
    let initialLoadDone = false;

    // Get initial session
    const initializeAuth = async () => {
      console.log('🚀 Initializing auth...');
      try {
        // Primeiro, tenta recuperar a sessão existente
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('❌ Error getting session:', sessionError);
          // Se houver erro, tenta refresh
          const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
          if (refreshedSession && isMounted) {
            console.log('🔄 Session refreshed successfully');
            setSession(refreshedSession);
            setUser(refreshedSession.user);
            const userProfile = await fetchProfile(refreshedSession.user.id);
            setProfile(userProfile);
          }
          if (isMounted) {
            setLoading(false);
            initialLoadDone = true;
          }
          return;
        }

        console.log('📋 Current session:', currentSession ? 'exists' : 'null');

        if (currentSession && isMounted) {
          // Verifica se o token está expirado
          const tokenExp = currentSession.expires_at;
          const now = Math.floor(Date.now() / 1000);

          if (tokenExp && tokenExp < now) {
            console.log('⏰ Token expired, refreshing...');
            const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
            if (refreshedSession && isMounted) {
              setSession(refreshedSession);
              setUser(refreshedSession.user);
              const userProfile = await fetchProfile(refreshedSession.user.id);
              setProfile(userProfile);
            }
            if (isMounted) {
              setLoading(false);
              initialLoadDone = true;
            }
            return;
          }

          setSession(currentSession);
          setUser(currentSession.user);

          // Fetch user profile using auth_id
          console.log('📂 Fetching profile...');
          const userProfile = await fetchProfile(currentSession.user.id);
          console.log('📂 Profile result:', userProfile ? 'found' : 'not found');

          if (isMounted) {
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
        }
      } catch (error) {
        console.error('❌ Error initializing auth:', error);
      } finally {
        if (isMounted) {
          console.log('✅ Auth initialization complete, setting loading to false');
          setLoading(false);
          initialLoadDone = true;
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('🔄 Auth state changed:', event, '| initialLoadDone:', initialLoadDone);

      // Skip if this is the initial SIGNED_IN event and we're still doing initial load
      // This prevents race conditions with initializeAuth
      if (!initialLoadDone && event === 'SIGNED_IN') {
        console.log('⏭️ Skipping SIGNED_IN event during initial load');
        return;
      }

      if (!isMounted) return;

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

        if (isMounted) {
          setProfile(userProfile);

          window.dispatchEvent(new CustomEvent('userLoggedIn', {
            detail: { user: newSession.user }
          }));
        }
      } else {
        if (isMounted) {
          setProfile(null);
        }
      }

      if (isMounted) {
        setLoading(false);
      }
    });

    // Iniciar verificação periódica de sessão
    sessionCheckInterval.current = setInterval(() => {
      if (userRef.current) {
        refreshSession();
      }
    }, SESSION_CHECK_INTERVAL);

    // Também verificar quando a janela ganha foco (usuário volta para a aba)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && userRef.current) {
        console.log('👁️ Janela voltou ao foco, verificando sessão...');
        refreshSession();
      }
    };

    const handleFocus = () => {
      if (userRef.current) {
        console.log('👁️ Janela ganhou foco, verificando sessão...');
        refreshSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // Listen for session expired events from API service
    const handleSessionExpired = () => {
      console.log('🚫 Session expired event received, logging out...');
      setUser(null);
      setProfile(null);
      setSession(null);
      apiService.clearTokenCache();
      // Redirect to login
      window.location.href = '/auth/login';
    };

    window.addEventListener('sessionExpired', handleSessionExpired);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('sessionExpired', handleSessionExpired);
    };
  }, [refreshSession]);

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

      // Limpa cache do token na API
      apiService.clearTokenCache();

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

  const changePassword = async (newPassword: string) => {
    console.log('🔐 Iniciando alteração de senha...');

    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });

    console.log('🔐 Resposta do Supabase:', { data, error });

    if (error) {
      console.error('🔐 Erro ao alterar senha:', error);
      // Traduzir mensagens comuns do Supabase
      if (error.message.includes('different from the old password')) {
        throw new Error('A nova senha deve ser diferente da senha atual.');
      }
      if (error.message.includes('at least')) {
        throw new Error('A senha deve ter pelo menos 6 caracteres.');
      }
      throw new Error(error.message);
    }

    console.log('🔐 Senha alterada com sucesso!');
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
    changePassword,
    refreshSession,
    loading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
