import React, { useState, useEffect } from 'react';
import { Table, Button, Form, Input, Select, InputNumber, message, Popconfirm, Space, AutoComplete, Row, Col, theme } from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined, CloseOutlined, EditOutlined, SearchOutlined } from '@ant-design/icons';
import { supabase, WorkLibraryFull, WorkName, CurrencyType, UnitType, WorkItemType } from '../../lib/supabase';

interface DetailCostCategoryData {
  id: string;
  name: string;
  location: string;
  cost_category_id: string;
}

const WorksTab: React.FC = () => {
  const [form] = Form.useForm();
  const [addForm] = Form.useForm();
  const { token } = theme.useToken();
  const [data, setData] = useState<WorkLibraryFull[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingKey, setEditingKey] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [workNames, setWorkNames] = useState<WorkName[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<UnitType | null>(null);
  const [selectedAddUnit, setSelectedAddUnit] = useState<UnitType | null>(null);
  const [detailCostCategories, setDetailCostCategories] = useState<DetailCostCategoryData[]>([]);
  const [costCategoryOptions, setCostCategoryOptions] = useState<{ value: string; label: string; id: string }[]>([]);
  const [addItemType, setAddItemType] = useState<WorkItemType>('раб');
  const [searchText, setSearchText] = useState('');

  // Fetch works library data
  const fetchWorks = async () => {
    setLoading(true);
    try {
      const { data: worksData, error } = await supabase
        .from('works_library')
        .select(`
          *,
          work_names (
            id,
            name,
            unit
          ),
          detail_cost_categories (
            id,
            name,
            location,
            cost_categories (
              id,
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted = worksData?.map(item => ({
        ...item,
        work_name: item.work_names?.name || '',
        unit: item.work_names?.unit || 'шт',
        detail_cost_category_name: item.detail_cost_categories?.name,
        detail_cost_category_location: item.detail_cost_categories?.location,
        cost_category_name: item.detail_cost_categories?.cost_categories?.name
      })) as WorkLibraryFull[];

      setData(formatted || []);
    } catch (error) {
      console.error('Error fetching works:', error);
      message.error('Ошибка загрузки работ');
    } finally {
      setLoading(false);
    }
  };

  // Fetch work names for autocomplete
  const fetchWorkNames = async () => {
    try {
      const { data: namesData, error } = await supabase
        .from('work_names')
        .select('*')
        .order('name');

      if (error) throw error;
      setWorkNames(namesData || []);
    } catch (error) {
      console.error('Error fetching work names:', error);
    }
  };

  // Fetch cost categories for autocomplete
  const fetchCostCategories = async () => {
    try {
      const { data: categoriesData, error: catError } = await supabase
        .from('cost_categories')
        .select('id, name');

      const { data: detailsData, error: detailError } = await supabase
        .from('detail_cost_categories')
        .select('id, name, location, cost_category_id');

      if (catError || detailError) throw catError || detailError;

      // Store all details
      setDetailCostCategories(detailsData || []);

      // Build autocomplete options: "Категория / Затрата / Локализация"
      const options = detailsData?.map(detail => {
        const category = categoriesData?.find(cat => cat.id === detail.cost_category_id);
        return {
          id: detail.id,
          value: `${category?.name || ''} / ${detail.name} / ${detail.location}`,
          label: `${category?.name || ''} / ${detail.name} / ${detail.location}`
        };
      }) || [];

      setCostCategoryOptions(options);
    } catch (error) {
      console.error('Error fetching cost categories:', error);
    }
  };

  useEffect(() => {
    fetchWorks();
    fetchWorkNames();
    fetchCostCategories();
  }, []);

  const isEditing = (record: WorkLibraryFull) => record.id === editingKey;

  const edit = (record: Partial<WorkLibraryFull>) => {
    // Set selected unit for display
    if (record.unit) {
      setSelectedUnit(record.unit as UnitType);
    }

    // Find the detail cost category label for autocomplete
    let costCategoryLabel: string | undefined;
    if (record.detail_cost_category_id) {
      const option = costCategoryOptions.find(opt => opt.id === record.detail_cost_category_id);
      costCategoryLabel = option?.value;
    }

    form.setFieldsValue({
      item_type: record.item_type,
      work_name_id: record.work_name,
      currency_type: record.currency_type || 'RUB',
      unit_rate: record.unit_rate,
      detail_cost_category_search: costCategoryLabel,
    });
    setEditingKey(record.id || '');
  };

  const cancel = () => {
    setEditingKey('');
    setSelectedUnit(null);
  };

  const cancelAdd = () => {
    setIsAdding(false);
    setSelectedAddUnit(null);
    addForm.resetFields();
  };

  const save = async (id: string) => {
    try {
      const row = await form.validateFields();

      // Find the work name ID
      const workName = workNames.find(w => w.name === row.work_name_id);
      if (!workName) {
        message.error('Выберите работу из списка');
        return;
      }

      // Find detail_cost_category_id by search string
      let detailCategoryId: string | null = null;
      if (row.detail_cost_category_search) {
        const option = costCategoryOptions.find(opt => opt.value === row.detail_cost_category_search);
        detailCategoryId = option?.id || null;
      }

      const updateData = {
        work_name_id: workName.id,
        item_type: row.item_type,
        unit_rate: row.unit_rate,
        currency_type: row.currency_type,
        detail_cost_category_id: detailCategoryId || null,
      };

      // Update existing record
      const { error } = await supabase
        .from('works_library')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      message.success('Работа обновлена');

      await fetchWorks();
      setEditingKey('');
      setSelectedUnit(null);
    } catch (error) {
      console.error('Error saving work:', error);
      message.error('Ошибка при сохранении');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('works_library')
        .delete()
        .eq('id', id);

      if (error) throw error;

      message.success('Работа удалена');
      await fetchWorks();
    } catch (error) {
      console.error('Error deleting work:', error);
      message.error('Ошибка при удалении');
    }
  };

  const handleAdd = () => {
    setIsAdding(true);
    setAddItemType('раб');
    addForm.setFieldsValue({
      item_type: 'раб',
      currency_type: 'RUB',
      unit_rate: 0,
    });
  };

  const handleAddSubmit = async () => {
    try {
      const row = await addForm.validateFields();

      // Find the work name ID
      const workName = workNames.find(w => w.name === row.work_name_id);
      if (!workName) {
        message.error('Выберите работу из списка');
        return;
      }

      // Find detail_cost_category_id by search string
      let detailCategoryId: string | null = null;
      if (row.detail_cost_category_search) {
        const option = costCategoryOptions.find(opt => opt.value === row.detail_cost_category_search);
        detailCategoryId = option?.id || null;
      }

      const insertData = {
        work_name_id: workName.id,
        item_type: row.item_type,
        unit_rate: row.unit_rate,
        currency_type: row.currency_type,
        detail_cost_category_id: detailCategoryId || null,
      };

      const { error } = await supabase
        .from('works_library')
        .insert([insertData]);

      if (error) throw error;

      message.success('Работа добавлена');
      await fetchWorks();
      cancelAdd();
    } catch (error) {
      console.error('Error adding work:', error);
      message.error('Ошибка при добавлении');
    }
  };

  const handleWorkNameSelect = (value: string) => {
    const selected = workNames.find(w => w.name === value);
    if (selected) {
      setSelectedUnit(selected.unit);
    }
  };

  const handleAddWorkNameSelect = (value: string) => {
    const selected = workNames.find(w => w.name === value);
    if (selected) {
      setSelectedAddUnit(selected.unit);
    }
  };

  const currencySymbols: Record<CurrencyType, string> = {
    RUB: '₽',
    USD: '$',
    EUR: '€',
    CNY: '¥'
  };

  // Row color coding by item_type
  const getRowClassName = (record: WorkLibraryFull) => {
    if (isEditing(record)) return 'editable-row';
    switch (record.item_type) {
      case 'раб':
        return 'work-row-rab';
      case 'суб-раб':
        return 'work-row-sub-rab';
      case 'раб-комп.':
        return 'work-row-rab-comp';
      default:
        return '';
    }
  };

  const columns = [
    {
      title: 'Вид работы',
      dataIndex: 'item_type',
      width: 110,
      editable: true,
      align: 'center' as const,
      render: (text: WorkItemType) => text,
    },
    {
      title: 'Наименование работы',
      dataIndex: 'work_name',
      editable: true,
      align: 'center' as const,
    },
    {
      title: 'Ед.изм',
      dataIndex: 'unit',
      width: 80,
      editable: true,
      align: 'center' as const,
      render: (text: UnitType, record: WorkLibraryFull) => {
        if (isEditing(record)) {
          return selectedUnit || text || '-';
        }
        return text;
      },
    },
    {
      title: 'Валюта',
      dataIndex: 'currency_type',
      width: 80,
      editable: true,
      align: 'center' as const,
      render: (value: CurrencyType) => currencySymbols[value] || value,
    },
    {
      title: 'Цена за ед.',
      dataIndex: 'unit_rate',
      width: 100,
      editable: true,
      align: 'center' as const,
      render: (value: number) => value?.toFixed(2),
    },
    {
      title: 'Затрата на строительство',
      dataIndex: 'detail_cost_category_name',
      editable: true,
      align: 'center' as const,
      render: (_: string, record: WorkLibraryFull) => {
        if (record.cost_category_name && record.detail_cost_category_name && record.detail_cost_category_location) {
          return `${record.cost_category_name} / ${record.detail_cost_category_name} / ${record.detail_cost_category_location}`;
        }
        return '-';
      },
    },
    {
      title: 'Действия',
      dataIndex: 'operation',
      width: 100,
      editable: true,
      align: 'center' as const,
      render: (_: unknown, record: WorkLibraryFull) => {
        const editable = isEditing(record);
        return editable ? (
          <Space direction="vertical" size={0}>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={() => save(record.id)}
              size="small"
              style={{ fontSize: '14px' }}
            />
            <Button
              icon={<CloseOutlined />}
              onClick={cancel}
              size="small"
              style={{ fontSize: '14px' }}
            />
          </Space>
        ) : (
          <Space direction="vertical" size={0}>
            <Button
              type="default"
              icon={<EditOutlined />}
              disabled={editingKey !== ''}
              onClick={() => edit(record)}
              size="small"
              style={{ fontSize: '14px' }}
            />
            <Popconfirm
              title="Удалить?"
              onConfirm={() => handleDelete(record.id)}
              okText="Да"
              cancelText="Нет"
            >
              <Button
                type="primary"
                icon={<DeleteOutlined />}
                danger
                disabled={editingKey !== ''}
                size="small"
                style={{ fontSize: '14px' }}
              />
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  const mergedColumns = columns.map((col) => {
    if (!col.editable) {
      return col;
    }

    return {
      ...col,
      onCell: (record: WorkLibraryFull) => ({
        record,
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
      }),
    };
  });

  const EditableCell: React.FC<{
    editing: boolean;
    dataIndex: string;
    title: string;
    record: WorkLibraryFull;
    children: React.ReactNode;
  }> = ({ editing, dataIndex, children, record }) => {
    // Get border color based on item_type for editing mode (all types)
    const getEditBorderColor = () => {
      if (!editing) return undefined;
      switch (record.item_type) {
        case 'раб':
          return '#ff9800'; // Оранжевый
        case 'суб-раб':
          return '#9c27b0'; // Фиолетовый
        case 'раб-комп.':
          return '#f44336'; // Красный
        default:
          return undefined;
      }
    };

    const borderColor = getEditBorderColor();
    const cellStyle: React.CSSProperties = {
      textAlign: 'center',
      whiteSpace: 'normal',
      wordWrap: 'break-word',
      wordBreak: 'break-word',
      ...(borderColor && {
        borderTop: `2px solid ${borderColor}`,
        borderBottom: `2px solid ${borderColor}`,
      }),
    };

    if (!editing) {
      return <td style={cellStyle}>{children}</td>;
    }

    // For non-editable columns in edit mode, just show content with border
    if (dataIndex === 'unit' || dataIndex === 'operation') {
      return <td style={cellStyle}>{children}</td>;
    }

    let inputNode: React.ReactNode;

    switch (dataIndex) {
      case 'item_type':
        inputNode = (
          <Form.Item
            name={dataIndex}
            style={{ margin: 0 }}
            rules={[{ required: true, message: 'Обязательное поле' }]}
          >
            <Select style={{ width: '100%', minWidth: '110px' }}>
              <Select.Option value="раб">раб</Select.Option>
              <Select.Option value="суб-раб">суб-раб</Select.Option>
              <Select.Option value="раб-комп.">раб-комп.</Select.Option>
            </Select>
          </Form.Item>
        );
        break;

      case 'work_name':
        inputNode = (
          <Form.Item
            name="work_name_id"
            style={{ margin: 0 }}
            rules={[{ required: true, message: 'Обязательное поле' }]}
          >
            <AutoComplete
              options={workNames.map(w => ({ value: w.name }))}
              onSelect={handleWorkNameSelect}
              filterOption={(inputValue, option) =>
                option!.value.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1
              }
              placeholder="Начните вводить название..."
            />
          </Form.Item>
        );
        break;

      case 'currency_type':
        inputNode = (
          <Form.Item
            name={dataIndex}
            style={{ margin: 0 }}
            rules={[{ required: true, message: 'Обязательное поле' }]}
          >
            <Select>
              <Select.Option value="RUB">₽ RUB</Select.Option>
              <Select.Option value="USD">$ USD</Select.Option>
              <Select.Option value="EUR">€ EUR</Select.Option>
              <Select.Option value="CNY">¥ CNY</Select.Option>
            </Select>
          </Form.Item>
        );
        break;

      case 'unit_rate':
        inputNode = (
          <Form.Item
            name={dataIndex}
            style={{ margin: 0 }}
            rules={[{ required: true, message: 'Обязательное поле' }]}
          >
            <InputNumber
              min={0}
              step={0.01}
              precision={2}
              style={{ width: '100%' }}
            />
          </Form.Item>
        );
        break;

      case 'detail_cost_category_name':
        inputNode = (
          <Form.Item
            name="detail_cost_category_search"
            style={{ margin: 0 }}
          >
            <AutoComplete
              options={costCategoryOptions}
              placeholder="Начните вводить затрату..."
              filterOption={(inputValue, option) =>
                option!.value.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1
              }
            />
          </Form.Item>
        );
        break;

      default:
        inputNode = (
          <Form.Item name={dataIndex} style={{ margin: 0 }}>
            <Input style={{ textAlign: 'center' }} />
          </Form.Item>
        );
    }

    return <td style={cellStyle}>{inputNode}</td>;
  };

  // Get border color for add form based on item type
  const getAddFormBorderColor = () => {
    switch (addItemType) {
      case 'раб':
        return '#ff9800'; // Оранжевый
      case 'суб-раб':
        return '#9c27b0'; // Фиолетовый
      case 'раб-комп.':
        return '#f44336'; // Красный
      default:
        return 'transparent';
    }
  };

  // Filter data by search text
  const filteredData = data.filter(item =>
    item.work_name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div>
      {/* Search and Actions Bar */}
      <div style={{ marginBottom: 16, display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
        <Input
          placeholder="Поиск работ по наименованию..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ maxWidth: 400 }}
          allowClear
        />
        <Button
          type="primary"
          onClick={handleAdd}
          icon={<PlusOutlined />}
          disabled={editingKey !== ''}
        >
          Добавить работу
        </Button>
      </div>

      {/* Add Form Section */}
      {isAdding && (
        <div
          style={{
            marginBottom: 16,
            padding: '16px',
            border: `2px solid ${getAddFormBorderColor()}`,
            borderRadius: '6px',
            backgroundColor: token.colorBgContainer,
          }}
        >
          <Form
            form={addForm}
            layout="vertical"
            initialValues={{
              item_type: 'раб',
              currency_type: 'RUB',
              unit_rate: 0,
            }}
          >
            <Row gutter={8}>
              <Col span={4}>
                <Form.Item
                  label="Вид работы"
                  name="item_type"
                  rules={[{ required: true, message: 'Обязательное поле' }]}
                >
                  <Select onChange={(value) => setAddItemType(value as WorkItemType)}>
                    <Select.Option value="раб">раб</Select.Option>
                    <Select.Option value="суб-раб">суб-раб</Select.Option>
                    <Select.Option value="раб-комп.">раб-комп.</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Наименование работы"
                  name="work_name_id"
                  rules={[{ required: true, message: 'Обязательное поле' }]}
                >
                  <AutoComplete
                    options={workNames.map(w => ({ value: w.name }))}
                    onSelect={handleAddWorkNameSelect}
                    filterOption={(inputValue, option) =>
                      option!.value.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1
                    }
                    placeholder="Начните вводить..."
                  />
                </Form.Item>
              </Col>
              <Col span={2}>
                <Form.Item label="Ед.изм">
                  <Input value={selectedAddUnit || '-'} disabled style={{ textAlign: 'center' }} />
                </Form.Item>
              </Col>
              <Col span={3}>
                <Form.Item
                  label="Валюта"
                  name="currency_type"
                  rules={[{ required: true, message: 'Обязательное поле' }]}
                >
                  <Select>
                    <Select.Option value="RUB">₽</Select.Option>
                    <Select.Option value="USD">$</Select.Option>
                    <Select.Option value="EUR">€</Select.Option>
                    <Select.Option value="CNY">¥</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={3}>
                <Form.Item
                  label="Цена"
                  name="unit_rate"
                  rules={[{ required: true, message: 'Обязательное поле' }]}
                >
                  <InputNumber min={0} step={0.01} precision={2} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={8}>
              <Col span={24}>
                <Form.Item
                  label="Затрата на строительство"
                  name="detail_cost_category_search"
                  rules={[{ required: true, message: 'Обязательное поле' }]}
                >
                  <AutoComplete
                    options={costCategoryOptions}
                    placeholder="Начните вводить затрату..."
                    filterOption={(inputValue, option) =>
                      option!.value.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1
                    }
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={24} style={{ textAlign: 'right' }}>
                <Space>
                  <Button onClick={cancelAdd} icon={<CloseOutlined />}>
                    Отмена
                  </Button>
                  <Button type="primary" onClick={handleAddSubmit} icon={<SaveOutlined />}>
                    Сохранить
                  </Button>
                </Space>
              </Col>
            </Row>
          </Form>
        </div>
      )}

      {/* Table Section */}
      <Form form={form} component={false}>
        <Table
          components={{
            body: {
              cell: EditableCell,
            },
          }}
          bordered
          dataSource={filteredData}
          columns={mergedColumns}
          rowClassName={getRowClassName}
          pagination={false}
          loading={loading}
          rowKey="id"
        />
      </Form>

      {/* CSS for row colors */}
      <style>{`
        .work-row-rab {
          background-color: rgba(255, 152, 0, 0.15) !important;
        }
        .work-row-rab:hover > td {
          background-color: rgba(255, 152, 0, 0.25) !important;
        }
        .work-row-sub-rab {
          background-color: rgba(156, 39, 176, 0.15) !important;
        }
        .work-row-sub-rab:hover > td {
          background-color: rgba(156, 39, 176, 0.25) !important;
        }
        .work-row-rab-comp {
          background-color: rgba(244, 67, 54, 0.15) !important;
        }
        .work-row-rab-comp:hover > td {
          background-color: rgba(244, 67, 54, 0.25) !important;
        }
      `}</style>
    </div>
  );
};

export default WorksTab;
