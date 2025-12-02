import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Result, Spin, Button } from 'antd';
import { LoadingOutlined, ClockCircleOutlined, StopOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { hasPageAccess } from '../../lib/supabase/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Компонент для защиты маршрутов
 * Проверяет аутентификацию, статус доступа и права на страницу
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, signOut } = useAuth();
  const location = useLocation();

  // Показываем загрузку пока проверяем авторизацию
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
        <span style={{ fontSize: 16, color: '#666' }}>Загрузка...</span>
      </div>
    );
  }

  // Если пользователь не авторизован - перенаправляем на страницу входа
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Если пользователь ожидает одобрения
  if (user.access_status === 'pending') {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          padding: 24,
        }}
      >
        <Result
          icon={<ClockCircleOutlined style={{ color: '#faad14' }} />}
          status="info"
          title="Ожидание одобрения"
          subTitle={
            <div style={{ maxWidth: 500, margin: '0 auto' }}>
              <p>
                Ваш запрос на регистрацию отправлен администраторам.
              </p>
              <p>
                После одобрения вы получите доступ к порталу.
              </p>
              <p style={{ marginTop: 16, color: '#666', fontSize: 14 }}>
                <strong>Email:</strong> {user.email}<br />
                <strong>ФИО:</strong> {user.full_name}<br />
                <strong>Роль:</strong> {user.role}
              </p>
            </div>
          }
          extra={
            <Button type="primary" onClick={signOut}>
              Выйти
            </Button>
          }
        />
      </div>
    );
  }

  // Если пользователь заблокирован
  if (user.access_status === 'blocked') {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          padding: 24,
        }}
      >
        <Result
          icon={<StopOutlined style={{ color: '#ff4d4f' }} />}
          status="error"
          title="Доступ заблокирован"
          subTitle={
            <div style={{ maxWidth: 500, margin: '0 auto' }}>
              <p>
                Ваш доступ к порталу заблокирован администратором.
              </p>
              <p>
                Для получения дополнительной информации свяжитесь с администратором.
              </p>
              <p style={{ marginTop: 16, color: '#666', fontSize: 14 }}>
                <strong>Email:</strong> {user.email}<br />
                <strong>ФИО:</strong> {user.full_name}
              </p>
            </div>
          }
          extra={
            <Button type="primary" danger onClick={signOut}>
              Выйти
            </Button>
          }
        />
      </div>
    );
  }

  // Проверяем доступ к текущей странице
  if (!hasPageAccess(user, location.pathname)) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          padding: 24,
        }}
      >
        <Result
          status="403"
          title="Доступ запрещен"
          subTitle={
            <div style={{ maxWidth: 500, margin: '0 auto' }}>
              <p>
                У вас нет прав для доступа к этой странице.
              </p>
              <p style={{ marginTop: 16, color: '#666', fontSize: 14 }}>
                <strong>Ваша роль:</strong> {user.role}<br />
                <strong>Запрошенная страница:</strong> {location.pathname}
              </p>
            </div>
          }
          extra={
            <Button type="primary" onClick={() => window.history.back()}>
              Назад
            </Button>
          }
        />
      </div>
    );
  }

  // Пользователь авторизован, одобрен и имеет доступ к странице
  return <>{children}</>;
};

export default ProtectedRoute;
