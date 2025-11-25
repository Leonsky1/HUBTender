/**
 * Компонент статистики сопоставления
 */

import { Card, Row, Col, Statistic, Tag } from 'antd';
import {
  CheckCircleOutlined,
  QuestionCircleOutlined,
  PlusCircleOutlined,
  MinusCircleOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import type { MatchPair } from '../types';

interface MatchStatisticsProps {
  matches: MatchPair[];
  loading?: boolean;
}

/**
 * Компонент отображения статистики сопоставления версий
 *
 * Показывает:
 * - Количество точных совпадений (auto)
 * - Количество с низкой уверенностью (low_confidence)
 * - Ручное сопоставление
 * - Новые позиции
 * - Удаленные позиции
 */
export function MatchStatistics({ matches, loading = false }: MatchStatisticsProps) {
  // Подсчет статистики
  const autoMatches = matches.filter(m => m.matchType === 'auto').length;
  const lowConfMatches = matches.filter(m => m.matchType === 'low_confidence').length;
  const manualMatches = matches.filter(m => m.matchType === 'manual').length;
  const newPositions = matches.filter(m => m.matchType === 'new').length;
  const deletedPositions = matches.filter(m => m.matchType === 'deleted').length;

  return (
    <Card
      title={
        <span>
          <SwapOutlined style={{ marginRight: 8 }} />
          Статистика сопоставления
        </span>
      }
      loading={loading}
      size="small"
    >
      <Row gutter={[16, 16]} justify="space-between">
        <Col flex="1">
          <Statistic
            title="Точные совпадения"
            value={autoMatches}
            prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            suffix={<Tag color="green">≥95%</Tag>}
          />
        </Col>

        <Col flex="1">
          <Statistic
            title="Низкая уверенность"
            value={lowConfMatches}
            prefix={<QuestionCircleOutlined style={{ color: '#faad14' }} />}
            suffix={<Tag color="orange">50-95%</Tag>}
          />
        </Col>

        <Col flex="1">
          <Statistic
            title="Ручное сопоставление"
            value={manualMatches}
            prefix={<SwapOutlined style={{ color: '#1890ff' }} />}
            suffix={<Tag color="blue">Вручную</Tag>}
          />
        </Col>

        <Col flex="1">
          <Statistic
            title="Новые позиции"
            value={newPositions}
            prefix={<PlusCircleOutlined style={{ color: '#1890ff' }} />}
            suffix={<Tag color="blue">Добавлены</Tag>}
          />
        </Col>

        <Col flex="1">
          <Statistic
            title="Удаленные позиции"
            value={deletedPositions}
            prefix={<MinusCircleOutlined style={{ color: '#ff4d4f' }} />}
            suffix={<Tag color="red">Удалены</Tag>}
          />
        </Col>
      </Row>
    </Card>
  );
}
