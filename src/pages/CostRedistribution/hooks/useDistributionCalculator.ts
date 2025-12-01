/**
 * Хук для управления расчетом перераспределения
 */

import { useState, useCallback, useMemo } from 'react';
import { message } from 'antd';
import type { SourceRule, TargetCost, BoqItemWithCosts, RedistributionResult } from '../utils';
import { calculateRedistribution } from '../utils';
import { validateRedistributionRules, getErrorMessages } from '../utils';

export interface CalculationState {
  results: RedistributionResult[];
  totalDeducted: number;
  totalAdded: number;
  isBalanced: boolean;
  isCalculated: boolean;
}

export function useDistributionCalculator(
  boqItems: BoqItemWithCosts[],
  sourceRules: SourceRule[],
  targetCosts: TargetCost[],
  detailCategoriesMap?: Map<string, string> // detail_cost_category_id -> cost_category_id
) {
  const [calculationState, setCalculationState] = useState<CalculationState>({
    results: [],
    totalDeducted: 0,
    totalAdded: 0,
    isBalanced: false,
    isCalculated: false,
  });

  // Выполнить расчет
  const calculate = useCallback(() => {
    // Валидация правил
    const validation = validateRedistributionRules(sourceRules, targetCosts);

    if (!validation.isValid) {
      const errorMessages = getErrorMessages(validation.errors);
      errorMessages.forEach(msg => message.error(msg));
      return false;
    }

    // Проверка наличия данных
    if (boqItems.length === 0) {
      message.warning('Нет данных для расчета. Выберите тендер.');
      return false;
    }

    try {
      console.log('🔄 Начало расчета перераспределения...');
      console.log('📊 BOQ элементов:', boqItems.length);
      console.log('📋 Правил вычитания:', sourceRules.length);
      console.log('🎯 Целевых затрат:', targetCosts.length);

      const result = calculateRedistribution(boqItems, sourceRules, targetCosts, detailCategoriesMap);

      console.log('✅ Расчет завершен');
      console.log('💰 Вычтено:', result.totalDeducted);
      console.log('💰 Добавлено:', result.totalAdded);
      console.log('⚖️ Баланс:', result.isBalanced ? 'OK' : 'Не сошелся');

      setCalculationState({
        results: result.results,
        totalDeducted: result.totalDeducted,
        totalAdded: result.totalAdded,
        isBalanced: result.isBalanced,
        isCalculated: true,
      });

      if (!result.isBalanced) {
        message.warning('Предупреждение: баланс не сошелся');
      } else {
        message.success('Расчет выполнен успешно');
      }

      return true;
    } catch (error) {
      console.error('Ошибка расчета:', error);
      message.error('Ошибка при выполнении расчета');
      return false;
    }
  }, [boqItems, sourceRules, targetCosts, detailCategoriesMap]);

  // Очистить результаты
  const clearResults = useCallback(() => {
    setCalculationState({
      results: [],
      totalDeducted: 0,
      totalAdded: 0,
      isBalanced: false,
      isCalculated: false,
    });
  }, []);

  // Установить результаты из БД
  const setResults = useCallback((results: RedistributionResult[]) => {
    // Рассчитать totalDeducted и totalAdded из results
    const totalDeducted = results.reduce((sum, r) => sum + r.deducted_amount, 0);
    const totalAdded = results.reduce((sum, r) => sum + r.added_amount, 0);
    const isBalanced = Math.abs(totalDeducted - totalAdded) < 0.01;

    setCalculationState({
      results,
      totalDeducted,
      totalAdded,
      isBalanced,
      isCalculated: true,
    });
  }, []);

  // Проверка готовности к расчету
  const canCalculate = useMemo(() => {
    return (
      boqItems.length > 0 &&
      sourceRules.length > 0 &&
      targetCosts.length > 0
    );
  }, [boqItems.length, sourceRules.length, targetCosts.length]);

  return {
    calculationState,
    calculate,
    clearResults,
    setResults,
    canCalculate,
  };
}
