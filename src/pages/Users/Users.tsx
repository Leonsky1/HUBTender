import React, { useState, useEffect } from 'react';
import { Card, Tabs, Table, Button, Space, Tag, Modal, Form, Transfer, message, Popconfirm, Typography } from 'antd';
import { CheckOutlined, CloseOutlined, EditOutlined, StopOutlined, UnlockOutlined, UserOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { TransferProps } from 'antd';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { canManageUsers, ALL_PAGES, PAGE_LABELS, type User, type UserRole, type AccessStatus } from '../../lib/supabase/types';
import dayjs from 'dayjs';

const { TabPane } = Tabs;
const { Text } = Typography;

interface PendingRequest {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  registration_date: string;
}

interface UserRecord {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  access_status: AccessStatus;
  allowed_pages: string[];
  registration_date: string;
  approved_by?: string;
  approved_at?: string;
}

const Users: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [form] = Form.useForm();

  // Проверка доступа
  const hasAccess = currentUser && canManageUsers(currentUser.role);

  // Загрузка запросов на регистрацию
  const loadPendingRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email, role, registration_date')
        .eq('access_status', 'pending')
        .order('registration_date', { ascending: false });

      if (error) {
        console.error('Ошибка загрузки запросов:', error);
        message.error('Не удалось загрузить запросы на регистрацию');
        return;
      }

      setPendingRequests(data || []);
    } catch (err) {
      console.error('Неожиданная ошибка:', err);
      message.error('Произошла ошибка при загрузке данных');
    } finally {
      setLoading(false);
    }
  };

  // Загрузка всех пользователей
  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('registration_date', { ascending: false });

      if (error) {
        console.error('Ошибка загрузки пользователей:', error);
        message.error('Не удалось загрузить пользователей');
        return;
      }

      setUsers(data || []);
    } catch (err) {
      console.error('Неожиданная ошибка:', err);
      message.error('Произошла ошибка при загрузке данных');
    } finally {
      setLoading(false);
    }
  };

  // Одобрение запроса
  const approveRequest = async (request: PendingRequest) => {
    if (!currentUser) return;

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          access_status: 'approved',
          approved_by: currentUser.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', request.id);

      if (updateError) {
        console.error('Ошибка одобрения:', updateError);
        message.error('Не удалось одобрить запрос');
        return;
      }

      // Отправляем уведомление пользователю
      const { error: notificationError } = await supabase.from('notifications').insert({
        user_id: request.id,
        type: 'success',
        title: 'Регистрация одобрена',
        message: `Ваш запрос на регистрацию одобрен. Роль: ${request.role}`,
        is_read: false,
      });

      if (notificationError) {
        console.error('Ошибка отправки уведомления:', notificationError);
      }

      message.success(`Пользователь ${request.full_name} одобрен`);
      loadPendingRequests();
      loadUsers();
    } catch (err) {
      console.error('Неожиданная ошибка:', err);
      message.error('Произошла ошибка при одобрении');
    }
  };

  // Отклонение запроса
  const rejectRequest = async (request: PendingRequest) => {
    try {
      // Удаляем пользователя из public.users
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', request.id);

      if (deleteError) {
        console.error('Ошибка отклонения:', deleteError);
        message.error('Не удалось отклонить запрос');
        return;
      }

      // Удаляем из auth.users через admin API (если доступно)
      // В production это должно делаться через backend function
      try {
        await supabase.auth.admin.deleteUser(request.id);
      } catch (authError) {
        console.warn('Не удалось удалить из auth.users:', authError);
      }

      message.success(`Запрос от ${request.full_name} отклонен`);
      loadPendingRequests();
    } catch (err) {
      console.error('Неожиданная ошибка:', err);
      message.error('Произошла ошибка при отклонении');
    }
  };

  // Блокировка пользователя
  const blockUser = async (user: UserRecord) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ access_status: 'blocked' })
        .eq('id', user.id);

      if (error) {
        console.error('Ошибка блокировки:', error);
        message.error('Не удалось заблокировать пользователя');
        return;
      }

      message.success(`Пользователь ${user.full_name} заблокирован`);
      loadUsers();
    } catch (err) {
      console.error('Неожиданная ошибка:', err);
      message.error('Произошла ошибка при блокировке');
    }
  };

  // Разблокировка пользователя
  const unblockUser = async (user: UserRecord) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ access_status: 'approved' })
        .eq('id', user.id);

      if (error) {
        console.error('Ошибка разблокировки:', error);
        message.error('Не удалось разблокировать пользователя');
        return;
      }

      message.success(`Пользователь ${user.full_name} разблокирован`);
      loadUsers();
    } catch (err) {
      console.error('Неожиданная ошибка:', err);
      message.error('Произошла ошибка при разблокировке');
    }
  };

  // Открытие модального окна редактирования
  const openEditModal = (user: UserRecord) => {
    setEditingUser(user);
    form.setFieldsValue({
      role: user.role,
      allowed_pages: user.allowed_pages || [],
    });
    setIsEditModalVisible(true);
  };

  // Сохранение изменений
  const handleSaveEdit = async () => {
    if (!editingUser) return;

    try {
      const values = await form.validateFields();

      const { error } = await supabase
        .from('users')
        .update({
          role: values.role,
          allowed_pages: values.allowed_pages || [],
        })
        .eq('id', editingUser.id);

      if (error) {
        console.error('Ошибка обновления:', error);
        message.error('Не удалось обновить пользователя');
        return;
      }

      message.success(`Пользователь ${editingUser.full_name} обновлен`);
      setIsEditModalVisible(false);
      setEditingUser(null);
      form.resetFields();
      loadUsers();
    } catch (err) {
      console.error('Ошибка валидации:', err);
    }
  };

  // Колонки таблицы запросов
  const pendingColumns: ColumnsType<PendingRequest> = [
    {
      title: 'ФИО',
      dataIndex: 'full_name',
      key: 'full_name',
      width: 200,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 200,
    },
    {
      title: 'Роль',
      dataIndex: 'role',
      key: 'role',
      width: 150,
      render: (role: UserRole) => {
        const colors: Record<UserRole, string> = {
          'Руководитель': 'purple',
          'Администратор': 'red',
          'Старший группы': 'blue',
          'Инженер': 'green',
        };
        return <Tag color={colors[role]}>{role}</Tag>;
      },
    },
    {
      title: 'Дата регистрации',
      dataIndex: 'registration_date',
      key: 'registration_date',
      width: 150,
      render: (date: string) => dayjs(date).format('DD.MM.YYYY HH:mm'),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 150,
      render: (_: any, record: PendingRequest) => (
        <Space size="small">
          <Popconfirm
            title="Одобрить пользователя?"
            description={`Пользователь ${record.full_name} получит доступ к системе`}
            onConfirm={() => approveRequest(record)}
            okText="Одобрить"
            cancelText="Отмена"
          >
            <Button type="primary" size="small" icon={<CheckOutlined />}>
              Одобрить
            </Button>
          </Popconfirm>
          <Popconfirm
            title="Отклонить запрос?"
            description="Пользователь будет удален из системы"
            onConfirm={() => rejectRequest(record)}
            okText="Отклонить"
            cancelText="Отмена"
            okType="danger"
          >
            <Button danger size="small" icon={<CloseOutlined />}>
              Отклонить
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Колонки таблицы пользователей
  const usersColumns: ColumnsType<UserRecord> = [
    {
      title: 'ФИО',
      dataIndex: 'full_name',
      key: 'full_name',
      width: 200,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 200,
    },
    {
      title: 'Роль',
      dataIndex: 'role',
      key: 'role',
      width: 150,
      render: (role: UserRole) => {
        const colors: Record<UserRole, string> = {
          'Руководитель': 'purple',
          'Администратор': 'red',
          'Старший группы': 'blue',
          'Инженер': 'green',
        };
        return <Tag color={colors[role]}>{role}</Tag>;
      },
    },
    {
      title: 'Статус',
      dataIndex: 'access_status',
      key: 'access_status',
      width: 120,
      render: (status: AccessStatus) => {
        const config = {
          pending: { color: 'orange', text: 'Ожидание' },
          approved: { color: 'green', text: 'Одобрен' },
          blocked: { color: 'red', text: 'Заблокирован' },
        };
        const { color, text } = config[status];
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: 'Доступные страницы',
      dataIndex: 'allowed_pages',
      key: 'allowed_pages',
      width: 150,
      render: (pages: string[]) => (
        <Text type="secondary">
          {pages.length === 0 ? 'Все' : `${pages.length} стр.`}
        </Text>
      ),
    },
    {
      title: 'Дата регистрации',
      dataIndex: 'registration_date',
      key: 'registration_date',
      width: 150,
      render: (date: string) => dayjs(date).format('DD.MM.YYYY'),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 180,
      fixed: 'right',
      render: (_: any, record: UserRecord) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
            disabled={record.id === currentUser?.id}
          >
            Изменить
          </Button>
          {record.access_status === 'approved' ? (
            <Popconfirm
              title="Заблокировать пользователя?"
              onConfirm={() => blockUser(record)}
              okText="Да"
              cancelText="Нет"
              okType="danger"
              disabled={record.id === currentUser?.id}
            >
              <Button
                danger
                type="text"
                size="small"
                icon={<StopOutlined />}
                disabled={record.id === currentUser?.id}
              >
                Заблокировать
              </Button>
            </Popconfirm>
          ) : record.access_status === 'blocked' ? (
            <Button
              type="text"
              size="small"
              icon={<UnlockOutlined />}
              onClick={() => unblockUser(record)}
              style={{ color: '#52c41a' }}
            >
              Разблокировать
            </Button>
          ) : null}
        </Space>
      ),
    },
  ];

  // Transfer data для выбора страниц
  const transferDataSource: TransferProps['dataSource'] = ALL_PAGES.map((page) => ({
    key: page,
    title: PAGE_LABELS[page] || page,
  }));

  useEffect(() => {
    if (hasAccess) {
      if (activeTab === 'pending') {
        loadPendingRequests();
      } else {
        loadUsers();
      }
    }
  }, [activeTab, hasAccess]);

  // Если нет доступа
  if (!hasAccess) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <UserOutlined style={{ fontSize: 48, color: '#ccc', marginBottom: 16 }} />
          <h3>Доступ запрещен</h3>
          <p style={{ color: '#666' }}>
            У вас нет прав для управления пользователями.
            <br />
            Эта функция доступна только администраторам и руководителям.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <UserOutlined style={{ fontSize: 24, color: '#10b981' }} />
            <span>Управление пользователями</span>
          </div>
        }
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane
            tab={
              <span>
                Запросы на регистрацию
                {pendingRequests.length > 0 && (
                  <Tag color="orange" style={{ marginLeft: 8 }}>
                    {pendingRequests.length}
                  </Tag>
                )}
              </span>
            }
            key="pending"
          >
            <Table
              dataSource={pendingRequests}
              columns={pendingColumns}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
              locale={{
                emptyText: 'Нет новых запросов на регистрацию',
              }}
            />
          </TabPane>

          <TabPane tab="Все пользователи" key="all">
            <Table
              dataSource={users}
              columns={usersColumns}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 1200 }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* Модальное окно редактирования */}
      <Modal
        title={`Редактирование пользователя: ${editingUser?.full_name}`}
        open={isEditModalVisible}
        onOk={handleSaveEdit}
        onCancel={() => {
          setIsEditModalVisible(false);
          setEditingUser(null);
          form.resetFields();
        }}
        okText="Сохранить"
        cancelText="Отмена"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="role"
            label="Роль"
            rules={[{ required: true, message: 'Выберите роль' }]}
          >
            <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
              {editingUser?.role}
            </Tag>
          </Form.Item>

          <Form.Item
            name="allowed_pages"
            label="Доступные страницы"
            tooltip="Пустой список = полный доступ (для Администратора и Руководителя)"
          >
            <Transfer
              dataSource={transferDataSource}
              titles={['Доступные', 'Выбранные']}
              targetKeys={form.getFieldValue('allowed_pages') || []}
              onChange={(targetKeys) => form.setFieldsValue({ allowed_pages: targetKeys })}
              render={(item) => item.title || ''}
              listStyle={{
                width: 250,
                height: 300,
              }}
              locale={{
                itemUnit: 'страница',
                itemsUnit: 'страниц',
                searchPlaceholder: 'Поиск...',
              }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Users;
