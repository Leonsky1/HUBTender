/**
 * Предпросмотр распределения по целевым затратам
 */

import React from 'react';
import { Alert, Card } from 'antd';
import type { TargetCost } from '../../../utils';

interface TargetCostPreviewProps {
  targets: TargetCost[];
  totalDeduction?: number;
}

export const TargetCostPreview: React.FC<TargetCostPreviewProps> = ({
  targets,
  totalDeduction = 0,
}) => {
  if (targets.length === 0) {
    return (
      <Alert
        message="Добавьте хотя бы одну целевую затрату для распределения"
        type="info"
        showIcon
      />
    );
  }

  return (
    <Card title="Информация о распределении" size="small">
      <Alert
        message={`Общая сумма к распределению: ${totalDeduction.toLocaleString('ru-RU', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} ₽`}
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Alert
        message="Распределение будет выполнено автоматически, пропорционально стоимости работ в каждой целевой затрате"
        type="success"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <div style={{ marginBottom: 16 }}>
        <strong>Целевые затраты ({targets.length}):</strong>
        <ul style={{ marginTop: 8, marginBottom: 0 }}>
          {targets.map((target, index) => (
            <li key={index} style={{ marginBottom: 4 }}>
              {target.category_name}
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
};
