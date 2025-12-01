/**
 * Форма добавления правила вычитания
 */

import React, { useState } from 'react';
import { Form, InputNumber, Button, Card } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { CategoryDetailSelector } from '../../shared/CategoryDetailSelector';
import type { CostCategory, DetailCostCategory } from '../../../types';
import type { SourceRule } from '../../../utils';

interface SourceRuleFormProps {
  categories: CostCategory[];
  detailCategories: DetailCostCategory[];
  onAdd: (rule: SourceRule) => void;
  existingRules: SourceRule[];
}

export const SourceRuleForm: React.FC<SourceRuleFormProps> = ({
  categories,
  detailCategories,
  onAdd,
  existingRules,
}) => {
  const [form] = Form.useForm();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<'category' | 'detail'>('detail');

  const handleCategoryChange = (id: string, fullName: string, level: 'category' | 'detail') => {
    setSelectedCategoryId(id);
    setSelectedCategoryName(fullName);
    setSelectedLevel(level);
    form.setFieldValue('category', id);
  };

  const handleAdd = () => {
    form.validateFields().then(() => {
      const percentage = form.getFieldValue('percentage');

      if (!selectedCategoryId) {
        return;
      }

      // Проверка на дубликат
      const isDuplicate = existingRules.some(rule => {
        if (selectedLevel === 'category') {
          return rule.level === 'category' && rule.category_id === selectedCategoryId;
        } else {
          return rule.level === 'detail' && rule.detail_cost_category_id === selectedCategoryId;
        }
      });

      if (isDuplicate) {
        form.setFields([
          {
            name: 'category',
            errors: ['Эта затрата уже добавлена'],
          },
        ]);
        return;
      }

      const rule: SourceRule = {
        category_id: selectedLevel === 'category' ? selectedCategoryId : undefined,
        detail_cost_category_id: selectedLevel === 'detail' ? selectedCategoryId : undefined,
        category_name: selectedCategoryName,
        percentage,
        level: selectedLevel,
      };

      onAdd(rule);

      // Очистка формы
      form.resetFields();
      setSelectedCategoryId('');
      setSelectedCategoryName('');
    });
  };

  return (
    <Card title="Добавить затрату для вычитания" size="small">
      <Form form={form} layout="vertical">
        <CategoryDetailSelector
          categories={categories}
          detailCategories={detailCategories}
          value={
            selectedCategoryId
              ? { level: selectedLevel, id: selectedCategoryId }
              : undefined
          }
          onChange={handleCategoryChange}
        />

        <Form.Item
          label="Процент вычета"
          name="percentage"
          rules={[
            { required: true, message: 'Укажите процент' },
          ]}
          initialValue={10}
        >
          <InputNumber
            style={{ width: '100%' }}
            min={0.00001}
            max={100}
            step={0.01}
            precision={5}
            addonAfter="%"
            decimalSeparator=","
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} block>
            Добавить затрату
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};
