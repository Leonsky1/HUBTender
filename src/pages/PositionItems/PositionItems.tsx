import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  message,
  InputNumber,
  Input,
  AutoComplete,
  Select,
  Popconfirm,
} from 'antd';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LinkOutlined,
  SaveOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import {
  supabase,
  type ClientPosition,
  type BoqItemFull,
  type BoqItemInsert,
  type WorkLibraryFull,
  type MaterialLibraryFull,
  type BoqItemType,
  type MaterialType,
  type CurrencyType,
  type DeliveryPriceType,
} from '../../lib/supabase';

const { Text, Title } = Typography;

const currencySymbols: Record<CurrencyType, string> = {
  RUB: '₽',
  USD: '$',
  EUR: '€',
  CNY: '¥',
};

interface AddItemForm {
  kind: 'work' | 'material';
  nameId: string;
  quantity: number;
  parentWorkId?: string;
  conversionCoeff?: number;
}

const PositionItems: React.FC = () => {
  const { positionId } = useParams<{ positionId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { theme } = useTheme();

  const [position, setPosition] = useState<ClientPosition | null>(null);
  const [items, setItems] = useState<BoqItemFull[]>([]);
  const [works, setWorks] = useState<WorkLibraryFull[]>([]);
  const [materials, setMaterials] = useState<MaterialLibraryFull[]>([]);
  const [loading, setLoading] = useState(false);

  const [addingWork, setAddingWork] = useState(false);
  const [addingMaterial, setAddingMaterial] = useState(false);
  const [selectedWorkNameId, setSelectedWorkNameId] = useState<string>('');
  const [selectedMaterialNameId, setSelectedMaterialNameId] = useState<string>('');
  const [workSearchText, setWorkSearchText] = useState<string>('');
  const [materialSearchText, setMaterialSearchText] = useState<string>('');

  useEffect(() => {
    if (positionId) {
      fetchPositionData();
      fetchItems();
      fetchWorks();
      fetchMaterials();
    }
  }, [positionId]);

  const fetchPositionData = async () => {
    try {
      const { data, error } = await supabase
        .from('client_positions')
        .select('*')
        .eq('id', positionId)
        .single();

      if (error) throw error;
      setPosition(data);
    } catch (error: any) {
      message.error('Ошибка загрузки позиции: ' + error.message);
    }
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('boq_items')
        .select(`
          *,
          material_names(name, unit),
          work_names(name, unit),
          parent_work:parent_work_item_id(work_names(name))
        `)
        .eq('client_position_id', positionId)
        .order('sort_number', { ascending: true });

      if (error) throw error;

      // Fetch unit rates from libraries
      const materialIds = (data || [])
        .filter(item => item.material_name_id)
        .map(item => item.material_name_id);

      const workIds = (data || [])
        .filter(item => item.work_name_id)
        .map(item => item.work_name_id);

      let materialRates: Record<string, number> = {};
      let workRates: Record<string, number> = {};

      if (materialIds.length > 0) {
        const { data: matData } = await supabase
          .from('materials_library')
          .select('material_name_id, unit_rate')
          .in('material_name_id', materialIds);

        materialRates = (matData || []).reduce((acc, item) => {
          acc[item.material_name_id] = item.unit_rate;
          return acc;
        }, {} as Record<string, number>);
      }

      if (workIds.length > 0) {
        const { data: workData } = await supabase
          .from('works_library')
          .select('work_name_id, unit_rate')
          .in('work_name_id', workIds);

        workRates = (workData || []).reduce((acc, item) => {
          acc[item.work_name_id] = item.unit_rate;
          return acc;
        }, {} as Record<string, number>);
      }

      const formattedItems: BoqItemFull[] = (data || []).map((item: any) => ({
        ...item,
        material_name: item.material_names?.name,
        material_unit: item.material_names?.unit,
        work_name: item.work_names?.name,
        work_unit: item.work_names?.unit,
        parent_work_name: item.parent_work?.work_names?.name,
        unit_rate: item.material_name_id
          ? materialRates[item.material_name_id]
          : workRates[item.work_name_id],
      }));

      setItems(formattedItems);
    } catch (error: any) {
      message.error('Ошибка загрузки элементов: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorks = async () => {
    try {
      const { data, error } = await supabase
        .from('works_library')
        .select('*, work_names(name, unit)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted: WorkLibraryFull[] = (data || []).map((item: any) => ({
        ...item,
        work_name: item.work_names?.name,
        unit: item.work_names?.unit,
      }));

      setWorks(formatted);
    } catch (error: any) {
      message.error('Ошибка загрузки работ: ' + error.message);
    }
  };

  const fetchMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('materials_library')
        .select('*, material_names(name, unit)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted: MaterialLibraryFull[] = (data || []).map((item: any) => ({
        ...item,
        material_name: item.material_names?.name,
        unit: item.material_names?.unit,
      }));

      setMaterials(formatted);
    } catch (error: any) {
      message.error('Ошибка загрузки материалов: ' + error.message);
    }
  };

  const handleAddWork = async () => {
    if (!selectedWorkNameId || !position) {
      message.error('Выберите работу');
      return;
    }

    try {
      const workLib = works.find(w => w.work_name_id === selectedWorkNameId);
      if (!workLib) throw new Error('Работа не найдена в библиотеке');

      const maxSort = Math.max(...items.map(i => i.sort_number || 0), 0);

      const newItem: BoqItemInsert = {
        tender_id: position.tender_id,
        client_position_id: position.id,
        sort_number: maxSort + 1,
        boq_item_type: workLib.item_type as BoqItemType,
        work_name_id: workLib.work_name_id,
        unit_code: workLib.unit,
        quantity: 1,
        currency_type: workLib.currency_type as CurrencyType,
      };

      const { error } = await supabase.from('boq_items').insert(newItem);

      if (error) throw error;

      message.success('Работа добавлена');
      setAddingWork(false);
      setSelectedWorkNameId('');
      setWorkSearchText('');
      fetchItems();
    } catch (error: any) {
      message.error('Ошибка добавления работы: ' + error.message);
    }
  };

  const handleAddMaterial = async () => {
    if (!selectedMaterialNameId || !position) {
      message.error('Выберите материал');
      return;
    }

    try {
      const matLib = materials.find(m => m.material_name_id === selectedMaterialNameId);
      if (!matLib) throw new Error('Материал не найден в библиотеке');

      const maxSort = Math.max(...items.map(i => i.sort_number || 0), 0);

      const newItem: BoqItemInsert = {
        tender_id: position.tender_id,
        client_position_id: position.id,
        sort_number: maxSort + 1,
        boq_item_type: matLib.item_type as BoqItemType,
        material_type: matLib.material_type as MaterialType,
        material_name_id: matLib.material_name_id,
        unit_code: matLib.unit,
        quantity: 1,
        consumption_coefficient: matLib.consumption_coefficient,
        currency_type: matLib.currency_type as CurrencyType,
        delivery_price_type: matLib.delivery_price_type as DeliveryPriceType,
        delivery_amount: matLib.delivery_amount,
      };

      const { error } = await supabase.from('boq_items').insert(newItem);

      if (error) throw error;

      message.success('Материал добавлен');
      setAddingMaterial(false);
      setSelectedMaterialNameId('');
      setMaterialSearchText('');
      fetchItems();
    } catch (error: any) {
      message.error('Ошибка добавления материала: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('boq_items').delete().eq('id', id);

      if (error) throw error;

      message.success('Элемент удален');
      fetchItems();
    } catch (error: any) {
      message.error('Ошибка удаления: ' + error.message);
    }
  };

  const getTypeColor = (type: BoqItemType): string => {
    const colors: Record<BoqItemType, string> = {
      'мат': 'orange',
      'суб-мат': 'purple',
      'мат-комп.': 'red',
      'раб': 'blue',
      'суб-раб': 'cyan',
      'раб-комп.': 'geekblue',
    };
    return colors[type] || 'default';
  };

  const getAvailableWorks = () => {
    return items.filter(
      item => item.boq_item_type === 'раб' ||
        item.boq_item_type === 'суб-раб' ||
        item.boq_item_type === 'раб-комп.'
    );
  };

  const getDeliveryText = (record: BoqItemFull): string => {
    if (!record.delivery_price_type) return '-';

    if (record.delivery_price_type === 'в цене') {
      return 'Включена';
    } else if (record.delivery_price_type === 'не в цене' && record.delivery_amount) {
      return `Не включена (${record.delivery_amount}%)`;
    } else if (record.delivery_price_type === 'суммой' && record.delivery_amount) {
      const symbol = currencySymbols[record.currency_type || 'RUB'];
      return `${record.delivery_amount.toLocaleString('ru-RU')} ${symbol}`;
    }
    return '-';
  };

  const calculateTotal = (record: BoqItemFull): number => {
    // This will be implemented later with proper price calculation logic
    return record.total_amount || 0;
  };

  const columns: ColumnsType<BoqItemFull> = [
    {
      title: <div style={{ textAlign: 'center' }}>Тип</div>,
      key: 'type',
      width: 90,
      align: 'center',
      render: (_, record) => (
        <Tag color={getTypeColor(record.boq_item_type)}>
          {record.boq_item_type}
        </Tag>
      ),
    },
    {
      title: <div style={{ textAlign: 'center' }}>Наименование</div>,
      key: 'name',
      width: 250,
      render: (_, record) => (
        <div style={{ paddingLeft: record.parent_work_item_id ? 24 : 0 }}>
          {record.parent_work_item_id && (
            <LinkOutlined style={{ marginRight: 8, color: '#888' }} />
          )}
          <Text>{record.work_name || record.material_name}</Text>
        </div>
      ),
    },
    {
      title: <div style={{ textAlign: 'center' }}>К перв</div>,
      dataIndex: 'conversion_coefficient',
      key: 'conversion',
      width: 80,
      align: 'center',
      render: (value) => value?.toFixed(3) || '-',
    },
    {
      title: <div style={{ textAlign: 'center' }}>К расх</div>,
      dataIndex: 'consumption_coefficient',
      key: 'consumption',
      width: 80,
      align: 'center',
      render: (value) => value?.toFixed(4) || '-',
    },
    {
      title: <div style={{ textAlign: 'center' }}>Кол-во</div>,
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'center',
      render: (value) => value?.toFixed(2) || '-',
    },
    {
      title: <div style={{ textAlign: 'center' }}>Ед.изм.</div>,
      dataIndex: 'unit_code',
      key: 'unit',
      width: 80,
      align: 'center',
    },
    {
      title: <div style={{ textAlign: 'center' }}>Цена</div>,
      key: 'price',
      width: 110,
      align: 'center',
      render: (_, record) => {
        const symbol = currencySymbols[record.currency_type || 'RUB'];
        return record.unit_rate
          ? `${record.unit_rate.toLocaleString('ru-RU')} ${symbol}`
          : '-';
      },
    },
    {
      title: <div style={{ textAlign: 'center' }}>Доставка</div>,
      key: 'delivery',
      width: 130,
      align: 'center',
      render: (_, record) => getDeliveryText(record),
    },
    {
      title: <div style={{ textAlign: 'center' }}>Сумма</div>,
      key: 'total',
      width: 110,
      align: 'center',
      render: (_, record) => {
        const total = calculateTotal(record);
        const symbol = currencySymbols[record.currency_type || 'RUB'];
        return total > 0
          ? `${total.toLocaleString('ru-RU')} ${symbol}`
          : '-';
      },
    },
    {
      title: <div style={{ textAlign: 'center' }}>Категория затрат</div>,
      key: 'cost_category',
      width: 180,
      align: 'center',
      render: (_, record) => record.detail_cost_category_full || '-',
    },
    {
      title: <div style={{ textAlign: 'center' }}>Ссылка на КП</div>,
      dataIndex: 'quote_link',
      key: 'quote_link',
      width: 120,
      align: 'center',
      render: (value) => value || '-',
    },
    {
      title: <div style={{ textAlign: 'center' }}>Примечание</div>,
      key: 'note',
      width: 150,
      align: 'center',
      render: () => '-',
    },
    {
      title: <div style={{ textAlign: 'center' }}>Действия</div>,
      key: 'actions',
      width: 80,
      align: 'center',
      render: (_, record) => (
        <Space>
          <Popconfirm
            title="Удалить элемент?"
            onConfirm={() => handleDelete(record.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Button type="text" danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (!position) {
    return <div>Загрузка...</div>;
  }

  return (
    <div style={{ padding: '0 8px' }}>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => {
                const tenderId = searchParams.get('tenderId');
                const positionId = searchParams.get('positionId');
                if (tenderId && positionId) {
                  navigate(`/positions?tenderId=${tenderId}&positionId=${positionId}`);
                } else {
                  navigate('/positions');
                }
              }}
            >
              Назад
            </Button>
            <div>
              <Title level={4} style={{ margin: 0 }}>
                {position.position_number}. {position.work_name}
              </Title>
              <Space style={{ marginTop: 8 }}>
                <Text type="secondary">
                  Кол-во заказчика: <Text strong>{position.volume?.toFixed(2) || '-'}</Text> {position.unit_code}
                </Text>
                <Text type="secondary">|</Text>
                <Text type="secondary">
                  Кол-во ГП: <Text strong>{position.manual_volume?.toFixed(2) || '-'}</Text> {position.unit_code}
                </Text>
              </Space>
            </div>
          </div>
        </div>
      </Card>

      <Card
        title="Элементы позиции"
        extra={
          !addingWork && !addingMaterial && (
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setAddingWork(true)}
              >
                Добавить работу
              </Button>
              <Button
                type="default"
                icon={<PlusOutlined />}
                onClick={() => setAddingMaterial(true)}
              >
                Добавить материал
              </Button>
            </Space>
          )
        }
      >
        {addingWork && (
          <Card
            title="Добавление работы"
            style={{ marginBottom: 16, background: theme === 'dark' ? '#1f1f1f' : '#fafafa' }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Space wrap>
                <AutoComplete
                  style={{ width: 400 }}
                  placeholder="Введите наименование работы..."
                  options={works.map(w => ({
                    value: w.work_name_id,
                    label: w.work_name,
                  }))}
                  value={workSearchText}
                  onSelect={(value, option: any) => {
                    setSelectedWorkNameId(value);
                    setWorkSearchText(option.label);
                  }}
                  onChange={(value) => {
                    setWorkSearchText(value);
                    if (!value) setSelectedWorkNameId('');
                  }}
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                />
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  disabled={!selectedWorkNameId}
                  onClick={handleAddWork}
                >
                  Добавить
                </Button>
                <Button
                  icon={<CloseOutlined />}
                  onClick={() => {
                    setAddingWork(false);
                    setSelectedWorkNameId('');
                    setWorkSearchText('');
                  }}
                >
                  Отмена
                </Button>
              </Space>
            </Space>
          </Card>
        )}

        {addingMaterial && (
          <Card
            title="Добавление материала"
            style={{ marginBottom: 16, background: theme === 'dark' ? '#1f1f1f' : '#fafafa' }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Space wrap>
                <AutoComplete
                  style={{ width: 400 }}
                  placeholder="Введите наименование материала..."
                  options={materials.map(m => ({
                    value: m.material_name_id,
                    label: m.material_name,
                  }))}
                  value={materialSearchText}
                  onSelect={(value, option: any) => {
                    setSelectedMaterialNameId(value);
                    setMaterialSearchText(option.label);
                  }}
                  onChange={(value) => {
                    setMaterialSearchText(value);
                    if (!value) setSelectedMaterialNameId('');
                  }}
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                />
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  disabled={!selectedMaterialNameId}
                  onClick={handleAddMaterial}
                >
                  Добавить
                </Button>
                <Button
                  icon={<CloseOutlined />}
                  onClick={() => {
                    setAddingMaterial(false);
                    setSelectedMaterialNameId('');
                    setMaterialSearchText('');
                  }}
                >
                  Отмена
                </Button>
              </Space>
            </Space>
          </Card>
        )}

        <Table
          columns={columns}
          dataSource={items}
          rowKey="id"
          loading={loading}
          pagination={false}
          scroll={{ y: 'calc(100vh - 500px)' }}
          size="small"
        />
      </Card>
    </div>
  );
};

export default PositionItems;
