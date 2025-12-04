import React, { useState, useEffect, useRef } from 'react';
import { Tabs, Button, Space, Input, Typography } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import type { TabsProps } from 'antd';
import { useMaterials } from './hooks/useMaterials.tsx';
import { useWorks } from './hooks/useWorks.tsx';
import { useUnits } from './hooks/useUnits.tsx';
import { MaterialsTab, type MaterialsTabRef } from './components/MaterialsTab';
import { WorksTab, type WorksTabRef } from './components/WorksTab';
import { UnitsTab, type UnitsTabRef } from './components/UnitsTab';

const { Title } = Typography;

const unitColors: Record<string, string> = {
  'шт': 'blue',
  'м': 'green',
  'м2': 'cyan',
  'м3': 'purple',
  'кг': 'orange',
  'т': 'red',
  'л': 'magenta',
  'компл': 'volcano',
  'м.п.': 'geekblue',
};

const Nomenclatures: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('materials');

  const materialsTabRef = useRef<MaterialsTabRef>(null);
  const worksTabRef = useRef<WorksTabRef>(null);
  const unitsTabRef = useRef<UnitsTabRef>(null);

  const materials = useMaterials();
  const works = useWorks();
  const units = useUnits();

  useEffect(() => {
    materials.loadMaterials();
    works.loadWorks();
    units.loadUnits();
    units.loadUnitsList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredMaterialsData = materials.materialsData.filter(item =>
    searchText === '' || item.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const filteredWorksData = works.worksData.filter(item =>
    searchText === '' || item.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const filteredUnitsData = units.unitsData.filter(item =>
    searchText === '' ||
    item.name.toLowerCase().includes(searchText.toLowerCase()) ||
    item.code.toLowerCase().includes(searchText.toLowerCase())
  );

  const handlePageChange = (page: number, newPageSize: number) => {
    setCurrentPage(page);
    if (newPageSize !== pageSize) {
      setPageSize(newPageSize);
      setCurrentPage(1);
    }
  };

  const handleAddClick = () => {
    if (activeTab === 'materials') {
      materialsTabRef.current?.openAddModal();
    } else if (activeTab === 'works') {
      worksTabRef.current?.openAddModal();
    } else if (activeTab === 'units') {
      unitsTabRef.current?.openAddModal();
    }
  };

  const tabItems: TabsProps['items'] = [
    {
      key: 'materials',
      label: 'Материалы',
      children: (
        <MaterialsTab
          ref={materialsTabRef}
          data={filteredMaterialsData}
          loading={materials.loading}
          unitsList={units.unitsList}
          unitColors={unitColors}
          currentPage={currentPage}
          pageSize={pageSize}
          onDelete={materials.deleteMaterial}
          onSave={materials.saveMaterial}
          onPageChange={handlePageChange}
        />
      ),
    },
    {
      key: 'works',
      label: 'Работы',
      children: (
        <WorksTab
          ref={worksTabRef}
          data={filteredWorksData}
          loading={works.loading}
          unitsList={units.unitsList}
          unitColors={unitColors}
          currentPage={currentPage}
          pageSize={pageSize}
          onDelete={works.deleteWork}
          onSave={works.saveWork}
          onPageChange={handlePageChange}
        />
      ),
    },
    {
      key: 'units',
      label: 'Единицы измерения',
      children: (
        <UnitsTab
          ref={unitsTabRef}
          data={filteredUnitsData}
          loading={units.loading}
          unitColors={unitColors}
          currentPage={currentPage}
          pageSize={pageSize}
          onDelete={units.deleteUnit}
          onSave={units.saveUnit}
          onPageChange={handlePageChange}
        />
      ),
    },
  ];

  return (
    <div style={{ margin: '-16px', padding: '24px' }}>
      <Title level={4} style={{ margin: '0 0 16px 0' }}>
        Номенклатуры
      </Title>
      <Tabs
        defaultActiveKey="materials"
        items={tabItems}
        size="large"
        onChange={(key) => setActiveTab(key)}
        tabBarExtraContent={
          <Space>
            <Input
              placeholder="Поиск..."
              prefix={<SearchOutlined />}
              style={{ width: 200 }}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddClick}>
              Добавить
            </Button>
          </Space>
        }
      />
    </div>
  );
};

export default Nomenclatures;
