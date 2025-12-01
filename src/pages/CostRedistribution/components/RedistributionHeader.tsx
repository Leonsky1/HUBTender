/**
 * Заголовок страницы перераспределения с фильтрами
 */

import React from 'react';
import { Card, Row, Col, Select, Typography, Space, Statistic, Button } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import type { Tender } from '../../../lib/supabase';
import type { MarkupTactic } from '../hooks';

const { Title } = Typography;

interface RedistributionHeaderProps {
  tenders: Tender[];
  selectedTenderId: string | undefined;
  onTenderChange: (tenderId: string) => void;
  markupTactics: MarkupTactic[];
  selectedTacticId: string | undefined;
  onTacticChange: (tacticId: string) => void;
  loading?: boolean;
  totals?: {
    totalMaterials: number;
    totalWorks: number;
    total: number;
  };
  hasResults?: boolean;
  onExport?: () => void;
}

export const RedistributionHeader: React.FC<RedistributionHeaderProps> = ({
  tenders,
  selectedTenderId,
  onTenderChange,
  markupTactics,
  selectedTacticId,
  onTacticChange,
  loading = false,
  totals,
  hasResults = false,
  onExport,
}) => {
  return (
    <Card style={{ marginBottom: 16 }}>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Title level={2} style={{ margin: 0 }}>
          Перераспределение стоимости работ
        </Title>

        <Row gutter={16} align="middle">
          <Col xs={24} sm={12} lg={8}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              Тендер:
            </label>
            <Select
              style={{ width: '100%' }}
              placeholder="Выберите тендер"
              value={selectedTenderId}
              onChange={onTenderChange}
              loading={loading}
              showSearch
              optionFilterProp="children"
            >
              {tenders.map((tender) => (
                <Select.Option key={tender.id} value={tender.id}>
                  {tender.title} (v{tender.version})
                </Select.Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              Схема наценок:
            </label>
            <Select
              style={{ width: '100%' }}
              placeholder="Выберите схему наценок"
              value={selectedTacticId}
              onChange={onTacticChange}
              disabled={!selectedTenderId}
              loading={loading}
              showSearch
              optionFilterProp="children"
            >
              {markupTactics.map((tactic) => (
                <Select.Option key={tactic.id} value={tactic.id}>
                  {tactic.name}
                  {tactic.is_global && ' (глобальная)'}
                </Select.Option>
              ))}
            </Select>
          </Col>

          {hasResults && totals && (
            <Col xs={24} lg={8} style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, alignItems: 'center' }}>
              <Statistic
                title="Итого материалы"
                value={totals.totalMaterials}
                precision={0}
                formatter={(value) => Math.round(Number(value)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                valueStyle={{ fontSize: 18 }}
              />
              <Statistic
                title="Итого работы"
                value={totals.totalWorks}
                precision={0}
                formatter={(value) => Math.round(Number(value)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                valueStyle={{ fontSize: 18 }}
              />
              <Statistic
                title="Итого"
                value={totals.total}
                precision={0}
                formatter={(value) => Math.round(Number(value)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                valueStyle={{ color: '#10b981', fontWeight: 600, fontSize: 18 }}
              />
              {onExport && (
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={onExport}
                  size="large"
                >
                  Экспорт в Excel
                </Button>
              )}
            </Col>
          )}
        </Row>
      </Space>
    </Card>
  );
};
