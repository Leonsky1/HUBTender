/**
 * Страница перераспределения стоимости работ
 */

import React, { useMemo, useEffect } from 'react';
import { Tabs, message } from 'antd';
import { RedistributionHeader } from './components/RedistributionHeader';
import { TabSetup } from './components/TabSetup';
import { TabResults } from './components/TabResults';
import {
  useSourceRules,
  useTargetCosts,
  useRedistributionData,
  useCostCategories,
  useDistributionCalculator,
  useSaveResults,
} from './hooks';
import { calculateRedistribution } from './utils';

const CostRedistribution: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('setup');

  // Хуки для управления данными
  const {
    loading,
    tenders,
    selectedTenderId,
    setSelectedTenderId,
    markupTactics,
    selectedTacticId,
    handleTacticChange,
    boqItems,
    clientPositions,
  } = useRedistributionData();

  const { categories, detailCategories } = useCostCategories();

  // Создаем Map для быстрого поиска category_id по detail_cost_category_id
  const detailCategoriesMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const detail of detailCategories) {
      map.set(detail.id, detail.cost_category_id);
    }
    return map;
  }, [detailCategories]);

  const { sourceRules, addRule, removeRule, clearRules, setRules } = useSourceRules();

  const { targetCosts, addTarget, removeTarget, clearTargets, setTargets } = useTargetCosts();

  const { calculationState, calculate, clearResults, setResults, canCalculate } = useDistributionCalculator(
    boqItems,
    sourceRules,
    targetCosts,
    detailCategoriesMap
  );

  const { saving, saveResults, loadSavedResults } = useSaveResults();

  // Формируем Map для быстрого доступа к BOQ элементам
  const boqItemsMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const item of boqItems) {
      map.set(item.id, item);
    }
    return map;
  }, [boqItems]);

  // Формируем Map результатов для быстрого доступа
  const resultsMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const result of calculationState.results) {
      map.set(result.boq_item_id, result);
    }
    return map;
  }, [calculationState.results]);

  // Рассчитываем итоги для статистики
  const totals = useMemo(() => {
    let totalMaterials = 0;
    let totalWorks = 0;

    for (const position of clientPositions) {
      // Получить все BOQ элементы для этой позиции
      const positionBoqItems = Array.from(boqItemsMap.entries())
        .filter(([_, item]) => item.client_position_id === position.id);

      for (const [boqItemId, boqItem] of positionBoqItems) {
        // Материалы - учитываем стоимость материалов
        const materialCost = boqItem.total_commercial_material_cost || 0;
        if (materialCost > 0) {
          totalMaterials += materialCost;
        }

        // Работы - учитываем стоимость работ из ВСЕХ элементов, которые имеют work_cost > 0
        // BOQ элемент может иметь ОДНОВРЕМЕННО и material_cost и work_cost
        const workCost = boqItem.total_commercial_work_cost || 0;
        if (workCost > 0) {
          const result = resultsMap.get(boqItemId);
          if (result) {
            // Работа участвовала в перераспределении
            totalWorks += result.final_work_cost;
          } else {
            // Работа НЕ участвовала в перераспределении - берем оригинальную стоимость
            totalWorks += workCost;
          }
        }
      }
    }

    return {
      totalMaterials,
      totalWorks,
      total: totalMaterials + totalWorks,
    };
  }, [clientPositions, resultsMap, boqItemsMap]);

  // Загрузка сохраненных результатов при выборе тендера и тактики
  useEffect(() => {
    const loadResults = async () => {
      if (!selectedTenderId || !selectedTacticId) {
        // Очистить при сбросе выбора
        clearRules();
        clearTargets();
        clearResults();
        return;
      }

      try {
        console.log('🔄 Загрузка сохраненных результатов...');
        const savedData = await loadSavedResults(selectedTenderId, selectedTacticId);

        if (savedData && savedData.length > 0) {
          console.log('✅ Найдены сохраненные результаты:', savedData.length);

          // Восстановить результаты
          const results = savedData.map(item => ({
            boq_item_id: item.boq_item_id,
            original_work_cost: item.original_work_cost,
            deducted_amount: item.deducted_amount,
            added_amount: item.added_amount,
            final_work_cost: item.final_work_cost,
          }));
          setResults(results);

          // Восстановить rules и targets из первой записи (все имеют одинаковые правила)
          const redistributionRules = savedData[0].redistribution_rules as any;
          if (redistributionRules) {
            if (redistributionRules.deductions) {
              setRules(redistributionRules.deductions);
            }
            if (redistributionRules.targets) {
              setTargets(redistributionRules.targets);
            }
          }

          // Переключить на вкладку результатов
          setActiveTab('results');
          message.success('Загружены сохраненные результаты');
        } else {
          console.log('ℹ️ Сохраненных результатов не найдено');
          // Очистить при отсутствии данных
          clearRules();
          clearTargets();
          clearResults();
          setActiveTab('setup');
        }
      } catch (error) {
        console.error('Ошибка загрузки сохраненных результатов:', error);
      }
    };

    loadResults();
  }, [selectedTenderId, selectedTacticId, loadSavedResults, setResults, setRules, setTargets, clearRules, clearTargets, clearResults]);

  // Обработчики
  const handleGoToResults = async () => {
    if (!selectedTenderId || !selectedTacticId) {
      message.warning('Выберите тендер и схему наценок');
      return;
    }

    if (!canCalculate) {
      message.warning('Добавьте правила вычитания и целевые затраты');
      return;
    }

    try {
      // 1. Вызвать calculate() для обновления UI state
      const success = calculate();
      if (!success) {
        return;
      }

      // 2. Рассчитать результаты напрямую для сохранения
      const result = calculateRedistribution(boqItems, sourceRules, targetCosts, detailCategoriesMap);

      // 3. Сохранить результаты
      await saveResults(
        selectedTenderId,
        selectedTacticId,
        result.results,
        sourceRules,
        targetCosts
      );

      // 4. Переключить вкладку
      setActiveTab('results');
    } catch (error) {
      console.error('Ошибка при переходе к результатам:', error);
      message.error('Не удалось выполнить расчет и сохранение');
    }
  };

  const handleClear = () => {
    clearRules();
    clearTargets();
    clearResults();
  };

  const handleExport = () => {
    if (!selectedTenderId) {
      return;
    }

    const selectedTender = tenders.find(t => t.id === selectedTenderId);

    if (!selectedTender) {
      return;
    }

    // Импортируем функцию экспорта
    import('./utils/exportToExcel').then(({ exportRedistributionToExcel }) => {
      exportRedistributionToExcel({
        clientPositions,
        redistributionResults: calculationState.results,
        boqItemsMap,
        tenderTitle: `${selectedTender.title} (v${selectedTender.version})`,
      });
    });
  };

  // Элементы вкладок
  const tabItems = [
    {
      key: 'setup',
      label: 'Настройка перераспределения',
      children: (
        <TabSetup
          categories={categories}
          detailCategories={detailCategories}
          sourceRules={sourceRules}
          targetCosts={targetCosts}
          onAddRule={addRule}
          onRemoveRule={removeRule}
          onAddTarget={addTarget}
          onRemoveTarget={removeTarget}
          totalDeduction={calculationState.totalDeducted}
          canCalculate={canCalculate}
          isCalculated={calculationState.isCalculated}
          saving={saving}
          onGoToResults={handleGoToResults}
          onClear={handleClear}
        />
      ),
    },
    {
      key: 'results',
      label: 'Таблица результатов',
      children: (
        <TabResults
          clientPositions={clientPositions}
          redistributionResults={calculationState.results}
          boqItemsMap={boqItemsMap}
          loading={loading}
        />
      ),
    },
  ];

  return (
    <div style={{ padding: '0 8px' }}>
      <RedistributionHeader
        tenders={tenders}
        selectedTenderId={selectedTenderId}
        onTenderChange={setSelectedTenderId}
        markupTactics={markupTactics}
        selectedTacticId={selectedTacticId}
        onTacticChange={handleTacticChange}
        loading={loading}
        totals={totals}
        hasResults={calculationState.results.length > 0}
        onExport={handleExport}
      />

      <Tabs
        items={tabItems}
        activeKey={activeTab}
        onChange={setActiveTab}
      />
    </div>
  );
};

export default CostRedistribution;
