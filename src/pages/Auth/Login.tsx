import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { useNavigate, useLocation, Link } from 'react-router-dom';
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
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();

  // Получаем путь, с которого пользователь был перенаправлен
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  // Автоматический редирект если пользователь уже авторизован
  useEffect(() => {
    // Если пользователь уже авторизован и одобрен, перенаправляем
    if (user && user.access_status === 'approved' && !authLoading) {
      // Определяем, куда перенаправить пользователя
      let targetPath = from;

      // Если пользователь пытается попасть на страницу, к которой у него нет доступа
      // или это дефолтный редирект на /dashboard
      if (from === '/dashboard' || from === '/') {
        // Если allowed_pages пуст - полный доступ, идем на /dashboard
        if (user.allowed_pages.length === 0) {
          targetPath = '/dashboard';
        } else {
          // Иначе берем первую доступную страницу
          targetPath = user.allowed_pages[0];
        }
      }

      navigate(targetPath, { replace: true });
    }
  }, [user, authLoading, navigate, from]);

  const handleLogin = async (values: LoginFormValues) => {
    setLoading(true);

    try {
      // 1. Аутентификация через Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (authError) {
        console.error('Ошибка аутентификации:', authError);

        if (authError.message.includes('Invalid login credentials')) {
          message.error('Неверный email или пароль');
        } else {
          message.error(`Ошибка входа: ${authError.message}`);
        }
        setLoading(false);
        return;
      }

      if (!authData.user) {
        message.error('Не удалось получить данные пользователя');
        setLoading(false);
        return;
      }

      // 2. Проверяем пользователя в таблице users (теперь мы авторизованы)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (userError || !userData) {
        console.error('Ошибка загрузки данных пользователя:', userError);
        await supabase.auth.signOut(); // Выходим из auth
        message.error('Ошибка загрузки данных пользователя');
        setLoading(false);
        return;
      }

      // 3. Проверяем пароль из таблицы users (если установлен)
      if (userData.password && userData.password !== values.password) {
        await supabase.auth.signOut(); // Выходим из auth
        message.error('Неверный пароль');
        setLoading(false);
        return;
      }

      // 4. Проверяем access_enabled
      if (!userData.access_enabled) {
        await supabase.auth.signOut(); // Выходим из auth
        message.error('Доступ запрещен. Обратитесь к Администратору');
        setLoading(false);
        return;
      }

      // 5. Проверяем статус одобрения
      if (userData.access_status !== 'approved') {
        await supabase.auth.signOut(); // Выходим из auth

        if (userData.access_status === 'pending') {
          message.warning('Ваша заявка ожидает одобрения администратором');
        } else if (userData.access_status === 'blocked') {
          message.error('Ваш аккаунт заблокирован. Обратитесь к Администратору');
        }
        setLoading(false);
        return;
      }

      // 6. Успешный вход - AuthContext автоматически обновит пользователя через onAuthStateChange
      // useEffect сработает когда user загрузится и сделает редирект
      message.success('Вход выполнен успешно');
    } catch (error) {
      console.error('Неожиданная ошибка при входе:', error);
      message.error('Произошла неожиданная ошибка при входе');
    } finally {
      setLoading(false);
    }
  };

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
