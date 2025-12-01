/**
 * Форма добавления целевой затраты
 */

import React, { useState } from 'react';
import { Form, Button, Card } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { CategoryDetailSelector } from '../../shared/CategoryDetailSelector';
import type { CostCategory, DetailCostCategory } from '../../../types';
import type { TargetCost } from '../../../utils';

interface TargetCostFormProps {
  categories: CostCategory[];
  detailCategories: DetailCostCategory[];
  onAdd: (target: TargetCost) => void;
  existingTargets: TargetCost[];
}

export const TargetCostForm: React.FC<TargetCostFormProps> = ({
  categories,
  detailCategories,
  onAdd,
  existingTargets,
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
      if (!selectedCategoryId) {
        return;
      }

      // Проверка на дубликат
      const isDuplicate = existingTargets.some(target => {
        if (selectedLevel === 'category') {
          return target.level === 'category' && target.category_id === selectedCategoryId;
        } else {
          return target.level === 'detail' && target.detail_cost_category_id === selectedCategoryId;
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

      const target: TargetCost = {
        category_id: selectedLevel === 'category' ? selectedCategoryId : undefined,
        detail_cost_category_id: selectedLevel === 'detail' ? selectedCategoryId : undefined,
        category_name: selectedCategoryName,
        level: selectedLevel,
      };

      onAdd(target);

      // Очистка формы
      form.resetFields();
      setSelectedCategoryId('');
      setSelectedCategoryName('');
    });
  };

  return (
    <Card title="Добавить целевую затрату" size="small">
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

        {/* Пустое пространство для выравнивания кнопки с первым шагом */}
        <div style={{ height: 86 }} />

        <Form.Item>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} block>
            Добавить затрату
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};
