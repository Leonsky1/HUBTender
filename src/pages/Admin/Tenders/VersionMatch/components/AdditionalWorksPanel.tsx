/**
 * Панель отображения результатов переноса дополнительных работ
 */

import { Card, Table, Tag, Space, Typography, Alert } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  SwapOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import type { AdditionalWorkTransfer } from '../../../../../utils/versionTransfer';

const { Text } = Typography;

interface AdditionalWorksPanelProps {
  additionalWorks: AdditionalWorkTransfer[];
  visible: boolean;
}

/**
 * Компонент для отображения результатов переноса дополнительных работ
 *
 * Показывает:
 * - Статус переноса каждой ДОП работы
 * - Причину (родитель сопоставлен, найдена альтернатива, не найден родитель)
 * - Ошибки при переносе
 */
export function AdditionalWorksPanel({
  additionalWorks,
  visible,
}: AdditionalWorksPanelProps) {
  if (!visible || additionalWorks.length === 0) {
    return null;
  }

  const successCount = additionalWorks.filter(w => w.success).length;
  const failedCount = additionalWorks.filter(w => !w.success).length;

  /**
   * Получить цвет тега для причины
   */
  const getReasonColor = (reason: AdditionalWorkTransfer['reason']) => {
    switch (reason) {
      case 'parent_matched':
        return 'green';
      case 'parent_deleted_found_alternative':
        return 'orange';
      case 'no_parent_found':
        return 'red';
      default:
        return 'default';
    }
  };

  /**
   * Получить текст для причины
   */
  const getReasonText = (reason: AdditionalWorkTransfer['reason']) => {
    switch (reason) {
      case 'parent_matched':
        return 'Родитель сопоставлен';
      case 'parent_deleted_found_alternative':
        return 'Найдена альтернатива';
      case 'no_parent_found':
        return 'Родитель не найден';
      default:
        return 'Неизвестно';
    }
  };

  /**
   * Получить иконку для причины
   */
  const getReasonIcon = (reason: AdditionalWorkTransfer['reason']) => {
    switch (reason) {
      case 'parent_matched':
        return <CheckCircleOutlined />;
      case 'parent_deleted_found_alternative':
        return <SwapOutlined />;
      case 'no_parent_found':
        return <QuestionCircleOutlined />;
      default:
        return null;
    }
  };

  const columns: ColumnsType<AdditionalWorkTransfer> = [
    {
      title: 'Статус',
      key: 'status',
      width: 100,
      align: 'center',
      render: (_, record) => {
        if (record.success) {
          return (
            <Tag icon={<CheckCircleOutlined />} color="success">
              Успешно
            </Tag>
          );
        }
        return (
          <Tag icon={<CloseCircleOutlined />} color="error">
            Ошибка
          </Tag>
        );
      },
    },

    {
      title: 'Дополнительная работа',
      key: 'additionalWork',
      width: '30%',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Text strong>{record.additionalPosition.work_name}</Text>
          <Space size="small">
            {record.additionalPosition.unit_code && (
              <Tag color="green">{record.additionalPosition.unit_code}</Tag>
            )}
            {record.additionalPosition.volume && (
              <Tag color="purple">{record.additionalPosition.volume}</Tag>
            )}
          </Space>
        </Space>
      ),
    },

    {
      title: 'Причина',
      key: 'reason',
      width: '20%',
      render: (_, record) => (
        <Tag
          icon={getReasonIcon(record.reason)}
          color={getReasonColor(record.reason)}
        >
          {getReasonText(record.reason)}
        </Tag>
      ),
    },

    {
      title: 'Оригинальный родитель',
      key: 'originalParent',
      width: '15%',
      render: (_, record) => {
        if (!record.originalParentId) {
          return <Text type="secondary">—</Text>;
        }
        return <Text type="secondary">{record.originalParentId.substring(0, 8)}...</Text>;
      },
    },

    {
      title: 'Новый родитель',
      key: 'newParent',
      width: '15%',
      render: (_, record) => {
        if (!record.newParentId) {
          return <Text type="secondary">—</Text>;
        }
        return (
          <Space direction="vertical" size="small">
            <Text type="secondary">{record.newParentId.substring(0, 8)}...</Text>
            {record.alternativeParentId && (
              <Tag color="orange" style={{ fontSize: '11px' }}>
                Альтернатива
              </Tag>
            )}
          </Space>
        );
      },
    },

    {
      title: 'Ошибка',
      key: 'error',
      width: '20%',
      render: (_, record) => {
        if (!record.error) {
          return <Text type="secondary">—</Text>;
        }
        return <Text type="danger">{record.error}</Text>;
      },
    },
  ];

  return (
    <Card
      title={
        <Space>
          <SwapOutlined />
          <span>Дополнительные работы</span>
          <Tag color={successCount === additionalWorks.length ? 'success' : 'warning'}>
            {successCount} / {additionalWorks.length}
          </Tag>
        </Space>
      }
      size="small"
      style={{ marginTop: 16 }}
    >
      {failedCount > 0 && (
        <Alert
          message="Внимание"
          description={`${failedCount} дополнительных работ не удалось перенести. Проверьте ошибки в таблице ниже.`}
          type="warning"
          showIcon
          closable
          style={{ marginBottom: 16 }}
        />
      )}

      <Table
        columns={columns}
        dataSource={additionalWorks}
        rowKey={(record) => record.additionalPosition.id}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Всего ${total} дополнительных работ`,
        }}
        size="small"
        bordered
      />
    </Card>
  );
}
