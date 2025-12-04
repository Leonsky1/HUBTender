import React from 'react';
import { Card, Typography, Result } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const Bsm: React.FC = () => {
  return (
    <Card>
      <Result
        icon={<FileTextOutlined style={{ fontSize: 64, color: '#10b981' }} />}
        title="База стройматериалов (БСМ)"
        subTitle="Эта страница находится в разработке"
        extra={
          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">
              Здесь будет отображаться база стройматериалов тендера
            </Text>
          </div>
        }
      />
    </Card>
  );
};

export default Bsm;
