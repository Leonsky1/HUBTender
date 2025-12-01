/**
 * Вкладка "Настройка перераспределения"
 */

import React from 'react';
import { Space } from 'antd';
import { SetupSteps } from './Setup/SetupSteps';
import { RedistributionActions } from './shared/RedistributionActions';
import type { CostCategory, DetailCostCategory } from '../types';
import type { SourceRule, TargetCost } from '../utils';

interface TabSetupProps {
  categories: CostCategory[];
  detailCategories: DetailCostCategory[];
  sourceRules: SourceRule[];
  targetCosts: TargetCost[];
  onAddRule: (rule: SourceRule) => void;
  onRemoveRule: (index: number) => void;
  onAddTarget: (target: TargetCost) => void;
  onRemoveTarget: (index: number) => void;
  totalDeduction: number;
  canCalculate: boolean;
  isCalculated: boolean;
  saving?: boolean;
  onGoToResults: () => void;
  onClear: () => void;
}

export const TabSetup: React.FC<TabSetupProps> = ({
  categories,
  detailCategories,
  sourceRules,
  targetCosts,
  onAddRule,
  onRemoveRule,
  onAddTarget,
  onRemoveTarget,
  totalDeduction,
  canCalculate,
  isCalculated,
  saving,
  onGoToResults,
  onClear,
}) => {
  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <RedistributionActions
        canCalculate={canCalculate}
        isCalculated={isCalculated}
        saving={saving}
        onGoToResults={onGoToResults}
        onClear={onClear}
      />

      <SetupSteps
        categories={categories}
        detailCategories={detailCategories}
        sourceRules={sourceRules}
        targetCosts={targetCosts}
        onAddRule={onAddRule}
        onRemoveRule={onRemoveRule}
        onAddTarget={onAddTarget}
        onRemoveTarget={onRemoveTarget}
        totalDeduction={totalDeduction}
      />
    </Space>
  );
};
