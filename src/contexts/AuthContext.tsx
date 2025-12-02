import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { message } from 'antd';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
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

  /**
   * Загрузка данных пользователя из таблицы public.users
   */
  const loadUserData = async (authUser: SupabaseUser): Promise<AuthUser | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error('Ошибка загрузки данных пользователя:', error);
        return null;
      }

      if (!data) {
        console.error('Пользователь не найден в таблице users');
        return null;
      }

      // Формируем объект AuthUser
      const userData: AuthUser = {
        id: data.id,
        email: data.email,
        full_name: data.full_name,
        role: data.role,
        access_status: data.access_status,
        allowed_pages: Array.isArray(data.allowed_pages) ? data.allowed_pages : [],
      };

      return userData;
    } catch (err) {
      console.error('Неожиданная ошибка при загрузке пользователя:', err);
      return null;
    }
  };

  /**
   * Обновление данных текущего пользователя
   */
  const refreshUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (authUser) {
        const userData = await loadUserData(authUser);
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Ошибка обновления пользователя:', error);
      setUser(null);
    }
  };

  /**
   * Выход из системы
   */
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Ошибка при выходе:', error);
        message.error('Не удалось выйти из системы');
      } else {
        setUser(null);
        message.info('Вы вышли из системы');
      }
    } catch (error) {
      console.error('Неожиданная ошибка при выходе:', error);
      message.error('Произошла ошибка при выходе из системы');
    }
  };

  // Инициализация: проверка текущей сессии при монтировании
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Проверяем текущую сессию
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const userData = await loadUserData(session.user);
          setUser(userData);
        }
      } catch (error) {
        console.error('Ошибка инициализации аутентификации:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Подписываемся на изменения состояния аутентификации
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const userData = await loadUserData(session.user);
          setUser(userData);
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Обновляем данные пользователя при обновлении токена
          const userData = await loadUserData(session.user);
          setUser(userData);
        } else if (event === 'USER_UPDATED' && session?.user) {
          // Обновляем данные пользователя при изменении
          const userData = await loadUserData(session.user);
          setUser(userData);
        }
      }
    );

    // Очистка подписки при размонтировании
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Хук для использования AuthContext
 * Выбрасывает ошибку, если используется вне AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
