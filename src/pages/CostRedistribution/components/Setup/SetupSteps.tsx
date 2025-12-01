/**
 * Компонент для настройки перераспределения (два блока рядом)
 */

import React from 'react';
import { Row, Col } from 'antd';
import { SourceRulesStep } from './SourceRules';
import { TargetCostsStep } from './TargetCosts';
import type { CostCategory, DetailCostCategory } from '../../types';
import type { SourceRule, TargetCost } from '../../utils';

interface SetupStepsProps {
  categories: CostCategory[];
  detailCategories: DetailCostCategory[];
  sourceRules: SourceRule[];
  targetCosts: TargetCost[];
  onAddRule: (rule: SourceRule) => void;
  onRemoveRule: (index: number) => void;
  onAddTarget: (target: TargetCost) => void;
  onRemoveTarget: (index: number) => void;
  totalDeduction?: number;
}

export const SetupSteps: React.FC<SetupStepsProps> = ({
  categories,
  detailCategories,
  sourceRules,
  targetCosts,
  onAddRule,
  onRemoveRule,
  onAddTarget,
  onRemoveTarget,
  totalDeduction = 0,
}) => {
  return (
    <Row gutter={16}>
      <Col xs={24} lg={12}>
        <SourceRulesStep
          categories={categories}
          detailCategories={detailCategories}
          rules={sourceRules}
          onAddRule={onAddRule}
          onRemoveRule={onRemoveRule}
        />
      </Col>
      <Col xs={24} lg={12}>
        <TargetCostsStep
          categories={categories}
          detailCategories={detailCategories}
          targets={targetCosts}
          onAddTarget={onAddTarget}
          onRemoveTarget={onRemoveTarget}
          totalDeduction={totalDeduction}
        />
      </Col>
    </Row>
  );
};
