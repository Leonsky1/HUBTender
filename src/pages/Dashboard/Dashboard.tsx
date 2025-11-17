import React, { useState, useEffect } from 'react';
import { Table, Typography, theme, Input, Tag, Button, Space, message, Card, Progress } from 'antd';
import {
  SearchOutlined,
  CheckCircleFilled,
  SyncOutlined,
  DashboardOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase, Tender } from '../../lib/supabase';
import { formatNumberWithSpaces } from '../../utils/numberFormat';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ru';
import './Dashboard.css';

dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.locale('ru');

const { Title, Text } = Typography;

interface TenderTableData {
  key: string;
  id: string;
  number: string;
  name: string;
  version: number;
  status_deadline: boolean;
  construction_area: number;
  boq_cost: number;
  cost_per_sqm: number;
  deadline: string;
  client: string;
  created_at: string;
}

const Dashboard: React.FC = () => {
  const { theme: currentTheme } = useTheme();
  const { token } = theme.useToken();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [tenders, setTenders] = useState<TenderTableData[]>([]);
  const [searchText, setSearchText] = useState('');
  const [filteredTenders, setFilteredTenders] = useState<TenderTableData[]>([]);

  // Загрузка тендеров из базы данных
  const fetchTenders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tenders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData: TenderTableData[] = (data || []).map((tender: Tender) => ({
        key: tender.id,
        id: tender.id,
        number: tender.tender_number || '',
        name: tender.title || '',
        version: tender.version || 1,
        status_deadline: tender.submission_deadline ?
          new Date(tender.submission_deadline) < new Date() : false,
        construction_area: tender.area_sp || 0,
        boq_cost: 0, // TODO: Это поле нужно будет рассчитать на основе BOQ позиций
        cost_per_sqm: 0, // TODO: Рассчитать после получения boq_cost
        deadline: tender.submission_deadline || '',
        client: tender.client_name || '',
        created_at: tender.created_at || '',
      }));

      setTenders(formattedData);
      setFilteredTenders(formattedData);
    } catch (error) {
      console.error('Ошибка загрузки тендеров:', error);
      message.error('Не удалось загрузить тендеры');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenders();
  }, []);

  // Фильтрация тендеров по поисковому запросу
  useEffect(() => {
    if (searchText) {
      const filtered = tenders.filter(tender =>
        tender.name.toLowerCase().includes(searchText.toLowerCase()) ||
        tender.number.toLowerCase().includes(searchText.toLowerCase()) ||
        tender.client.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredTenders(filtered);
    } else {
      setFilteredTenders(tenders);
    }
  }, [searchText, tenders]);

  // Обновление расчета для тендера
  const handleUpdateCalculation = async (tenderId: string) => {
    message.info('Обновление расчета для тендера ' + tenderId);
    // TODO: Реализовать логику обновления расчета
  };

  const columns = [
    {
      title: 'Номер тендера',
      dataIndex: 'number',
      key: 'number',
      width: 110,
      render: (text: string) => (
        <Text strong style={{ fontSize: 13 }}>{text || '-'}</Text>
      ),
    },
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (text: string, record: TenderTableData) => (
        <div>
          <Text strong style={{ fontSize: 13 }}>{text}</Text>
          {record.client && (
            <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
              {record.client}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: 'Версия',
      dataIndex: 'version',
      key: 'version',
      width: 60,
      align: 'center' as const,
      render: (version: number) => version || 1,
    },
    {
      title: 'Статус дедлайна',
      dataIndex: 'deadline',
      key: 'status_deadline',
      width: 180,
      render: (deadline: string, record: TenderTableData) => {
        if (!deadline) {
          return <Tag color="default">Дедлайн не указан</Tag>;
        }

        const now = dayjs();
        const deadlineDate = dayjs(deadline);
        const createdDate = dayjs(record.created_at);

        // Если дедлайн прошел
        if (deadlineDate.isBefore(now)) {
          return (
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Progress
                percent={100}
                status="success"
                strokeColor="#10b981"
                format={() => 'Завершен'}
                size="small"
              />
            </Space>
          );
        }

        // Рассчитываем общее время от создания до дедлайна
        const totalDuration = deadlineDate.diff(createdDate, 'millisecond');
        // Рассчитываем прошедшее время от создания до сейчас
        const elapsedDuration = now.diff(createdDate, 'millisecond');
        // Процент прогресса
        const progressPercent = Math.min(Math.round((elapsedDuration / totalDuration) * 100), 99);

        // Оставшееся время
        const remainingDuration = deadlineDate.diff(now);
        const remainingDays = Math.floor(remainingDuration / (1000 * 60 * 60 * 24));
        const remainingHours = Math.floor((remainingDuration % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        // Форматирование оставшегося времени
        let remainingText = '';
        if (remainingDays > 0) {
          remainingText = `${remainingDays} дн. ${remainingHours} ч.`;
        } else if (remainingHours > 0) {
          remainingText = `${remainingHours} ч.`;
        } else {
          const remainingMinutes = Math.floor(remainingDuration / (1000 * 60));
          remainingText = `${remainingMinutes} мин.`;
        }

        // Определяем цвет в зависимости от оставшегося времени
        let progressColor = '#10b981'; // Зеленый по умолчанию
        if (progressPercent > 90) {
          progressColor = '#ef4444'; // Красный
        } else if (progressPercent > 75) {
          progressColor = '#f97316'; // Оранжевый
        } else if (progressPercent > 50) {
          progressColor = '#eab308'; // Желтый
        }

        return (
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Progress
              percent={progressPercent}
              strokeColor={progressColor}
              format={() => (
                <Text style={{ fontSize: 11 }}>
                  <ClockCircleOutlined /> {remainingText}
                </Text>
              )}
              size="small"
            />
          </Space>
        );
      },
    },
    {
      title: 'Площадь СП',
      dataIndex: 'construction_area',
      key: 'construction_area',
      width: 100,
      align: 'right' as const,
      render: (value: number) => (
        <Text style={{ fontSize: 12 }}>{formatNumberWithSpaces(value)} м²</Text>
      ),
    },
    {
      title: 'BOQ стоимость',
      dataIndex: 'boq_cost',
      key: 'boq_cost',
      width: 120,
      align: 'right' as const,
      render: (value: number) => (
        <Text strong style={{ fontSize: 12 }}>{formatNumberWithSpaces(value)} ₽</Text>
      ),
    },
    {
      title: 'Стоимость за м²',
      dataIndex: 'cost_per_sqm',
      key: 'cost_per_sqm',
      width: 110,
      align: 'right' as const,
      render: (value: number) => (
        <Text style={{ fontSize: 12 }}>{formatNumberWithSpaces(Math.round(value))} ₽/м²</Text>
      ),
    },
    {
      title: 'Крайний срок',
      dataIndex: 'deadline',
      key: 'deadline',
      width: 95,
      render: (date: string) => (
        <Text style={{ fontSize: 12 }}>{date ? dayjs(date).format('DD.MM.YYYY') : '-'}</Text>
      ),
    },
    {
      title: 'Обновить расчет',
      key: 'action',
      width: 50,
      align: 'center' as const,
      render: (_: any, record: TenderTableData) => (
        <Button
          type="text"
          size="small"
          icon={<SyncOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            handleUpdateCalculation(record.id);
          }}
          style={{ color: token.colorPrimary }}
        />
      ),
    },
  ];

  return (
    <div className={`dashboard-container ${currentTheme}`} style={{ padding: '24px' }}>
      {/* Заголовок страницы */}
      <div style={{ marginBottom: 24 }}>
        <Space align="center">
          <DashboardOutlined style={{ fontSize: 24, color: token.colorPrimary }} />
          <Title level={2} style={{ margin: 0 }}>
            Дашборд тендеров
          </Title>
        </Space>
        <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
          Обзор активных тендеров и основные показатели
        </Text>
      </div>

      {/* Поиск */}
      <div style={{ marginBottom: 16 }}>
        <Input
          placeholder="Поиск по названию, номеру, заказчику..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{
            width: '100%',
            maxWidth: 500,
            backgroundColor: currentTheme === 'dark' ? '#141414' : '#fff',
          }}
        />
      </div>

      {/* Таблица тендеров */}
      <Card
        className="dashboard-table-card"
        style={{
          borderRadius: 8,
          boxShadow: currentTheme === 'dark' ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.12)',
        }}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          className="dashboard-table"
          columns={columns}
          dataSource={filteredTenders}
          loading={loading}
          pagination={false}
          size="small"
          onRow={(record) => ({
            onClick: () => {
              navigate(`/positions?tenderId=${record.id}`);
            },
            style: { cursor: 'pointer' },
          })}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
};

export default Dashboard;