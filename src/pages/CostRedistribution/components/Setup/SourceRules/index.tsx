/**
 * Шаг 1: Откуда вычитать (правила вычитания)
 */

import React from 'react';
import { Space } from 'antd';
import { SourceRuleForm } from './SourceRuleForm';
import { SourceRuleList } from './SourceRuleList';
import type { CostCategory, DetailCostCategory } from '../../../types';
import type { SourceRule } from '../../../utils';

interface SourceRulesStepProps {
  categories: CostCategory[];
  detailCategories: DetailCostCategory[];
  rules: SourceRule[];
  onAddRule: (rule: SourceRule) => void;
  onRemoveRule: (index: number) => void;
}

export const SourceRulesStep: React.FC<SourceRulesStepProps> = ({
  categories,
  detailCategories,
  rules,
  onAddRule,
  onRemoveRule,
}) => {
  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <SourceRuleForm
        categories={categories}
        detailCategories={detailCategories}
        onAdd={onAddRule}
        existingRules={rules}
      />

      <SourceRuleList rules={rules} onRemove={onRemoveRule} />
    </Space>
  );
};
