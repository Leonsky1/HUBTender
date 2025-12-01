/**
 * Вкладка "Таблица результатов"
 */

import React from 'react';
import { ResultsTable } from './Results/ResultsTable';
import type { ClientPosition } from '../hooks';
import type { RedistributionResult } from '../utils';

interface BoqItemFull {
  id: string;
  client_position_id: string;
  detail_cost_category_id: string | null;
  boq_item_type: string;
  total_commercial_work_cost: number;
  total_commercial_material_cost: number;
}

interface TabResultsProps {
  clientPositions: ClientPosition[];
  redistributionResults: RedistributionResult[];
  boqItemsMap: Map<string, BoqItemFull>;
  loading?: boolean;
}

export const TabResults: React.FC<TabResultsProps> = ({
  clientPositions,
  redistributionResults,
  boqItemsMap,
  loading,
}) => {
  return (
    <div style={{ width: '100%' }}>
      <ResultsTable
        clientPositions={clientPositions}
        redistributionResults={redistributionResults}
        boqItemsMap={boqItemsMap}
        loading={loading}
      />
    </div>
  );
};
