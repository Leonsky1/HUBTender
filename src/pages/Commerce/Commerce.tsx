/**
 * Страница "Коммерция" - отображение коммерческих стоимостей позиций заказчика
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Select,
  Button,
  Space,
  Typography,
  Statistic,
  Row,
  Col,
  message,
  Spin,
  Empty,
  Tooltip,
  Tag,
  Modal
} from 'antd';
import {
  ReloadOutlined,
  CalculatorOutlined,
  DollarOutlined,
  FileExcelOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { supabase } from '../../lib/supabase';
import type { Tender, ClientPosition } from '../../lib/supabase';
import { applyTacticToTender } from '../../services/markupTacticService';
import { formatCommercialCost } from '../../utils/markupCalculator';
import { checkCommercialData } from '../../utils/checkCommercialData';
import { initializeTestMarkup } from '../../utils/initializeTestMarkup';
import { debugCommercialCalculation } from '../../utils/debugCommercialCalculation';
import { checkDatabaseStructure } from '../../utils/checkDatabaseStructure';
import { verifyCoefficients } from '../../utils/verifyCoefficients';
import * as XLSX from 'xlsx';

const { Title, Text } = Typography;

interface PositionWithCommercialCost extends ClientPosition {
  commercial_total?: number;
  base_total?: number;
  markup_percentage?: number;
  items_count?: number;
}

interface MarkupTactic {
  id: string;
  name: string;
  is_global: boolean;
  created_at: string;
  sequences?: any;
  base_costs?: any;
}

export default function Commerce() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [selectedTenderId, setSelectedTenderId] = useState<string | undefined>();
  const [positions, setPositions] = useState<PositionWithCommercialCost[]>([]);
  const [markupTactics, setMarkupTactics] = useState<MarkupTactic[]>([]);
  const [selectedTacticId, setSelectedTacticId] = useState<string | undefined>();
  const [tacticChanged, setTacticChanged] = useState(false);

  // Загрузка списка тендеров и тактик
  useEffect(() => {
    loadTenders();
    loadMarkupTactics();
    // В dev режиме проверяем структуру БД при первой загрузке
    if (process.env.NODE_ENV === 'development') {
      checkDatabaseStructure();
    }
  }, []);

  // Загрузка позиций при выборе тендера
  useEffect(() => {
    if (selectedTenderId) {
      loadPositions(selectedTenderId);
      // Установить тактику из тендера
      const tender = tenders.find(t => t.id === selectedTenderId);
      if (tender?.markup_tactic_id) {
        setSelectedTacticId(tender.markup_tactic_id);
        setTacticChanged(false);
      } else {
        setSelectedTacticId(undefined);
      }
    } else {
      setPositions([]);
    }
  }, [selectedTenderId, tenders]);

  const loadTenders = async () => {
    try {
      const { data, error } = await supabase
        .from('tenders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTenders(data || []);

      // Если есть тендеры, выбираем первый
      if (data && data.length > 0) {
        setSelectedTenderId(data[0].id);
      }
    } catch (error) {
      console.error('Ошибка загрузки тендеров:', error);
      message.error('Не удалось загрузить список тендеров');
    }
  };

  const loadMarkupTactics = async () => {
    try {
      const { data, error } = await supabase
        .from('markup_tactics')
        .select('*')
        .order('is_global', { ascending: false })
        .order('name');

      if (error) throw error;
      setMarkupTactics(data || []);
    } catch (error) {
      console.error('Ошибка загрузки тактик наценок:', error);
      message.error('Не удалось загрузить список тактик');
    }
  };

  const loadPositions = async (tenderId: string) => {
    setLoading(true);

    // Диагностика данных (только в dev режиме)
    if (process.env.NODE_ENV === 'development') {
      checkCommercialData(tenderId);
    }

    try {
      // Загружаем позиции заказчика
      const { data: clientPositions, error: posError } = await supabase
        .from('client_positions')
        .select('*')
        .eq('tender_id', tenderId)
        .order('position_number');

      if (posError) throw posError;

      // Для каждой позиции загружаем коммерческие стоимости из boq_items
      const positionsWithCosts = await Promise.all((clientPositions || []).map(async (position) => {
        const { data: boqItems, error: itemsError } = await supabase
          .from('boq_items')
          .select('total_amount, total_commercial_material_cost, total_commercial_work_cost')
          .eq('client_position_id', position.id);

        if (itemsError) {
          console.error('Ошибка загрузки элементов позиции:', itemsError);
          return position;
        }

        // Суммируем стоимости
        let baseTotal = 0;
        let commercialTotal = 0;
        let itemsCount = 0;

        for (const item of boqItems || []) {
          const itemBase = item.total_amount || 0;
          const itemCommercial = (item.total_commercial_material_cost || 0) +
                                 (item.total_commercial_work_cost || 0);

          baseTotal += itemBase;
          commercialTotal += itemCommercial;
          itemsCount++;
        }

        // Рассчитываем процент наценки
        const markupPercentage = baseTotal > 0
          ? ((commercialTotal - baseTotal) / baseTotal) * 100
          : 0;

        return {
          ...position,
          base_total: baseTotal,
          commercial_total: commercialTotal,
          markup_percentage: markupPercentage,
          items_count: itemsCount
        } as PositionWithCommercialCost;
      }));

      setPositions(positionsWithCosts);
    } catch (error) {
      console.error('Ошибка загрузки позиций:', error);
      message.error('Не удалось загрузить позиции заказчика');
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    if (!selectedTenderId) {
      message.warning('Выберите тендер для пересчета');
      return;
    }

    setCalculating(true);
    try {
      const result = await applyTacticToTender(selectedTenderId);

      if (result.success) {
        message.success(`Пересчитано элементов: ${result.updatedCount}`);
        // Перезагружаем позиции после пересчета
        await loadPositions(selectedTenderId);
      } else {
        message.error('Ошибка при пересчете: ' + (result.errors?.join(', ') || 'Неизвестная ошибка'));
      }
    } catch (error) {
      console.error('Ошибка пересчета:', error);
      message.error('Не удалось выполнить пересчет');
    } finally {
      setCalculating(false);
    }
  };

  const handleInitializeTestData = async () => {
    if (!selectedTenderId) {
      message.warning('Выберите тендер для инициализации');
      return;
    }

    try {
      const tacticId = await initializeTestMarkup(selectedTenderId);
      if (tacticId) {
        message.success('Тестовые данные инициализированы');
        // Перезагружаем тендеры и позиции
        await loadTenders();
        await loadPositions(selectedTenderId);
      }
    } catch (error) {
      console.error('Ошибка инициализации:', error);
      message.error('Не удалось инициализировать тестовые данные');
    }
  };

  const handleTacticChange = (tacticId: string) => {
    setSelectedTacticId(tacticId);
    // Проверяем, изменилась ли тактика относительно сохраненной в тендере
    const tender = tenders.find(t => t.id === selectedTenderId);
    setTacticChanged(tacticId !== tender?.markup_tactic_id);
  };

  const handleApplyTactic = async () => {
    if (!selectedTenderId || !selectedTacticId) {
      message.warning('Выберите тендер и тактику');
      return;
    }

    Modal.confirm({
      title: 'Применить новую тактику?',
      content: (
        <div>
          <p>Это действие:</p>
          <ul>
            <li>Изменит тактику наценок для тендера</li>
            <li>Пересчитает все коммерческие стоимости</li>
            <li>Перезапишет существующие расчеты</li>
          </ul>
        </div>
      ),
      okText: 'Применить',
      cancelText: 'Отмена',
      onOk: async () => {
        setCalculating(true);
        try {
          // Обновляем тактику в тендере
          const { error: updateError } = await supabase
            .from('tenders')
            .update({ markup_tactic_id: selectedTacticId })
            .eq('id', selectedTenderId);

          if (updateError) throw updateError;

          // Пересчитываем с новой тактикой
          const result = await applyTacticToTender(selectedTenderId);

          if (result.success) {
            message.success('Тактика применена и выполнен пересчет');
            setTacticChanged(false);
            // Перезагружаем тендеры и позиции
            await loadTenders();
            await loadPositions(selectedTenderId);
          } else {
            message.error('Ошибка при пересчете: ' + (result.errors?.join(', ') || 'Неизвестная ошибка'));
          }
        } catch (error) {
          console.error('Ошибка применения тактики:', error);
          message.error('Не удалось применить тактику');
        } finally {
          setCalculating(false);
        }
      }
    });
  };

  const handleExportToExcel = () => {
    if (positions.length === 0) {
      message.warning('Нет данных для экспорта');
      return;
    }

    const selectedTender = tenders.find(t => t.id === selectedTenderId);

    // Подготавливаем данные для экспорта
    const exportData = positions.map(pos => ({
      'Номер позиции': pos.position_number,
      'Название': pos.work_name,
      'Примечание клиента': pos.client_note || '',
      'Единица': pos.unit_code || '',
      'Количество': pos.volume || 0,
      'Кол-во элементов': pos.items_count || 0,
      'Базовая стоимость': pos.base_total || 0,
      'Коммерческая стоимость': pos.commercial_total || 0,
      'Наценка, %': pos.markup_percentage?.toFixed(2) || '0',
      'За единицу (база)': pos.volume && pos.volume > 0 ? (pos.base_total || 0) / pos.volume : 0,
      'За единицу (коммерч.)': pos.volume && pos.volume > 0 ? (pos.commercial_total || 0) / pos.volume : 0,
    }));

    // Добавляем итоговую строку
    const totalBase = positions.reduce((sum, pos) => sum + (pos.base_total || 0), 0);
    const totalCommercial = positions.reduce((sum, pos) => sum + (pos.commercial_total || 0), 0);
    const avgMarkup = totalBase > 0 ? ((totalCommercial - totalBase) / totalBase) * 100 : 0;

    exportData.push({
      'Номер позиции': 0,
      'Название': 'ИТОГО',
      'Примечание клиента': '',
      'Единица': '',
      'Количество': positions.reduce((sum, pos) => sum + (pos.volume || 0), 0),
      'Кол-во элементов': positions.reduce((sum, pos) => sum + (pos.items_count || 0), 0),
      'Базовая стоимость': totalBase,
      'Коммерческая стоимость': totalCommercial,
      'Наценка, %': avgMarkup.toFixed(2),
      'За единицу (база)': 0,
      'За единицу (коммерч.)': 0,
    });

    // Создаем книгу Excel
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Коммерческие стоимости');

    // Устанавливаем ширину колонок
    ws['!cols'] = [
      { wch: 15 }, // Номер позиции
      { wch: 30 }, // Название
      { wch: 40 }, // Описание
      { wch: 10 }, // Единица
      { wch: 12 }, // Количество
      { wch: 15 }, // Кол-во элементов
      { wch: 18 }, // Базовая стоимость
      { wch: 20 }, // Коммерческая стоимость
      { wch: 12 }, // Наценка, %
      { wch: 18 }, // За единицу (база)
      { wch: 20 }, // За единицу (коммерч.)
    ];

    // Сохраняем файл
    const fileName = `Коммерция_${selectedTender?.tender_number || 'тендер'}_${new Date().toLocaleDateString('ru-RU')}.xlsx`;
    XLSX.writeFile(wb, fileName);

    message.success(`Данные экспортированы в файл ${fileName}`);
  };

  // Рассчитываем итоговые суммы
  const totals = useMemo(() => {
    const baseTotal = positions.reduce((sum, pos) => sum + (pos.base_total || 0), 0);
    const commercialTotal = positions.reduce((sum, pos) => sum + (pos.commercial_total || 0), 0);
    const difference = commercialTotal - baseTotal;
    const markupPercentage = baseTotal > 0 ? (difference / baseTotal) * 100 : 0;

    return {
      base: baseTotal,
      commercial: commercialTotal,
      difference,
      markupPercentage
    };
  }, [positions]);

  // Определение конечной позиции (листового узла) на основе иерархии
  const isLeafPosition = (record: PositionWithCommercialCost, index: number): boolean => {
    // Последняя строка всегда конечная
    if (index === positions.length - 1) {
      return true;
    }

    const currentLevel = record.hierarchy_level || 0;
    const nextLevel = positions[index + 1]?.hierarchy_level || 0;

    // Если текущий уровень >= следующего, значит это листовой узел
    return currentLevel >= nextLevel;
  };

  const columns: ColumnsType<PositionWithCommercialCost> = [
    {
      title: '№',
      dataIndex: 'position_number',
      key: 'position_number',
      width: 60,
      sorter: (a, b) => (a.position_number || 0) - (b.position_number || 0),
    },
    {
      title: 'Раздел / Наименование',
      key: 'work_name',
      ellipsis: true,
      render: (_, record, index) => {
        // Определяем, является ли позиция конечной (на основе иерархии)
        const isLeaf = isLeafPosition(record, index);
        const sectionColor = isLeaf ? '#52c41a' : '#ff7875'; // Зеленый для конечных, красноватый для разделов

        return (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              cursor: isLeaf ? 'pointer' : 'default',
            }}
            onClick={() => {
              if (isLeaf && selectedTenderId) {
                navigate(`/positions/${record.id}/items?tenderId=${selectedTenderId}&positionId=${record.id}`);
              }
            }}
          >
            {record.item_no && (
              <Text strong style={{ color: sectionColor, marginRight: 8, flexShrink: 0 }}>
                {record.item_no}
              </Text>
            )}
            <Text style={{ textDecoration: isLeaf ? 'underline' : 'none' }}>{record.work_name}</Text>
          </div>
        );
      },
    },
    {
      title: 'Кол-во',
      key: 'volume',
      width: 100,
      render: (_, record) => (
        <div>
          <div>{record.volume || 0} {record.unit_code || ''}</div>
          <div style={{ fontSize: '11px', color: '#999' }}>
            {record.items_count || 0} элем.
          </div>
        </div>
      ),
    },
    {
      title: 'Базовая стоимость',
      key: 'base_total',
      width: 150,
      align: 'right',
      render: (_, record) => (
        <Tooltip title="Сумма total_amount всех элементов позиции">
          <Text>{formatCommercialCost(record.base_total || 0)}</Text>
        </Tooltip>
      ),
      sorter: (a, b) => (a.base_total || 0) - (b.base_total || 0),
    },
    {
      title: 'Коммерческая стоимость',
      key: 'commercial_total',
      width: 180,
      align: 'right',
      render: (_, record) => (
        <Tooltip title="Сумма коммерческих стоимостей всех элементов">
          <Text strong style={{ color: '#52c41a' }}>
            {formatCommercialCost(record.commercial_total || 0)}
          </Text>
        </Tooltip>
      ),
      sorter: (a, b) => (a.commercial_total || 0) - (b.commercial_total || 0),
    },
    {
      title: 'Наценка',
      key: 'markup',
      width: 120,
      align: 'center',
      render: (_, record) => {
        const markup = record.markup_percentage || 0;
        const color = markup > 0 ? 'green' : markup < 0 ? 'red' : 'default';
        return (
          <Tag color={color}>
            {markup > 0 ? '+' : ''}{markup.toFixed(2)}%
          </Tag>
        );
      },
      sorter: (a, b) => (a.markup_percentage || 0) - (b.markup_percentage || 0),
    },
    {
      title: 'За единицу',
      key: 'per_unit',
      width: 150,
      align: 'right',
      responsive: ['xl'],
      render: (_, record) => {
        if (!record.volume || record.volume === 0) return '-';
        const perUnit = (record.commercial_total || 0) / record.volume;
        return (
          <Text type="secondary">
            {formatCommercialCost(perUnit)}
          </Text>
        );
      },
    },
    {
      title: 'Примечание',
      dataIndex: 'client_note',
      key: 'client_note',
      ellipsis: true,
      responsive: ['lg'],
    },
  ];

  const selectedTender = tenders.find(t => t.id === selectedTenderId);

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Заголовок и выбор тендера */}
          <Row gutter={[16, 16]} align="middle">
            <Col flex="auto">
              <Title level={3} style={{ margin: 0 }}>
                <DollarOutlined /> Коммерция
              </Title>
            </Col>
            <Col>
              <Space>
                <Select
                  style={{ width: 300 }}
                  placeholder="Выберите тендер"
                  value={selectedTenderId}
                  onChange={setSelectedTenderId}
                  loading={loading}
                  options={tenders.map(t => ({
                    label: `${t.tender_number} - ${t.title}`,
                    value: t.id
                  }))}
                />
                <Select
                  style={{ width: 250 }}
                  placeholder="Выберите тактику наценок"
                  value={selectedTacticId}
                  onChange={handleTacticChange}
                  loading={loading}
                  disabled={!selectedTenderId}
                  options={markupTactics.map(t => ({
                    label: (
                      <span>
                        {t.name || 'Без названия'}
                        {t.is_global && <Tag color="blue" style={{ marginLeft: 8 }}>Глобальная</Tag>}
                      </span>
                    ),
                    value: t.id
                  }))}
                />
                {tacticChanged && (
                  <Tooltip title="Применить новую тактику к тендеру">
                    <Button
                      type="primary"
                      danger
                      onClick={handleApplyTactic}
                      loading={calculating}
                    >
                      Применить тактику
                    </Button>
                  </Tooltip>
                )}
                <Tooltip title="Пересчитать коммерческие стоимости">
                  <Button
                    type="primary"
                    icon={<CalculatorOutlined />}
                    onClick={handleRecalculate}
                    loading={calculating}
                    disabled={!selectedTenderId}
                  >
                    Пересчитать
                  </Button>
                </Tooltip>
                <Tooltip title="Экспорт в Excel">
                  <Button
                    icon={<FileExcelOutlined />}
                    onClick={handleExportToExcel}
                    disabled={positions.length === 0}
                  >
                    Экспорт
                  </Button>
                </Tooltip>
                <Tooltip title="Обновить данные">
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={() => selectedTenderId && loadPositions(selectedTenderId)}
                    loading={loading}
                  />
                </Tooltip>
                {/* Кнопка инициализации только для dev режима */}
                {process.env.NODE_ENV === 'development' && (
                  <>
                    <Tooltip title="Создать тестовую тактику наценок">
                      <Button
                        onClick={handleInitializeTestData}
                        disabled={!selectedTenderId}
                        style={{ background: '#ff4d4f', color: 'white' }}
                      >
                        Тест
                      </Button>
                    </Tooltip>
                    <Tooltip title="Отладка расчета коммерческих стоимостей">
                      <Button
                        onClick={() => selectedTenderId && debugCommercialCalculation(selectedTenderId)}
                        disabled={!selectedTenderId}
                        style={{ background: '#faad14', color: 'white' }}
                      >
                        Debug
                      </Button>
                    </Tooltip>
                    <Tooltip title="Проверка коэффициентов наценок">
                      <Button
                        onClick={() => selectedTenderId && verifyCoefficients(selectedTenderId)}
                        disabled={!selectedTenderId}
                        style={{ background: '#52c41a', color: 'white' }}
                      >
                        Коэфф.
                      </Button>
                    </Tooltip>
                  </>
                )}
              </Space>
            </Col>
          </Row>

          {/* Информация о тендере */}
          {selectedTender && (
            <Card size="small">
              <Row gutter={[16, 8]}>
                <Col span={6}>
                  <Text type="secondary">Клиент:</Text> <Text strong>{selectedTender.client_name}</Text>
                </Col>
                <Col span={6}>
                  <Text type="secondary">Номер тендера:</Text> <Text strong>{selectedTender.tender_number}</Text>
                </Col>
                <Col span={6}>
                  <Text type="secondary">Версия:</Text> <Text strong>{selectedTender.version}</Text>
                </Col>
                <Col span={6}>
                  <Text type="secondary">Тактика наценок:</Text>{' '}
                  <Text strong>
                    {markupTactics.find(t => t.id === selectedTacticId)?.name || 'Не выбрана'}
                  </Text>
                  {tacticChanged && (
                    <Tag color="orange" style={{ marginLeft: 8 }}>Изменена</Tag>
                  )}
                </Col>
              </Row>
            </Card>
          )}

          {/* Статистика */}
          {selectedTenderId && positions.length > 0 && (
            <Row gutter={16}>
              <Col span={6}>
                <Card bordered={false}>
                  <Statistic
                    title="Базовая стоимость"
                    value={totals.base}
                    precision={2}
                    suffix="₽"
                    valueStyle={{ color: '#1677ff' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card bordered={false}>
                  <Statistic
                    title="Коммерческая стоимость"
                    value={totals.commercial}
                    precision={2}
                    suffix="₽"
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card bordered={false}>
                  <Statistic
                    title="Разница"
                    value={totals.difference}
                    precision={2}
                    suffix="₽"
                    valueStyle={{ color: totals.difference >= 0 ? '#52c41a' : '#ff4d4f' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card bordered={false}>
                  <Statistic
                    title="Средняя наценка"
                    value={totals.markupPercentage}
                    precision={2}
                    suffix="%"
                    prefix={totals.markupPercentage > 0 ? '+' : ''}
                    valueStyle={{ color: totals.markupPercentage >= 0 ? '#52c41a' : '#ff4d4f' }}
                  />
                </Card>
              </Col>
            </Row>
          )}

          {/* Таблица позиций */}
          {selectedTenderId ? (
            <Spin spinning={loading || calculating}>
              <Table
                columns={columns}
                dataSource={positions}
                rowKey="id"
                size="small"
                locale={{
                  emptyText: <Empty description="Нет позиций заказчика" />
                }}
                pagination={{
                  pageSize: 20,
                  showSizeChanger: true,
                  showTotal: (total, range) => `${range[0]}-${range[1]} из ${total} позиций`,
                }}
                summary={(pageData) => {
                  const pageBase = pageData.reduce((sum, pos) => sum + (pos.base_total || 0), 0);
                  const pageCommercial = pageData.reduce((sum, pos) => sum + (pos.commercial_total || 0), 0);

                  return (
                    <Table.Summary fixed>
                      <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={3}>
                          <Text strong>Итого на странице:</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1} align="right">
                          <Text strong>{formatCommercialCost(pageBase)}</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={2} align="right">
                          <Text strong style={{ color: '#52c41a' }}>
                            {formatCommercialCost(pageCommercial)}
                          </Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={3} colSpan={3} />
                      </Table.Summary.Row>
                    </Table.Summary>
                  );
                }}
              />
            </Spin>
          ) : (
            <Empty description="Выберите тендер для просмотра коммерческих стоимостей" />
          )}
        </Space>
      </Card>
    </div>
  );
}