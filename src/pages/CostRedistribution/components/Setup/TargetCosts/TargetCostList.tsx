/**
 * Список целевых затрат
 */

import React from 'react';
import { Table, Button, Tag } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { TargetCost } from '../../../utils';

interface TargetCostListProps {
  targets: TargetCost[];
  onRemove: (index: number) => void;
}

export const TargetCostList: React.FC<TargetCostListProps> = ({ targets, onRemove }) => {
  const columns: ColumnsType<TargetCost & { index: number }> = [
    {
      title: '№',
      dataIndex: 'index',
      key: 'index',
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Затрата на строительство',
      dataIndex: 'category_name',
      key: 'category_name',
      render: (text) => <Tag color="green">{text}</Tag>,
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 100,
      render: (_, __, index) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => onRemove(index)}
          size="small"
        >
          Удалить
        </Button>
      ),
    },
  ];

  const dataSource = targets.map((target, index) => ({
    ...target,
    index,
    key: index,
  }));

  if (targets.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
        Целевые затраты не добавлены
      </div>
    );
  }

  return (
    <Table
      columns={columns}
      dataSource={dataSource}
      pagination={false}
      size="small"
      bordered
    />
  );
};
