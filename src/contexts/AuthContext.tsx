import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { AuthUser } from '../lib/supabase/types';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const userRef = useRef<AuthUser | null>(null);
  const initCompletedRef = useRef(false);

  // Синхронизируем ref с state
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Загрузка данных пользователя из public.users
  const loadUserData = useCallback(async (authUserId: string): Promise<AuthUser | null> => {
    console.log('[AuthContext] loadUserData: начало для userId:', authUserId);
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          full_name,
          role_code,
          access_status,
          allowed_pages,
          access_enabled,
          roles:role_code (
            name,
            color
          )
        `)
        .eq('id', authUserId)
        .single();

      console.log('[AuthContext] loadUserData: ответ:', { hasData: !!data, error: error?.message });

      if (error || !data) {
        console.error('[AuthContext] loadUserData: ошибка:', error?.message);
        return null;
      }

      const rolesData = data.roles as { name: string; color: string } | null;

      return {
        id: data.id,
        email: data.email,
        full_name: data.full_name,
        role: rolesData?.name as any || 'Инженер',
        role_code: data.role_code,
        role_color: rolesData?.color,
        access_status: data.access_status,
        allowed_pages: data.allowed_pages || [],
        access_enabled: data.access_enabled,
      };
    } catch (err) {
      console.error('[AuthContext] loadUserData: исключение:', err);
      return null;
    }
  }, []);

  // Обновление данных пользователя
  const refreshUser = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const userData = await loadUserData(session.user.id);
      setUser(userData);
    } else {
      setUser(null);
    }
  }, [loadUserData]);

  // Выход из системы
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    }
  }, []);

  // Инициализация при монтировании
  useEffect(() => {
    let mounted = true;
    console.log('[AuthContext] useEffect: монтирование');

    // Подписываемся на изменения auth состояния
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthContext] onAuthStateChange:', event);

      if (!mounted) return;

      // Игнорируем INITIAL_SESSION - обработаем в initAuth
      if (event === 'INITIAL_SESSION') {
        console.log('[AuthContext] INITIAL_SESSION: пропускаем');
        return;
      }

      if (event === 'SIGNED_IN' && session?.user) {
        // Обрабатываем только если initAuth завершился И user ещё не установлен
        if (initCompletedRef.current && !userRef.current) {
          console.log('[AuthContext] SIGNED_IN: загружаем пользователя');
          const userData = await loadUserData(session.user.id);
          if (mounted && userData?.access_enabled && userData?.access_status === 'approved') {
            setUser(userData);
          }
          setLoading(false);
        } else {
          console.log('[AuthContext] SIGNED_IN: пропускаем (init:', initCompletedRef.current, ', user:', !!userRef.current, ')');
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('[AuthContext] SIGNED_OUT');
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        console.log('[AuthContext] TOKEN_REFRESHED');
        const userData = await loadUserData(session.user.id);
        if (mounted && userData) {
          setUser(userData);
        }
      }
    });

    const initAuth = async () => {
      console.log('[AuthContext] initAuth: начало');
      try {
        // Таймаут для getSession - если зависнет, продолжаем без сессии
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<{ data: { session: null }, error: null }>((resolve) => {
          setTimeout(() => {
            console.warn('[AuthContext] initAuth: таймаут getSession (5с)');
            resolve({ data: { session: null }, error: null });
          }, 5000);
        });

        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);
        console.log('[AuthContext] initAuth: сессия:', session?.user?.id ? 'есть' : 'нет');

        if (session?.user && mounted) {
          const userData = await loadUserData(session.user.id);
          console.log('[AuthContext] initAuth: userData:', !!userData);

          if (mounted) {
            if (userData?.access_enabled && userData?.access_status === 'approved') {
              console.log('[AuthContext] initAuth: устанавливаем user');
              setUser(userData);
            } else {
              console.log('[AuthContext] initAuth: пользователь не одобрен');
              await supabase.auth.signOut();
            }
          }
        }
      } catch (error) {
        console.error('[AuthContext] initAuth: ошибка:', error);
      } finally {
        initCompletedRef.current = true;
        if (mounted) {
          console.log('[AuthContext] initAuth: loading=false');
          setLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      console.log('[AuthContext] размонтирование');
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserData]);

  return (
    <AuthContext.Provider value={{ user, loading, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// HOC для компонентов, требующих навигации после signOut
export const useAuthWithNavigation = () => {
  const auth = useAuth();
  const navigate = useNavigate();

  const signOutAndRedirect = useCallback(async () => {
    await auth.signOut();
    navigate('/login', { replace: true });
  }, [auth, navigate]);

  return {
    ...auth,
    signOut: signOutAndRedirect,
  };
};
