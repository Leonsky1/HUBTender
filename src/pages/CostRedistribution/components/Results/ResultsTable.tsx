/**
 * Таблица результатов перераспределения
 */

import React, { useMemo } from 'react';
import { Table, Card, Statistic, Row, Col, Alert } from 'antd';
import { getResultsTableColumns, type ResultRow } from './ResultsTableColumns';
import type { ClientPosition } from '../../hooks';
import type { RedistributionResult } from '../../utils';

interface BoqItemFull {
  id: string;
  client_position_id: string;
  detail_cost_category_id: string | null;
  boq_item_type: string;
  total_commercial_work_cost: number;
  total_commercial_material_cost: number;
}

interface ResultsTableProps {
  clientPositions: ClientPosition[];
  redistributionResults: RedistributionResult[];
  boqItemsMap: Map<string, BoqItemFull>;
  loading?: boolean;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({
  clientPositions,
  redistributionResults,
  boqItemsMap,
  loading = false,
}) => {
  // Формируем Map результатов для быстрого доступа
  const resultsMap = useMemo(() => {
    const map = new Map<string, RedistributionResult>();
    for (const result of redistributionResults) {
      map.set(result.boq_item_id, result);
    }
    return map;
  }, [redistributionResults]);

  // Формируем строки таблицы
  const tableData = useMemo(() => {
    // Разделяем позиции на обычные и ДОП
    const regularPositions = clientPositions.filter(p => !p.is_additional);
    const additionalPositions = clientPositions.filter(p => p.is_additional);

    // Создаем Map для группировки ДОП позиций по родителям
    const additionalByParent = new Map<string, ClientPosition[]>();
    for (const addPos of additionalPositions) {
      if (addPos.parent_position_id) {
        if (!additionalByParent.has(addPos.parent_position_id)) {
          additionalByParent.set(addPos.parent_position_id, []);
        }
        additionalByParent.get(addPos.parent_position_id)!.push(addPos);
      }
    }

    // Функция определения конечности позиции по hierarchy_level
    const isLeafPosition = (index: number, positions: ClientPosition[]): boolean => {
      if (index === positions.length - 1) {
        return true;
      }

      const currentLevel = positions[index].hierarchy_level || 0;
      const nextLevel = positions[index + 1]?.hierarchy_level || 0;

      return currentLevel >= nextLevel;
    };

    // Функция создания строки результата
    const createResultRow = (position: ClientPosition, index: number, positions: ClientPosition[]): ResultRow => {
      // Получить все BOQ элементы для этой позиции
      const positionBoqItems = Array.from(boqItemsMap.entries())
        .filter(([_, item]) => item.client_position_id === position.id);

      // Суммируем материалы и работы
      let totalMaterials = 0;
      let totalWorksBefore = 0;
      let totalWorksAfter = 0;
      let totalRedistribution = 0;

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
            totalWorksBefore += result.original_work_cost;
            totalWorksAfter += result.final_work_cost;
            totalRedistribution += result.added_amount - result.deducted_amount;
          } else {
            // Работа НЕ участвовала в перераспределении - берем оригинальную стоимость
            totalWorksBefore += workCost;
            totalWorksAfter += workCost;
          }
        }
      }

      // Рассчитываем цену за единицу
      const quantity = position.manual_volume || position.volume || 1;
      const materialUnitPrice = totalMaterials / quantity;
      const workUnitPriceBefore = totalWorksBefore / quantity;
      const workUnitPriceAfter = totalWorksAfter / quantity;

      // Определяем конечность позиции по hierarchy_level
      const isLeaf = isLeafPosition(index, positions);

      return {
        key: position.id,
        position_id: position.id,
        position_number: position.position_number,
        section_number: position.section_number,
        position_name: position.position_name,
        item_no: position.item_no,
        work_name: position.work_name,
        client_volume: position.volume,
        manual_volume: position.manual_volume,
        unit_code: position.unit_code,
        material_unit_price: materialUnitPrice,
        work_unit_price_before: workUnitPriceBefore,
        work_unit_price_after: workUnitPriceAfter,
        total_materials: totalMaterials,
        total_works_before: totalWorksBefore,
        total_works_after: totalWorksAfter,
        redistribution_amount: totalRedistribution,
        manual_note: position.manual_note,
        isLeaf,
        is_additional: position.is_additional,
      };
    };

    // Формируем результат: сначала обычные позиции, под каждой - ее ДОП строки
    const result: ResultRow[] = [];
    for (let i = 0; i < regularPositions.length; i++) {
      const regularPos = regularPositions[i];
      result.push(createResultRow(regularPos, i, regularPositions));

      // Добавляем ДОП строки для этой позиции
      const additionals = additionalByParent.get(regularPos.id) || [];
      for (const addPos of additionals) {
        // ДОП строки всегда конечные
        result.push(createResultRow(addPos, 0, [addPos]));
      }
    }

    return result;
  }, [clientPositions, resultsMap, boqItemsMap]);

  // Итоги
  const totals = useMemo(() => {
    const totalMaterials = tableData.reduce((sum, row) => sum + row.total_materials, 0);
    const totalWorks = tableData.reduce((sum, row) => sum + row.total_works_after, 0);
    return {
      totalMaterials,
      totalWorks,
      total: totalMaterials + totalWorks,
    };
  }, [tableData]);

  if (redistributionResults.length === 0) {
    return (
      <Alert
        message="Результаты перераспределения отсутствуют"
        description="Выполните расчет на вкладке 'Настройка перераспределения'"
        type="info"
        showIcon
      />
    );
  }

  return (
    <div style={{ width: '100%' }}>
      <Table
        columns={getResultsTableColumns()}
        dataSource={tableData}
        loading={loading}
        bordered
        size="small"
        scroll={{ x: 1800, y: 'calc(100vh - 350px)' }}
        pagination={false}
      />
    </div>
  );
};
