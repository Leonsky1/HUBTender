import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Table, Button, Form, Input, Select, InputNumber, message, Popconfirm, Space, AutoComplete, Row, Col, theme, Tag, Tooltip } from 'antd';
import { DeleteOutlined, SaveOutlined, CloseOutlined, EditOutlined, CheckOutlined } from '@ant-design/icons';
import { supabase, WorkLibraryFull, WorkName, CurrencyType, UnitType, WorkItemType } from '../../lib/supabase';

interface WorksTabProps {
  searchText: string;
}

const WorksTab = forwardRef<any, WorksTabProps>((props, ref) => {
  const { searchText } = props;
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
  const [addItemType, setAddItemType] = useState<WorkItemType>('раб');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

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
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted = worksData?.map(item => ({
        ...item,
        work_name: item.work_names?.name || '',
        unit: item.work_names?.unit || 'шт'
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

  // Expose handleAdd method to parent
  useImperativeHandle(ref, () => ({
    handleAdd: () => {
      setIsAdding(true);
      setAddItemType('раб');
      addForm.setFieldsValue({
        item_type: 'раб',
        currency_type: 'RUB',
        unit_rate: 0,
      });
    }
  }));

  useEffect(() => {
    fetchWorks();
    fetchWorkNames();
  }, []);

  const isEditing = (record: WorkLibraryFull) => record.id === editingKey;

  const edit = (record: Partial<WorkLibraryFull>) => {
    // Set selected unit for display
    if (record.unit) {
      setSelectedUnit(record.unit as UnitType);
    }

    form.setFieldsValue({
      item_type: record.item_type,
      work_name_id: record.work_name,
      currency_type: record.currency_type || 'RUB',
      unit_rate: record.unit_rate,
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

      const updateData = {
        work_name_id: workName.id,
        item_type: row.item_type,
        unit_rate: row.unit_rate,
        currency_type: row.currency_type,
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

  const handleAddSubmit = async () => {
    try {
      const row = await addForm.validateFields();

      // Find the work name ID
      const workName = workNames.find(w => w.name === row.work_name_id);
      if (!workName) {
        message.error('Выберите работу из списка');
        return;
      }

      const insertData = {
        work_name_id: workName.id,
        item_type: row.item_type,
        unit_rate: row.unit_rate,
        currency_type: row.currency_type,
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
      title: '№',
      dataIndex: 'index',
      width: 25,
      editable: true,
      align: 'center' as const,
      render: (_: any, __: any, index: number) => (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: 'Вид работы',
      dataIndex: 'item_type',
      width: 110,
      editable: true,
      align: 'center' as const,
      render: (text: WorkItemType) => {
        let bgColor = '';
        let textColor = '';
        switch (text) {
          case 'раб':
            bgColor = 'rgba(239, 108, 0, 0.12)';
            textColor = '#f57c00';
            break;
          case 'суб-раб':
            bgColor = 'rgba(106, 27, 154, 0.12)';
            textColor = '#7b1fa2';
            break;
          case 'раб-комп.':
            bgColor = 'rgba(198, 40, 40, 0.12)';
            textColor = '#d32f2f';
            break;
        }
        return <Tag style={{ backgroundColor: bgColor, color: textColor, border: 'none' }}>{text}</Tag>;
      },
    },
    {
      title: 'Наименование работы',
      dataIndex: 'work_name',
      width: 325,
      editable: true,
      align: 'center' as const,
      render: (text: string) => <div style={{ textAlign: 'left' }}>{text}</div>,
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
      title: 'Цена за ед.',
      dataIndex: 'unit_rate',
      width: 100,
      editable: true,
      align: 'center' as const,
      render: (value: number) => value?.toFixed(2),
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
      title: 'Действия',
      dataIndex: 'operation',
      width: 100,
      editable: true,
      align: 'center' as const,
      render: (_: unknown, record: WorkLibraryFull) => {
        const editable = isEditing(record);
        return editable ? (
          <Space size="small">
            <Tooltip title="Сохранить">
              <Button
                type="text"
                icon={<SaveOutlined />}
                onClick={() => save(record.id)}
              />
            </Tooltip>
            <Tooltip title="Отмена">
              <Button
                type="text"
                icon={<CloseOutlined />}
                onClick={cancel}
              />
            </Tooltip>
          </Space>
        ) : (
          <Space size="small">
            <Tooltip title="Редактировать">
              <Button
                type="text"
                icon={<EditOutlined />}
                disabled={editingKey !== ''}
                onClick={() => edit(record)}
              />
            </Tooltip>
            <Tooltip title="Удалить">
              <Popconfirm
                title="Удалить?"
                onConfirm={() => handleDelete(record.id)}
                okText="Да"
                cancelText="Нет"
              >
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  disabled={editingKey !== ''}
                />
              </Popconfirm>
            </Tooltip>
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
    const currentItemType = Form.useWatch('item_type', form);

    // Get border color based on item_type for editing mode (all types)
    const getEditBorderColor = () => {
      if (!editing) return undefined;
      const itemType = currentItemType || record.item_type;
      switch (itemType) {
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
    if (dataIndex === 'index' || dataIndex === 'unit' || dataIndex === 'operation') {
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
              <Col span={3}>
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
              <Col span={13}>
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
                  label="Цена за ед."
                  name="unit_rate"
                  rules={[{ required: true, message: 'Обязательное поле' }]}
                >
                  <InputNumber min={0} step={0.01} precision={2} style={{ width: '100%' }} />
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
            </Row>
            <Row gutter={8}>
              <Col span={24} style={{ textAlign: 'right' }}>
                <Space size="small">
                  <Tooltip title="Добавить">
                    <Button type="primary" onClick={handleAddSubmit} icon={<CheckOutlined />} />
                  </Tooltip>
                  <Tooltip title="Отмена">
                    <Button onClick={cancelAdd} icon={<CloseOutlined />} />
                  </Tooltip>
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
          dataSource={filteredData}
          columns={mergedColumns}
          rowClassName={getRowClassName}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            pageSizeOptions: ['100', '250', '500', '1000'],
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} из ${total}`,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            },
          }}
          loading={loading}
          rowKey="id"
          scroll={{ y: 600 }}
          size="small"
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
});

export default WorksTab;
