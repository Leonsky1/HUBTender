/**
 * Хук для сохранения результатов перераспределения в базу данных
 */

import { useState, useCallback } from 'react';
import { message } from 'antd';
import { supabase } from '../../../lib/supabase';
import type { RedistributionResult, SourceRule, TargetCost } from '../utils';
import type { CostRedistributionResultInsert, RedistributionRule } from '../../../lib/supabase';

export function useSaveResults() {
  const [saving, setSaving] = useState(false);

  const saveResults = useCallback(
    async (
      tenderId: string,
      tacticId: string,
      results: RedistributionResult[],
      sourceRules: SourceRule[],
      targetCosts: TargetCost[]
    ): Promise<boolean> => {
      if (!tenderId || !tacticId) {
        message.error('Не выбран тендер или тактика наценок');
        return false;
      }

      if (results.length === 0) {
        message.error('Нет результатов для сохранения');
        return false;
      }

      setSaving(true);
      try {
        console.log('🔄 Сохранение результатов перераспределения...');
        console.log('📊 Результатов:', results.length);

        // Получить текущего пользователя (опционально)
        const { data: { user } } = await supabase.auth.getUser();

        // Формируем JSONB с правилами перераспределения
        const redistribution_rules: RedistributionRule = {
          deductions: sourceRules.map(rule => ({
            level: rule.level,
            category_id: rule.category_id,
            detail_cost_category_id: rule.detail_cost_category_id,
            category_name: rule.category_name,
            percentage: rule.percentage,
          })),
          targets: targetCosts.map(target => ({
            level: target.level,
            category_id: target.category_id,
            detail_cost_category_id: target.detail_cost_category_id,
            category_name: target.category_name,
          })),
        };

        // Формируем массив записей для вставки
        const records: CostRedistributionResultInsert[] = results.map(result => ({
          tender_id: tenderId,
          markup_tactic_id: tacticId,
          boq_item_id: result.boq_item_id,
          original_work_cost: result.original_work_cost,
          deducted_amount: result.deducted_amount,
          added_amount: result.added_amount,
          final_work_cost: result.final_work_cost,
          redistribution_rules,
          created_by: user?.id || null,
        }));

        // Удаляем старые результаты для этого тендера и тактики
        const { error: deleteError } = await supabase
          .from('cost_redistribution_results')
          .delete()
          .eq('tender_id', tenderId)
          .eq('markup_tactic_id', tacticId);

        if (deleteError) {
          console.error('Ошибка удаления старых результатов:', deleteError);
          throw deleteError;
        }

        // Вставляем новые результаты
        const { error: insertError } = await supabase
          .from('cost_redistribution_results')
          .insert(records);

        if (insertError) {
          console.error('Ошибка вставки новых результатов:', insertError);
          throw insertError;
        }

        console.log('✅ Результаты успешно сохранены');
        message.success('Результаты перераспределения сохранены');
        return true;
      } catch (error) {
        console.error('Ошибка сохранения результатов:', error);
        message.error('Не удалось сохранить результаты');
        return false;
      } finally {
        setSaving(false);
      }
    },
    []
  );

  const loadSavedResults = useCallback(
    async (tenderId: string, tacticId: string) => {
      if (!tenderId || !tacticId) {
        return null;
      }

      try {
        console.log('🔄 Загрузка сохраненных результатов...');

        const { data, error } = await supabase
          .from('cost_redistribution_results')
          .select('*')
          .eq('tender_id', tenderId)
          .eq('markup_tactic_id', tacticId);

        if (error) throw error;

        if (data && data.length > 0) {
          console.log('✅ Загружено сохраненных результатов:', data.length);
          return data;
        }

        return null;
      } catch (error) {
        console.error('Ошибка загрузки сохраненных результатов:', error);
        return null;
      }
    },
    []
  );

  return {
    saving,
    saveResults,
    loadSavedResults,
  };
}
