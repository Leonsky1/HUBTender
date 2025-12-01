/**
 * Сводка по правилам вычитания
 */

import React from 'react';
import { Alert, Statistic, Row, Col } from 'antd';
import type { SourceRule } from '../../../utils';

interface SourceRuleSummaryProps {
  rules: SourceRule[];
}

export const SourceRuleSummary: React.FC<SourceRuleSummaryProps> = ({ rules }) => {
  if (rules.length === 0) {
    return (
      <Alert
        message="Добавьте хотя бы одно правило вычитания для продолжения"
        type="info"
        showIcon
      />
    );
  }

  const totalCategories = rules.length;
  const avgPercentage = rules.reduce((sum, rule) => sum + rule.percentage, 0) / totalCategories;

  return (
    <Alert
      message="Сводка по правилам вычитания"
      description={
        <Row gutter={16} style={{ marginTop: 12 }}>
          <Col span={12}>
            <Statistic
              title="Количество затрат"
              value={totalCategories}
              suffix="шт"
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="Средний процент"
              value={avgPercentage.toFixed(2)}
              suffix="%"
            />
          </Col>
        </Row>
      }
      type="success"
      showIcon
    />
  );
};
