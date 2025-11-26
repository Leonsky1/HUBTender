/**
 * Хук для проверки консистентности коммерческих цен между страницами
 */

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

interface ConsistencyCheck {
  commerce: boolean;
  costs: boolean;
  financial: boolean;
  loading: boolean;
  error: string | null;
}

export const usePricingConsistency = (tenderId: string | undefined) => {
  const [consistencyCheck, setConsistencyCheck] = useState<ConsistencyCheck>({
    commerce: false,
    costs: false,
    financial: false,
    loading: false,
    error: null
  });

  useEffect(() => {
    if (!tenderId) {
      setConsistencyCheck({
        commerce: false,
        costs: false,
        financial: false,
        loading: false,
        error: null
      });
      return;
    }

    checkConsistency();
  }, [tenderId]);

  const checkConsistency = async () => {
    if (!tenderId) return;

    setConsistencyCheck(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Проверка 1: Commerce - наличие позиций с BOQ элементами
      const { data: positions, error: positionsError } = await supabase
        .from('client_positions')
        .select('id')
        .eq('tender_id', tenderId);

      if (positionsError) throw positionsError;

      // Проверяем что есть хотя бы одна позиция
      const hasPositions = positions && positions.length > 0;

      console.log('Проверка Commerce - позиций:', positions?.length || 0);
      const commerceCheck = hasPositions;

      // Проверка 2: Costs - наличие данных в construction_cost_volumes
      const { data: costVolumes, error: costsError } = await supabase
        .from('construction_cost_volumes')
        .select('volume')
        .eq('tender_id', tenderId)
        .gt('volume', 0);

      if (costsError) throw costsError;

      console.log('Проверка Costs - объёмы:', costVolumes);
      const costsCheck = costVolumes && costVolumes.length > 0;
      console.log('Результат проверки Costs:', costsCheck);

      // Проверка 3: Financial - наличие BOQ items с коммерческими ценами
      const { data: boqItems, error: boqError } = await supabase
        .from('boq_items')
        .select(`
          id,
          total_commercial_material_cost,
          total_commercial_work_cost,
          client_positions!inner(tender_id)
        `)
        .eq('client_positions.tender_id', tenderId);

      if (boqError) throw boqError;

      // Суммируем коммерческие стоимости из BOQ items
      const boqTotalMaterial = boqItems?.reduce((sum, item) => sum + (item.total_commercial_material_cost || 0), 0) || 0;
      const boqTotalWork = boqItems?.reduce((sum, item) => sum + (item.total_commercial_work_cost || 0), 0) || 0;
      const boqTotal = boqTotalMaterial + boqTotalWork;

      console.log('Проверка Financial - BOQ items:', boqItems?.length || 0);
      console.log('BOQ total:', boqTotal);
      const financialCheck = boqTotal > 0;

      console.log('=== Итоги проверки ===');
      console.log('Commerce (позиции):', commerceCheck ? 'OK' : 'Нет данных');
      console.log('Costs (объёмы работ):', costsCheck ? 'OK' : 'Нет данных');
      console.log('Financial (BOQ items):', financialCheck ? 'OK' : 'Нет данных');

      setConsistencyCheck({
        commerce: commerceCheck,
        costs: costsCheck,
        financial: financialCheck,
        loading: false,
        error: null
      });

    } catch (error: any) {
      console.error('Ошибка проверки консистентности:', error);
      setConsistencyCheck(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Ошибка проверки'
      }));
    }
  };

  return {
    consistencyCheck,
    recheckConsistency: checkConsistency
  };
};
