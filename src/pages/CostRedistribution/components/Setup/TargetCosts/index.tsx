/**
 * Шаг 2: Куда добавить (целевые затраты)
 */

import React from 'react';
import { Space } from 'antd';
import { TargetCostForm } from './TargetCostForm';
import { TargetCostList } from './TargetCostList';
import type { CostCategory, DetailCostCategory } from '../../../types';
import type { TargetCost } from '../../../utils';

interface TargetCostsStepProps {
  categories: CostCategory[];
  detailCategories: DetailCostCategory[];
  targets: TargetCost[];
  onAddTarget: (target: TargetCost) => void;
  onRemoveTarget: (index: number) => void;
  totalDeduction?: number;
}

export const TargetCostsStep: React.FC<TargetCostsStepProps> = ({
  categories,
  detailCategories,
  targets,
  onAddTarget,
  onRemoveTarget,
}) => {
  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <TargetCostForm
        categories={categories}
        detailCategories={detailCategories}
        onAdd={onAddTarget}
        existingTargets={targets}
      />

      <TargetCostList targets={targets} onRemove={onRemoveTarget} />
    </Space>
  );
};
