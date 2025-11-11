import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Table, Button, Form, Input, Select, InputNumber, message, Popconfirm, Space, AutoComplete, Row, Col, theme, Tag, Tooltip } from 'antd';
import { DeleteOutlined, SaveOutlined, CloseOutlined, EditOutlined, CheckOutlined } from '@ant-design/icons';
import { supabase, MaterialLibraryFull, MaterialName, MaterialType, ItemType, CurrencyType, DeliveryPriceType, UnitType } from '../../lib/supabase';

interface MaterialsTabProps {
  searchText: string;
}

const MaterialsTab = forwardRef<any, MaterialsTabProps>((props, ref) => {
  const { searchText } = props;
  const [form] = Form.useForm();
  const [addForm] = Form.useForm();
  const { token } = theme.useToken();
  const [data, setData] = useState<MaterialLibraryFull[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingKey, setEditingKey] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [materialNames, setMaterialNames] = useState<MaterialName[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<UnitType | null>(null);
  const [selectedAddUnit, setSelectedAddUnit] = useState<UnitType | null>(null);
  const [addDeliveryType, setAddDeliveryType] = useState<DeliveryPriceType>('в цене');
  const [addItemType, setAddItemType] = useState<ItemType>('мат');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  // Fetch materials library data
  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const { data: materialsData, error } = await supabase
        .from('materials_library')
        .select(`
          *,
          material_names (
            id,
            name,
            unit
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted = materialsData?.map(item => ({
        ...item,
        material_name: item.material_names?.name || '',
        unit: item.material_names?.unit || 'шт'
      })) as MaterialLibraryFull[];

      setData(formatted || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
      message.error('Ошибка загрузки материалов');
    } finally {
      setLoading(false);
    }
  };

  // Fetch material names for autocomplete
  const fetchMaterialNames = async () => {
    try {
      const { data: namesData, error } = await supabase
        .from('material_names')
        .select('*')
        .order('name');

      if (error) throw error;
      setMaterialNames(namesData || []);
    } catch (error) {
      console.error('Error fetching material names:', error);
    }
  };

  useEffect(() => {
    fetchMaterials();
    fetchMaterialNames();
  }, []);

  // Expose handleAdd method to parent
  useImperativeHandle(ref, () => ({
    handleAdd: () => {
      setIsAdding(true);
      setAddItemType('мат');
      addForm.setFieldsValue({
        material_type: 'основн.',
        item_type: 'мат',
        consumption_coefficient: 1.0,
        currency_type: 'RUB',
        delivery_price_type: 'в цене',
        delivery_amount: 0,
      });
    }
  }));

  const isEditing = (record: MaterialLibraryFull) => record.id === editingKey;

  const edit = (record: Partial<MaterialLibraryFull>) => {
    // Set selected unit for display
    if (record.unit) {
      setSelectedUnit(record.unit as UnitType);
    }

    form.setFieldsValue({
      material_type: record.material_type,
      item_type: record.item_type,
      material_name_id: record.material_name,
      consumption_coefficient: record.consumption_coefficient || 1.0,
      currency_type: record.currency_type || 'RUB',
      unit_rate: record.unit_rate,
      delivery_price_type: record.delivery_price_type || 'в цене',
      delivery_amount: record.delivery_amount || 0,
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

      // Find the material name ID
      const materialName = materialNames.find(m => m.name === row.material_name_id);
      if (!materialName) {
        message.error('Выберите материал из списка');
        return;
      }

      const updateData = {
        material_type: row.material_type,
        item_type: row.item_type,
        material_name_id: materialName.id,
        consumption_coefficient: row.consumption_coefficient,
        unit_rate: row.unit_rate,
        currency_type: row.currency_type,
        delivery_price_type: row.delivery_price_type,
        delivery_amount: row.delivery_price_type === 'суммой' ? row.delivery_amount : 0,
      };

      // Update existing record
      const { error } = await supabase
        .from('materials_library')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      message.success('Материал обновлен');

      await fetchMaterials();
      setEditingKey('');
      setSelectedUnit(null);
    } catch (error) {
      console.error('Error saving material:', error);
      message.error('Ошибка при сохранении');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('materials_library')
        .delete()
        .eq('id', id);

      if (error) throw error;

      message.success('Материал удален');
      await fetchMaterials();
    } catch (error) {
      console.error('Error deleting material:', error);
      message.error('Ошибка при удалении');
    }
  };

  const handleAddSubmit = async () => {
    try {
      const row = await addForm.validateFields();

      // Find the material name ID
      const materialName = materialNames.find(m => m.name === row.material_name_id);
      if (!materialName) {
        message.error('Выберите материал из списка');
        return;
      }

      const insertData = {
        material_type: row.material_type,
        item_type: row.item_type,
        material_name_id: materialName.id,
        consumption_coefficient: row.consumption_coefficient,
        unit_rate: row.unit_rate,
        currency_type: row.currency_type,
        delivery_price_type: row.delivery_price_type,
        delivery_amount: row.delivery_price_type === 'суммой' ? row.delivery_amount : 0,
      };

      const { error } = await supabase
        .from('materials_library')
        .insert([insertData]);

      if (error) throw error;

      message.success('Материал добавлен');
      await fetchMaterials();
      cancelAdd();
    } catch (error) {
      console.error('Error adding material:', error);
      message.error('Ошибка при добавлении');
    }
  };

  const handleMaterialNameSelect = (value: string) => {
    const selected = materialNames.find(m => m.name === value);
    if (selected) {
      setSelectedUnit(selected.unit);
    }
  };

  const handleAddMaterialNameSelect = (value: string) => {
    const selected = materialNames.find(m => m.name === value);
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
  const getRowClassName = (record: MaterialLibraryFull) => {
    if (isEditing(record)) return 'editable-row';
    switch (record.item_type) {
      case 'мат':
        return 'material-row-mat';
      case 'суб-мат':
        return 'material-row-sub-mat';
      case 'мат-комп.':
        return 'material-row-mat-comp';
      default:
        return '';
    }
  };

  const columns = [
    {
      title: '№',
      dataIndex: 'index',
      width: 50,
      editable: true,
      align: 'center' as const,
      render: (_: any, __: any, index: number) => (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: 'Вид материала',
      dataIndex: 'item_type',
      width: 110,
      editable: true,
      align: 'center' as const,
      render: (text: ItemType) => {
        let bgColor = '';
        let textColor = '';
        switch (text) {
          case 'мат':
            bgColor = 'rgba(21, 101, 192, 0.12)';
            textColor = '#1976d2';
            break;
          case 'суб-мат':
            bgColor = 'rgba(104, 159, 56, 0.12)';
            textColor = '#7cb342';
            break;
          case 'мат-комп.':
            bgColor = 'rgba(0, 105, 92, 0.12)';
            textColor = '#00897b';
            break;
        }
        return <Tag style={{ backgroundColor: bgColor, color: textColor, border: 'none' }}>{text}</Tag>;
      },
    },
    {
      title: 'Тип материала',
      dataIndex: 'material_type',
      width: 110,
      editable: true,
      align: 'center' as const,
      render: (text: MaterialType) => {
        const bgColor = text === 'основн.' ? 'rgba(255, 152, 0, 0.12)' : 'rgba(21, 101, 192, 0.12)';
        const textColor = text === 'основн.' ? '#fb8c00' : '#1976d2';
        return <Tag style={{ backgroundColor: bgColor, color: textColor, border: 'none' }}>{text}</Tag>;
      },
    },
    {
      title: 'Наименование материала',
      dataIndex: 'material_name',
      width: 250,
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
      render: (text: UnitType, record: MaterialLibraryFull) => {
        if (isEditing(record)) {
          return selectedUnit || text || '-';
        }
        return text;
      },
    },
    {
      title: 'Коэфф. расхода',
      dataIndex: 'consumption_coefficient',
      width: 120,
      editable: true,
      align: 'center' as const,
      render: (value: number) => value?.toFixed(4),
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
      width: 100,
      editable: true,
      align: 'center' as const,
      render: (value: CurrencyType) => currencySymbols[value] || value,
    },
    {
      title: 'Тип доставки',
      dataIndex: 'delivery_price_type',
      width: 120,
      editable: true,
      align: 'center' as const,
      render: (text: DeliveryPriceType) => text,
    },
    {
      title: 'Сумма доставки',
      dataIndex: 'delivery_amount',
      width: 110,
      editable: true,
      align: 'center' as const,
      render: (value: number, record: MaterialLibraryFull) =>
        record.delivery_price_type === 'суммой' ? value?.toFixed(2) : '-',
    },
    {
      title: 'Действия',
      dataIndex: 'operation',
      width: 100,
      editable: true,
      align: 'center' as const,
      render: (_: unknown, record: MaterialLibraryFull) => {
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
      onCell: (record: MaterialLibraryFull) => ({
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
    record: MaterialLibraryFull;
    children: React.ReactNode;
  }> = ({ editing, dataIndex, children, record }) => {
    const deliveryPriceType = Form.useWatch('delivery_price_type', form);
    const currentItemType = Form.useWatch('item_type', form);

    // Get border color based on item_type for editing mode (all types)
    const getEditBorderColor = () => {
      if (!editing) return undefined;
      const itemType = currentItemType || record.item_type;
      switch (itemType) {
        case 'мат':
          return '#2196f3'; // Синий
        case 'суб-мат':
          return '#9ccc65'; // Светло-зеленый
        case 'мат-комп.':
          return '#00897b'; // Бирюзовый/темно-зеленый
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
              <Select.Option value="мат">мат</Select.Option>
              <Select.Option value="суб-мат">суб-мат</Select.Option>
              <Select.Option value="мат-комп.">мат-комп.</Select.Option>
            </Select>
          </Form.Item>
        );
        break;

      case 'material_type':
        inputNode = (
          <Form.Item
            name={dataIndex}
            style={{ margin: 0 }}
            rules={[{ required: true, message: 'Обязательное поле' }]}
          >
            <Select>
              <Select.Option value="основн.">основн.</Select.Option>
              <Select.Option value="вспомогат.">вспомогат.</Select.Option>
            </Select>
          </Form.Item>
        );
        break;

      case 'material_name':
        inputNode = (
          <Form.Item
            name="material_name_id"
            style={{ margin: 0 }}
            rules={[{ required: true, message: 'Обязательное поле' }]}
          >
            <AutoComplete
              options={materialNames.map(m => ({ value: m.name }))}
              onSelect={handleMaterialNameSelect}
              filterOption={(inputValue, option) =>
                option!.value.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1
              }
              placeholder="Начните вводить название..."
            />
          </Form.Item>
        );
        break;

      case 'consumption_coefficient':
        inputNode = (
          <Form.Item
            name={dataIndex}
            style={{ margin: 0 }}
            rules={[
              { required: true, message: 'Обязательное поле' },
              {
                validator: (_, value) => {
                  if (value && value < 1.0) {
                    return Promise.reject('Коэффициент должен быть не менее 1.00');
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <InputNumber
              min={1.0}
              step={0.01}
              precision={4}
              style={{ width: '100%' }}
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

      case 'delivery_price_type':
        inputNode = (
          <Form.Item
            name={dataIndex}
            style={{ margin: 0 }}
            rules={[{ required: true, message: 'Обязательное поле' }]}
          >
            <Select>
              <Select.Option value="в цене">в цене</Select.Option>
              <Select.Option value="не в цене">не в цене</Select.Option>
              <Select.Option value="суммой">суммой</Select.Option>
            </Select>
          </Form.Item>
        );
        break;

      case 'delivery_amount':
        if (deliveryPriceType !== 'суммой') {
          return <td style={cellStyle}>-</td>;
        }
        inputNode = (
          <Form.Item
            name={dataIndex}
            style={{ margin: 0 }}
            rules={[
              {
                required: deliveryPriceType === 'суммой',
                message: 'Укажите сумму'
              }
            ]}
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
      case 'мат':
        return '#2196f3'; // Синий
      case 'суб-мат':
        return '#9ccc65'; // Светло-зеленый
      case 'мат-комп.':
        return '#00897b'; // Бирюзовый/темно-зеленый
      default:
        return 'transparent';
    }
  };

  // Filter data by search text
  const filteredData = data.filter(item =>
    item.material_name.toLowerCase().includes(searchText.toLowerCase())
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
              material_type: 'основн.',
              item_type: 'мат',
              consumption_coefficient: 1.0,
              currency_type: 'RUB',
              delivery_price_type: 'в цене',
              delivery_amount: 0,
            }}
          >
            <Row gutter={8}>
              <Col span={3}>
                <Form.Item
                  label="Вид материала"
                  name="item_type"
                  rules={[{ required: true, message: 'Обязательное поле' }]}
                >
                  <Select onChange={(value) => setAddItemType(value as ItemType)}>
                    <Select.Option value="мат">мат</Select.Option>
                    <Select.Option value="суб-мат">суб-мат</Select.Option>
                    <Select.Option value="мат-комп.">мат-комп.</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={3}>
                <Form.Item
                  label="Тип материала"
                  name="material_type"
                  rules={[{ required: true, message: 'Обязательное поле' }]}
                >
                  <Select>
                    <Select.Option value="основн.">основн.</Select.Option>
                    <Select.Option value="вспомогат.">вспомогат.</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={5}>
                <Form.Item
                  label="Наименование материала"
                  name="material_name_id"
                  rules={[{ required: true, message: 'Обязательное поле' }]}
                >
                  <AutoComplete
                    options={materialNames.map(m => ({ value: m.name }))}
                    onSelect={handleAddMaterialNameSelect}
                    filterOption={(inputValue, option) =>
                      option!.value.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1
                    }
                    placeholder="Начните вводить..."
                  />
                </Form.Item>
              </Col>
              <Col span={1}>
                <Form.Item label="Ед.изм">
                  <Input value={selectedAddUnit || '-'} disabled style={{ textAlign: 'center' }} />
                </Form.Item>
              </Col>
              <Col span={3}>
                <Form.Item
                  label="Коэфф. расхода"
                  name="consumption_coefficient"
                  rules={[
                    { required: true, message: 'Обязательное поле' },
                    {
                      validator: (_, value) => {
                        if (value && value < 1.0) {
                          return Promise.reject('Мин. 1.00');
                        }
                        return Promise.resolve();
                      }
                    }
                  ]}
                >
                  <InputNumber min={1.0} step={0.01} precision={4} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={2}>
                <Form.Item
                  label="Цена за ед."
                  name="unit_rate"
                  rules={[{ required: true, message: 'Обязательное поле' }]}
                >
                  <InputNumber min={0} step={0.01} precision={2} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={2}>
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
              <Col span={2}>
                <Form.Item
                  label="Тип доставки"
                  name="delivery_price_type"
                  rules={[{ required: true, message: 'Обязательное поле' }]}
                >
                  <Select onChange={(value) => setAddDeliveryType(value as DeliveryPriceType)}>
                    <Select.Option value="в цене">в цене</Select.Option>
                    <Select.Option value="не в цене">не в цене</Select.Option>
                    <Select.Option value="суммой">суммой</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={3}>
                <Form.Item
                  label="Сумма доставки"
                  name="delivery_amount"
                  dependencies={['delivery_price_type']}
                  rules={[
                    ({ getFieldValue }) => ({
                      required: getFieldValue('delivery_price_type') === 'суммой',
                      message: 'Укажите сумму'
                    })
                  ]}
                >
                  <InputNumber
                    min={0}
                    step={0.01}
                    precision={2}
                    style={{ width: '100%' }}
                    disabled={addDeliveryType !== 'суммой'}
                  />
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
        .material-row-mat {
          background-color: rgba(33, 150, 243, 0.15) !important;
        }
        .material-row-mat:hover > td {
          background-color: rgba(33, 150, 243, 0.25) !important;
        }
        .material-row-sub-mat {
          background-color: rgba(156, 204, 101, 0.15) !important;
        }
        .material-row-sub-mat:hover > td {
          background-color: rgba(156, 204, 101, 0.25) !important;
        }
        .material-row-mat-comp {
          background-color: rgba(0, 137, 123, 0.15) !important;
        }
        .material-row-mat-comp:hover > td {
          background-color: rgba(0, 137, 123, 0.25) !important;
        }
      `}</style>
    </div>
  );
});

export default MaterialsTab;
