import React, { useState, useEffect } from 'react';
import { Tabs, message, Modal, Form, Input, Button, Space, App } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { supabase, Tender } from '../../../lib/supabase';
import { TabKey } from './types';
import { TAB_LABELS } from './constants';
import {
  useMarkupTactics,
  useMarkupParameters,
  useMarkupSequences,
  usePricingDistribution,
} from './hooks';
import {
  TacticsList,
  TacticEditorHeader,
  SequenceTab,
  BasePercentagesTab,
  PricingTab,
} from './components';
import { MarkupConstructorProvider } from './MarkupConstructorContext';
import './MarkupConstructor.css';

const MarkupConstructor: React.FC = () => {
  const { modal } = App.useApp();

  // Основные состояния
  const [, setTenders] = useState<Tender[]>([]);
  const [selectedTenderId, setSelectedTenderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('раб');
  const [isTacticSelected, setIsTacticSelected] = useState(false);
  const [isAddParameterModalOpen, setIsAddParameterModalOpen] = useState(false);
  const [newParameterForm] = Form.useForm();
  const [markupForm] = Form.useForm();

  // Хуки
  const tacticsHook = useMarkupTactics();
  const parametersHook = useMarkupParameters();
  const sequencesHook = useMarkupSequences();
  const pricingHook = usePricingDistribution();

  // Загрузка данных при монтировании
  useEffect(() => {
    fetchTenders();
    parametersHook.fetchParameters(); // Загружаем глобальный справочник параметров
  }, []);

  // Загрузка тактик при выборе тендера
  useEffect(() => {
    if (selectedTenderId) {
      tacticsHook.fetchTactics(selectedTenderId);
      pricingHook.fetchPricingDistribution(selectedTenderId);
    }
  }, [selectedTenderId]);


  const fetchTenders = async () => {
    try {
      const { data, error } = await supabase
        .from('tenders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTenders(data || []);

      if (data && data.length > 0) {
        setSelectedTenderId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching tenders:', error);
      message.error('Не удалось загрузить список тендеров');
    }
  };

  const handleCreateNewTactic = () => {
    tacticsHook.setCurrentTacticId(null);
    tacticsHook.setCurrentTacticName('Новая схема наценок');
    sequencesHook.resetSequences();
    setIsTacticSelected(true);
    message.info('Создается новая схема наценок');
  };

  const handleSelectTactic = async (tacticId: string) => {
    try {
      const { data, error } = await supabase
        .from('markup_tactics')
        .select('*')
        .eq('id', tacticId)
        .single();

      if (error) throw error;

      if (data) {
        tacticsHook.setCurrentTacticId(data.id);
        tacticsHook.setCurrentTacticName(data.name || 'Без названия');
        tacticsHook.setSelectedTacticId(data.id);

        // Загрузка последовательностей из БД
        if (data.sequences) {
          sequencesHook.setMarkupSequences(data.sequences);
        }

        setIsTacticSelected(true);
      }
    } catch (error) {
      console.error('Error loading tactic:', error);
      message.error('Ошибка загрузки схемы наценок');
    }
  };

  const handleBackToList = () => {
    setIsTacticSelected(false);
    tacticsHook.setCurrentTacticId(null);
    tacticsHook.setCurrentTacticName('');
    sequencesHook.resetSequences();
  };

  const handleSaveTactic = async () => {
    if (!selectedTenderId) {
      message.error('Не выбран тендер');
      return;
    }

    if (!tacticsHook.currentTacticName.trim()) {
      message.error('Введите название схемы');
      return;
    }

    try {
      const tacticData = {
        tender_id: selectedTenderId,
        name: tacticsHook.currentTacticName,
        sequences: sequencesHook.markupSequences,
        base_costs: { works: 0, materials: 0, subcontract_works: 0, subcontract_materials: 0, work_comp: 0, material_comp: 0 },
      };

      if (tacticsHook.currentTacticId) {
        // Обновление существующей тактики
        const { error } = await supabase
          .from('markup_tactics')
          .update(tacticData)
          .eq('id', tacticsHook.currentTacticId);

        if (error) throw error;
        message.success('Схема наценок обновлена');
      } else {
        // Создание новой тактики
        const { data, error } = await supabase
          .from('markup_tactics')
          .insert(tacticData)
          .select()
          .single();

        if (error) throw error;

        tacticsHook.setCurrentTacticId(data.id);
        message.success('Схема наценок создана');
      }

      await tacticsHook.fetchTactics(selectedTenderId);
    } catch (error) {
      console.error('Error saving tactic:', error);
      message.error('Ошибка сохранения схемы наценок');
    }
  };

  const handleCopyTactic = () => {
    if (!tacticsHook.currentTacticId) return;

    modal.confirm({
      title: 'Копировать схему наценок?',
      content: `Будет создана копия схемы "${tacticsHook.currentTacticName}"`,
      okText: 'Копировать',
      cancelText: 'Отмена',
      onOk: async () => {
        await tacticsHook.copyTactic(
          tacticsHook.currentTacticId!,
          selectedTenderId,
          (newTacticId) => handleSelectTactic(newTacticId)
        );
      },
    });
  };

  const handleDeleteTactic = () => {
    if (!tacticsHook.currentTacticId) return;

    modal.confirm({
      title: 'Удалить схему наценок?',
      content: `Вы действительно хотите удалить схему "${tacticsHook.currentTacticName}"?`,
      okText: 'Удалить',
      cancelText: 'Отмена',
      okButtonProps: { danger: true },
      onOk: async () => {
        await tacticsHook.deleteTactic(tacticsHook.currentTacticId!, selectedTenderId);
        handleBackToList();
      },
    });
  };

  const handleAddParameter = async () => {
    try {
      const values = await newParameterForm.validateFields();

      // Генерируем уникальный key из label (в snake_case)
      const key = values.parameterLabel
        .toLowerCase()
        .replace(/[^a-zа-яё0-9\s]/gi, '')
        .replace(/\s+/g, '_');

      await parametersHook.addParameter({
        key: key,
        label: values.parameterLabel,
        default_value: 0,
      });

      newParameterForm.resetFields();
      setIsAddParameterModalOpen(false);
    } catch (error) {
      console.error('Error adding parameter:', error);
    }
  };

  const handleSavePricing = async () => {
    if (!selectedTenderId || !pricingHook.pricingDistribution) {
      message.error('Выберите тендер и настройте распределение');
      return;
    }

    await pricingHook.savePricingDistribution(
      selectedTenderId,
      pricingHook.pricingDistribution
    );
  };

  const handleResetPricing = () => {
    modal.confirm({
      title: 'Сбросить настройки к умолчанию?',
      content: 'Все текущие настройки распределения будут сброшены',
      okText: 'Сбросить',
      cancelText: 'Отмена',
      onOk: () => {
        pricingHook.setPricingDistribution(null);
        message.info('Настройки сброшены к значениям по умолчанию');
      },
    });
  };

  return (
    <div style={{ minHeight: '100%', overflow: 'visible' }} className="markup-constructor">
      <Tabs
        defaultActiveKey="tactics"
        items={[
          {
            key: 'tactics',
            label: 'Порядок применения наценок',
            children: (
              <div style={{ minHeight: '100%', overflow: 'visible' }}>
                {!isTacticSelected ? (
                  <TacticsList
                    tactics={tacticsHook.tactics}
                    loading={tacticsHook.loadingTactics}
                    searchText={tacticsHook.tacticSearchText}
                    onSearchChange={tacticsHook.setTacticSearchText}
                    onCreateNew={handleCreateNewTactic}
                    onSelectTactic={handleSelectTactic}
                  />
                ) : (
                  <MarkupConstructorProvider
                    value={{
                      tactics: tacticsHook,
                      parameters: parametersHook,
                      sequences: sequencesHook,
                      pricing: pricingHook,
                      form: markupForm,
                    }}
                  >
                    <div>
                      <TacticEditorHeader
                        currentTacticName={tacticsHook.currentTacticName}
                        isEditingName={tacticsHook.isEditingName}
                        editingName={tacticsHook.editingName}
                        canDelete={!!tacticsHook.currentTacticId}
                        onBackToList={handleBackToList}
                        onStartEditingName={() =>
                          tacticsHook.startEditingName(tacticsHook.currentTacticName)
                        }
                        onSaveName={tacticsHook.saveEditingName}
                        onCancelEditingName={tacticsHook.cancelEditingName}
                        onEditingNameChange={tacticsHook.setEditingName}
                        onCopyTactic={handleCopyTactic}
                        onDeleteTactic={handleDeleteTactic}
                        onSaveTactic={handleSaveTactic}
                      />

                      <Tabs
                        activeKey={activeTab}
                        onChange={(key) => setActiveTab(key as TabKey)}
                        style={{ overflow: 'visible', marginTop: 16 }}
                        items={Object.entries(TAB_LABELS).map(([key, label]) => ({
                          key,
                          label,
                          children: (
                            <SequenceTab
                              tabKey={key as TabKey}
                            />
                          ),
                        }))}
                      />
                    </div>
                  </MarkupConstructorProvider>
                )}
              </div>
            ),
          },
          {
            key: 'base_percentages',
            label: 'Базовые проценты',
            children: (
              <BasePercentagesTab
                markupParameters={parametersHook.markupParameters}
                editingParameterId={parametersHook.editingParameterId}
                editingParameterLabel={parametersHook.editingParameterLabel}
                onAddParameter={() => setIsAddParameterModalOpen(true)}
                onDeleteParameter={parametersHook.deleteParameter}
                onReorderParameter={parametersHook.reorderParameters}
                onStartEditingParameter={parametersHook.startEditingParameter}
                onSaveEditingParameter={parametersHook.saveEditingParameter}
                onCancelEditingParameter={parametersHook.cancelEditingParameter}
                onEditingParameterLabelChange={parametersHook.setEditingParameterLabel}
              />
            ),
          },
          {
            key: 'pricing',
            label: 'Ценообразование',
            children: (
              <PricingTab
                loading={pricingHook.loadingPricing}
                saving={pricingHook.savingPricing}
                onSave={handleSavePricing}
                onReset={handleResetPricing}
              />
            ),
          },
        ]}
      />

      {/* Модальное окно для добавления нового параметра */}
      <Modal
        title="Добавление нового параметра наценки"
        open={isAddParameterModalOpen}
        onCancel={() => {
          setIsAddParameterModalOpen(false);
          newParameterForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={newParameterForm} layout="vertical">
          <Form.Item
            label="Название параметра"
            name="parameterLabel"
            rules={[{ required: true, message: 'Введите название параметра' }]}
          >
            <Input placeholder="Например: Наценка на материалы" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddParameter}>
                Добавить
              </Button>
              <Button
                onClick={() => {
                  setIsAddParameterModalOpen(false);
                  newParameterForm.resetFields();
                }}
              >
                Отмена
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MarkupConstructor;
