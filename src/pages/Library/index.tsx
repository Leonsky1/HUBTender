import React, { useState } from 'react';
import { Card, Tabs } from 'antd';
import { AppstoreOutlined, ToolOutlined } from '@ant-design/icons';
import MaterialsTab from './MaterialsTab';
import WorksTab from './WorksTab';

const Library: React.FC = () => {
  const [activeTab, setActiveTab] = useState('materials');

  const tabItems = [
    {
      key: 'materials',
      label: (
        <span>
          <AppstoreOutlined />
          Материалы
        </span>
      ),
      children: <MaterialsTab />
    },
    {
      key: 'works',
      label: (
        <span>
          <ToolOutlined />
          Работы
        </span>
      ),
      children: <WorksTab />
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title="Библиотека материалов и работ"
        bordered={false}
        style={{ minHeight: 'calc(100vh - 200px)' }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
        />
      </Card>
    </div>
  );
};

export default Library;
