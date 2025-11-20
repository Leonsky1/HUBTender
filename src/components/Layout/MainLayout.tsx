import React, { useState } from 'react';
import { Layout, Menu, Avatar, Badge, Input, Switch, theme } from 'antd';
import type { MenuProps } from 'antd';
import {
  HomeOutlined,
  DashboardOutlined,
  ShoppingCartOutlined,
  CalculatorOutlined,
  BookOutlined,
  DollarOutlined,
  SettingOutlined,
  UserOutlined,
  SearchOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  SunOutlined,
  MoonOutlined,
  ProfileOutlined,
  FileTextOutlined,
  BankOutlined,
  PercentageOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { LogoIcon } from '../Icons';
import './MainLayout.css';

const { Header, Sider, Content } = Layout;

interface MainLayoutProps {
  children?: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme: currentTheme, toggleTheme } = useTheme();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const menuItems: MenuProps['items'] = [
    // {
    //   key: '/',
    //   icon: <HomeOutlined />,
    //   label: 'Главная',
    // },
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Дашборд',
    },
    {
      key: '/positions',
      icon: <ShoppingCartOutlined />,
      label: 'Позиции заказчика',
    },
    {
      key: '/commerce',
      icon: <CalculatorOutlined />,
      label: 'Коммерция',
    },
    {
      key: 'library',
      icon: <BookOutlined />,
      label: 'Библиотеки',
      children: [
        {
          key: '/library',
          icon: <BookOutlined />,
          label: 'Материалы и работы',
        },
        {
          key: '/library/templates',
          icon: <ProfileOutlined />,
          label: 'Шаблоны',
        },
      ],
    },
    {
      key: '/bsm',
      icon: <FileTextOutlined />,
      label: 'Базовая стоимость',
    },
    {
      key: '/costs',
      icon: <DollarOutlined />,
      label: 'Затраты на строительство',
    },
    {
      key: 'admin',
      icon: <SettingOutlined />,
      label: 'Администрирование',
      children: [
        {
          key: '/admin/nomenclatures',
          icon: <ProfileOutlined />,
          label: 'Номенклатуры',
        },
        {
          key: '/admin/tenders',
          icon: <FileTextOutlined />,
          label: 'Тендеры',
        },
        {
          key: '/admin/construction_cost',
          icon: <BankOutlined />,
          label: 'Затраты строительства',
        },
        {
          key: '/admin/markup',
          icon: <PercentageOutlined />,
          label: 'Проценты наценок',
        },
        {
          type: 'divider',
        },
        {
          key: '/admin/markup_constructor',
          icon: <PercentageOutlined />,
          label: 'Конструктор наценок',
        },
      ],
    },
    {
      key: '/users',
      icon: <UserOutlined />,
      label: 'Пользователи',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: 'Настройки',
    },
  ];

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    // Предотвращаем навигацию только если это не клик по ссылке
    // (клик колесом обрабатывается браузером нативно через Link)
    if (e.domEvent && 'button' in e.domEvent && !e.domEvent.button) {
      e.domEvent.preventDefault();
      navigate(e.key);
    }
  };

  // Функция для преобразования пунктов меню в ссылки
  const renderMenuItem = (item: any) => {
    // Если это группа (есть children), не рендерим как ссылку
    if (item.children) {
      return item.label;
    }
    // Если есть key, рендерим как Link для поддержки открытия в новой вкладке
    if (item.key && item.key.startsWith('/')) {
      return <Link to={item.key}>{item.label}</Link>;
    }
    return item.label;
  };

  // Преобразуем menuItems, добавляя label как функцию рендеринга
  const processedMenuItems = menuItems.map((item: any) => {
    if (item.children) {
      return {
        ...item,
        children: item.children.map((child: any) => ({
          ...child,
          label: child.type === 'divider' ? undefined : renderMenuItem(child),
        })),
      };
    }
    return {
      ...item,
      label: renderMenuItem(item),
    };
  });

  return (
    <Layout style={{ minHeight: '100vh', height: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className={`sidebar-${currentTheme}`}
        style={{
          background: currentTheme === 'dark' ? '#0a0a0a' : '#fff',
          borderRight: currentTheme === 'light' ? '1px solid #f0f0f0' : 'none',
        }}
        width={250}
      >
        <div
          className={`logo logo-${currentTheme}`}
          onClick={() => navigate('/dashboard')}
          style={{ cursor: 'pointer' }}
        >
          {collapsed ? (
            <div className="logo-collapsed">
              <LogoIcon size={80} color={currentTheme === 'dark' ? '#10b981' : '#ffffff'} />
            </div>
          ) : (
            <div className="logo-expanded">
              <div className="logo-icon-wrapper">
                <LogoIcon size={52} color={currentTheme === 'dark' ? '#10b981' : '#ffffff'} />
              </div>
              <div className="logo-text-wrapper">
                <div className="logo-title">TenderHUB</div>
                <div className="logo-subtitle">by SU_10</div>
              </div>
            </div>
          )}
        </div>
        <Menu
          theme={currentTheme}
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={location.pathname.startsWith('/admin') ? ['admin'] : location.pathname.startsWith('/library') ? ['library'] : []}
          items={processedMenuItems}
          onClick={handleMenuClick}
          style={{
            background: 'transparent',
            borderRight: 0,
          }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: currentTheme === 'dark' ? '#0a0a0a' : '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: currentTheme === 'light' ? '1px solid #e8e8e8' : 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
              className: 'trigger',
              onClick: () => setCollapsed(!collapsed),
              style: {
                fontSize: '18px',
                cursor: 'pointer',
              },
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SunOutlined style={{ fontSize: '16px', color: currentTheme === 'light' ? '#faad14' : '#888' }} />
              <Switch
                checked={currentTheme === 'dark'}
                onChange={toggleTheme}
                style={{ backgroundColor: currentTheme === 'dark' ? '#10b981' : '#ccc' }}
              />
              <MoonOutlined style={{ fontSize: '16px', color: currentTheme === 'dark' ? '#10b981' : '#888' }} />
            </div>

            <Badge count={3}>
              <BellOutlined style={{ fontSize: '18px', cursor: 'pointer' }} />
            </Badge>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span>Пользователь</span>
              <Avatar style={{ backgroundColor: '#10b981' }} icon={<UserOutlined />} />
            </div>
            <LogoutOutlined style={{ fontSize: '18px', cursor: 'pointer' }} />
          </div>
        </Header>
        <Content
          style={{
            padding: 16,
            minHeight: 280,
            background: colorBgContainer,
            overflow: 'auto',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;