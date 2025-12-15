import React, { useState, useEffect, useRef } from 'react';
import { Form, Input, Button, Card, message, Typography, Spin } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined, LoadingOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { HeaderIcon } from '../../components/Icons/HeaderIcon';

const { Title, Text } = Typography;

interface LoginFormValues {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Автоматический редирект если пользователь уже авторизован
  useEffect(() => {
    console.log('[Login] useEffect: проверка user для редиректа', {
      user: !!user,
      access_status: user?.access_status,
      authLoading,
      loading,
    });

    // Если пользователь уже авторизован и одобрен, перенаправляем
    // Не ждем authLoading - редиректим сразу как только user доступен
    if (user && user.access_status === 'approved') {
      console.log('[Login] useEffect: пользователь авторизован, готовим редирект');
      // Отменяем таймаут загрузки если он был установлен
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }

      // Всегда перенаправляем на dashboard после входа
      const targetPath = user.allowed_pages.length === 0
        ? '/dashboard'
        : user.allowed_pages[0];

      console.log('[Login] useEffect: редирект на', targetPath);
      navigate(targetPath, { replace: true });
    }
  }, [user, navigate, authLoading, loading]);

  const handleLogin = async (values: LoginFormValues) => {
    console.log('[Login] handleLogin: начало входа для email:', values.email);
    setLoading(true);

    try {
      // 1. Аутентификация через Supabase Auth
      console.log('[Login] handleLogin: вызываем signInWithPassword');
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      console.log('[Login] handleLogin: результат signInWithPassword:', {
        userId: authData?.user?.id,
        error: authError,
      });

      if (authError) {
        console.error('[Login] handleLogin: ошибка аутентификации:', authError);

        if (authError.message.includes('Invalid login credentials')) {
          message.error('Неверный email или пароль');
        } else {
          message.error(`Ошибка входа: ${authError.message}`);
        }
        setLoading(false);
        return;
      }

      if (!authData.user) {
        console.error('[Login] handleLogin: authData.user отсутствует');
        message.error('Не удалось получить данные пользователя');
        setLoading(false);
        return;
      }

      // 2. Проверяем пользователя в таблице users (теперь мы авторизованы)
      console.log('[Login] handleLogin: запрашиваем данные из public.users');
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      console.log('[Login] handleLogin: результат запроса public.users:', {
        userData: !!userData,
        access_status: userData?.access_status,
        access_enabled: userData?.access_enabled,
        error: userError,
      });

      if (userError || !userData) {
        console.error('[Login] handleLogin: ошибка загрузки данных пользователя:', userError);
        await supabase.auth.signOut(); // Выходим из auth
        message.error('Ошибка загрузки данных пользователя');
        setLoading(false);
        return;
      }

      // 3. Проверяем access_enabled
      if (!userData.access_enabled) {
        console.log('[Login] handleLogin: access_enabled = false, выходим');
        await supabase.auth.signOut(); // Выходим из auth
        message.error('Доступ запрещен. Обратитесь к Администратору');
        setLoading(false);
        return;
      }

      // 4. Проверяем статус одобрения
      if (userData.access_status !== 'approved') {
        console.log('[Login] handleLogin: access_status != approved:', userData.access_status);
        await supabase.auth.signOut(); // Выходим из auth

        if (userData.access_status === 'pending') {
          message.warning('Ваша заявка ожидает одобрения администратором');
        } else if (userData.access_status === 'blocked') {
          message.error('Ваш аккаунт заблокирован. Обратитесь к Администратору');
        }
        setLoading(false);
        return;
      }

      // 5. Успешный вход - AuthContext обновит user, и useEffect сделает редирект
      // Оставляем loading=true, чтобы показать индикатор загрузки
      // Но добавляем fallback таймаут на случай если AuthContext не загрузит user
      console.log('[Login] handleLogin: вход успешен, ожидаем AuthContext');
      loadingTimeoutRef.current = setTimeout(() => {
        console.error('[Login] handleLogin: таймаут ожидания AuthContext');
        setLoading(false);
        message.error('Превышено время ожидания загрузки. Попробуйте обновить страницу');
      }, 10000);
    } catch (error) {
      console.error('[Login] handleLogin: неожиданная ошибка:', error);
      message.error('Произошла неожиданная ошибка при входе');
      setLoading(false);
    }
  };

  // Полноэкранный индикатор загрузки
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <Spin
          indicator={<LoadingOutlined style={{ fontSize: 48, color: '#fff' }} spin />}
        />
        <Text style={{ marginTop: 24, fontSize: 18, color: '#fff' }}>
          Вход в систему...
        </Text>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 24,
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 450,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
          borderRadius: 8,
        }}
      >
        {/* Логотип и заголовок */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: 32,
          }}
        >
          <div style={{ marginBottom: 16 }}>
            <HeaderIcon size={64} color="#10b981" />
          </div>
          <Title level={3} style={{ marginBottom: 8, color: '#10b981' }}>
            TenderHUB
          </Title>
          <Text type="secondary">Портал управления тендерами</Text>
        </div>

        {/* Форма входа */}
        <Form
          form={form}
          name="login"
          onFinish={handleLogin}
          layout="vertical"
          requiredMark={false}
          autoComplete="off"
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Введите email' },
              { type: 'email', message: 'Введите корректный email' },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="example@su10.ru"
              size="large"
              autoComplete="email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Пароль"
            rules={[{ required: true, message: 'Введите пароль' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Введите пароль"
              size="large"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              htmlType="submit"
              icon={<LoginOutlined />}
              loading={loading}
              block
              size="large"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
              }}
            >
              Войти
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <Link to="/forgot-password" style={{ color: '#10b981' }}>
              Забыли пароль?
            </Link>
          </div>

          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">
              Нет аккаунта?{' '}
              <Link to="/register" style={{ color: '#10b981' }}>
                Зарегистрироваться
              </Link>
            </Text>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
