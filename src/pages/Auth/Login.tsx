import React, { useState } from 'react';
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
  const { refreshUser } = useAuth();

  // Получаем путь, с которого пользователь был перенаправлен
  const from = (location.state as any)?.from?.pathname || '/dashboard';

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
        return;
      }

      if (!authData.user) {
        message.error('Не удалось получить данные пользователя');
        return;
      }

      // 2. Проверяем статус пользователя в public.users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('access_status')
        .eq('id', authData.user.id)
        .single();

      if (userError) {
        console.error('Ошибка загрузки данных пользователя:', userError);

        // Если пользователь не найден в public.users - выходим
        await supabase.auth.signOut();
        message.error('Пользователь не найден в системе');
        return;
      }

      // 3. Проверяем статус доступа
      if (userData.access_status === 'pending') {
        await supabase.auth.signOut();
        message.warning('Ваш запрос на регистрацию еще не одобрен администратором');
        return;
      }

      if (userData.access_status === 'blocked') {
        await supabase.auth.signOut();
        message.error('Ваш доступ к системе заблокирован');
        return;
      }

      // 4. Обновляем данные пользователя в контексте
      await refreshUser();

      // 5. Успешный вход
      message.success('Вход выполнен успешно');
      navigate(from, { replace: true });
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
