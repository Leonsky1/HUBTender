/**
 * Индикатор проверки консистентности коммерческих цен
 */

import { Space, Tooltip, Spin } from 'antd';
import { CheckCircleFilled, CloseCircleFilled, LoadingOutlined } from '@ant-design/icons';

interface PricingConsistencyIndicatorProps {
  commerce: boolean;
  costs: boolean;
  financial: boolean;
  loading: boolean;
  error: string | null;
  boqTotalBase?: number;
  boqTotalCommercial?: number;
  boqItemsCount?: number;
  costsTotal?: number;
}

export default function PricingConsistencyIndicator({
  commerce,
  costs,
  financial,
  loading,
  error,
  boqTotalBase,
  boqTotalCommercial,
  boqItemsCount,
  costsTotal
}: PricingConsistencyIndicatorProps) {
  if (loading) {
    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '4px 12px',
        backgroundColor: '#f0f0f0',
        borderRadius: '6px'
      }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 14 }} spin />} />
        <span style={{ fontSize: '13px', color: '#666' }}>
          Проверка консистентности...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <Tooltip title={`Ошибка проверки: ${error}`}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 12px',
          backgroundColor: '#fff2e8',
          borderRadius: '6px',
          border: '1px solid #ffbb96'
        }}>
          <CloseCircleFilled style={{ color: '#ff4d4f', fontSize: 14 }} />
          <span style={{ fontSize: '13px', color: '#cf1322' }}>
            Ошибка проверки
          </span>
        </div>
      </Tooltip>
    );
  }

  const allPassed = commerce && costs && financial;

  const formatNumber = (num: number | undefined) => {
    if (num === undefined) return 'н/д';
    return num.toLocaleString('ru-RU', { maximumFractionDigits: 2 }) + ' руб';
  };

  return (
    <Tooltip
      title={
        <div>
          <div style={{ marginBottom: 8, fontWeight: 'bold' }}>
            Консистентность коммерческих цен
          </div>

          <div style={{ marginBottom: 4, fontWeight: 500 }}>Статус проверки:</div>
          <div>• Коммерция: {commerce ? '✓ Пройдено' : '✗ Не пройдено'} - {formatNumber(boqTotalCommercial)}</div>
          <div>• Затраты: {costs ? '✓ Пройдено' : '✗ Не пройдено'} - {formatNumber(costsTotal)}</div>
          <div>• Финансовые показатели: {financial ? '✓ Пройдено' : '✗ Не пройдено'} - {formatNumber(boqTotalCommercial)}</div>
        </div>
      }
    >
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 12px',
        backgroundColor: allPassed ? '#f6ffed' : '#fff2e8',
        borderRadius: '6px',
        border: `1px solid ${allPassed ? '#b7eb8f' : '#ffbb96'}`,
        cursor: 'pointer'
      }}>
        <Space size={4}>
          <Tooltip title={commerce ? "Коммерция: данные корректны" : "Коммерция: нет данных"}>
            {commerce ? (
              <CheckCircleFilled style={{ color: '#52c41a', fontSize: 14 }} />
            ) : (
              <CloseCircleFilled style={{ color: '#ff4d4f', fontSize: 14 }} />
            )}
          </Tooltip>

          <Tooltip title={costs ? "Затраты: данные корректны" : "Затраты: нет данных"}>
            {costs ? (
              <CheckCircleFilled style={{ color: '#52c41a', fontSize: 14 }} />
            ) : (
              <CloseCircleFilled style={{ color: '#ff4d4f', fontSize: 14 }} />
            )}
          </Tooltip>

          <Tooltip title={financial ? "Финансовые показатели: данные корректны" : "Финансовые показатели: нет данных"}>
            {financial ? (
              <CheckCircleFilled style={{ color: '#52c41a', fontSize: 14 }} />
            ) : (
              <CloseCircleFilled style={{ color: '#ff4d4f', fontSize: 14 }} />
            )}
          </Tooltip>
        </Space>
        <span style={{
          fontSize: '13px',
          color: allPassed ? '#389e0d' : '#d46b08',
          fontWeight: 500
        }}>
          {allPassed ? 'Консистентность подтверждена' : 'Требуется проверка'}
        </span>
      </div>
    </Tooltip>
  );
}
