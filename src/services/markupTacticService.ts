/**
 * Сервис применения тактик наценок к элементам BOQ
 * Обеспечивает интеграцию между калькулятором наценок и базой данных
 */

import { supabase } from '../lib/supabase';
import type {
  BoqItem
} from '../lib/supabase';
import {
  calculateMarkupResult,
  validateMarkupSequence,
  type CalculationContext
} from '../utils/markupCalculator';

/**
 * Результат применения тактики
 */
export interface TacticApplicationResult {
  success: boolean;
  updatedCount?: number;
  errors?: string[];
  details?: {
    itemId: string;
    commercialCost: number;
    markupCoefficient: number;
    errors?: string[];
  }[];
}

/**
 * Загружает параметры наценок для тендера
 * @param tenderId ID тендера
 * @returns Map с параметрами наценок (ключ -> значение)
 */
export async function loadMarkupParameters(tenderId: string): Promise<Map<string, number>> {
  const parametersMap = new Map<string, number>();

  try {
    // Сначала загружаем все активные параметры с их значениями по умолчанию
    const { data: allParameters, error: paramsError } = await supabase
      .from('markup_parameters')
      .select('*')
      .eq('is_active', true)
      .order('order_num');

    if (paramsError) {
      console.error('Ошибка загрузки параметров:', paramsError);
      // Если таблица не существует, используем фоллбэк значения
      return getFallbackParameters();
    }

    // Заполняем Map значениями по умолчанию
    if (allParameters) {
      for (const param of allParameters) {
        parametersMap.set(param.key, param.default_value || 0);
      }
    }

    // Теперь загружаем конкретные значения для тендера
    const { data: tenderPercentages, error: percentagesError } = await supabase
      .from('tender_markup_percentage')
      .select(`
        value,
        markup_parameter:markup_parameter_id (
          key,
          label
        )
      `)
      .eq('tender_id', tenderId);

    if (percentagesError) {
      console.error('Ошибка загрузки процентов тендера:', percentagesError);
      // Продолжаем с дефолтными значениями
    } else if (tenderPercentages && tenderPercentages.length > 0) {
      // Обновляем Map значениями из тендера
      for (const percentage of tenderPercentages) {
        const param = percentage.markup_parameter as any;
        if (param && param.key) {
          parametersMap.set(param.key, percentage.value);
        }
      }
    }

    console.log('Загружены параметры наценок из БД:', {
      size: parametersMap.size,
      entries: Array.from(parametersMap.entries())
    });

    // Если параметров мало или нет, возвращаем фоллбэк
    if (parametersMap.size === 0) {
      console.warn('Параметры не найдены в БД, используем фоллбэк');
      return getFallbackParameters();
    }

    return parametersMap;

  } catch (error) {
    console.error('Критическая ошибка загрузки параметров:', error);
    return getFallbackParameters();
  }
}

/**
 * Возвращает фоллбэк параметры для случаев когда БД недоступна
 */
function getFallbackParameters(): Map<string, number> {
  const parametersMap = new Map<string, number>();

  // Базовые параметры для расчета коэффициентов
  parametersMap.set('mechanization_service', 5);
  parametersMap.set('mbp_gsm', 5);
  parametersMap.set('warranty_period', 5);
  parametersMap.set('works_16_markup', 60);
  parametersMap.set('works_cost_growth', 10);
  parametersMap.set('material_cost_growth', 10);
  parametersMap.set('subcontract_works_cost_growth', 10);
  parametersMap.set('subcontract_materials_cost_growth', 10);
  parametersMap.set('contingency_costs', 3);
  parametersMap.set('overhead_own_forces', 10);
  parametersMap.set('overhead_subcontract', 10);
  parametersMap.set('general_costs_without_subcontract', 20);
  parametersMap.set('profit_own_forces', 10);
  parametersMap.set('profit_subcontract', 16);

  console.log('Используются фоллбэк параметры наценок');
  return parametersMap;
}

/**
 * Применяет тактику наценки к одному элементу BOQ
 * @param itemId ID элемента BOQ
 * @param tacticId ID тактики наценок
 * @param markupParameters Параметры наценок (опционально, будут загружены если не переданы)
 * @returns Результат применения тактики
 */
export async function applyTacticToBoqItem(
  itemId: string,
  tacticId: string,
  markupParameters?: Map<string, number>
): Promise<TacticApplicationResult> {
  try {
    // Загружаем элемент BOQ
    const { data: boqItem, error: itemError } = await supabase
      .from('boq_items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (itemError || !boqItem) {
      return {
        success: false,
        errors: [`Элемент BOQ не найден: ${itemId}`]
      };
    }

    // Загружаем тактику наценок
    const { data: tactic, error: tacticError } = await supabase
      .from('markup_tactics')
      .select('*')
      .eq('id', tacticId)
      .single();

    if (tacticError || !tactic) {
      return {
        success: false,
        errors: [`Тактика наценок не найдена: ${tacticId}`]
      };
    }

    // Загружаем параметры наценок, если не переданы
    if (!markupParameters) {
      const { data: tender } = await supabase
        .from('tenders')
        .select('id')
        .eq('id', boqItem.tender_id)
        .single();

      if (!tender) {
        return {
          success: false,
          errors: ['Тендер не найден для элемента BOQ']
        };
      }

      markupParameters = await loadMarkupParameters(tender.id);
    }

    // Получаем последовательность операций для типа элемента
    const sequence = tactic.sequences[boqItem.boq_item_type];
    if (!sequence || sequence.length === 0) {
      return {
        success: false,
        errors: [`Отсутствует последовательность наценок для типа "${boqItem.boq_item_type}"`]
      };
    }

    // Валидируем последовательность
    const validationErrors = validateMarkupSequence(sequence);
    if (validationErrors.length > 0) {
      return {
        success: false,
        errors: validationErrors
      };
    }

    // Создаем контекст для расчета
    const context: CalculationContext = {
      baseAmount: boqItem.total_amount || 0,
      itemType: boqItem.boq_item_type,
      markupSequence: sequence,
      markupParameters,
      baseCost: tactic.base_costs?.[boqItem.boq_item_type]
    };

    // Выполняем расчет
    const result = calculateMarkupResult(context);

    // Определяем, какое поле обновлять в зависимости от типа
    const isMaterial = ['мат', 'суб-мат', 'мат-комп.'].includes(boqItem.boq_item_type);
    const updateData: any = {
      commercial_markup: result.markupCoefficient,
      updated_at: new Date().toISOString()
    };

    // Устанавливаем значение в нужное поле, остальное оставляем без изменений
    if (isMaterial) {
      updateData.total_commercial_material_cost = result.commercialCost;
    } else {
      updateData.total_commercial_work_cost = result.commercialCost;
    }

    // Обновляем элемент BOQ
    const { error: updateError } = await supabase
      .from('boq_items')
      .update(updateData)
      .eq('id', itemId);

    if (updateError) {
      return {
        success: false,
        errors: [`Ошибка обновления элемента: ${updateError.message}`]
      };
    }

    return {
      success: true,
      updatedCount: 1,
      details: [{
        itemId,
        commercialCost: result.commercialCost,
        markupCoefficient: result.markupCoefficient,
        errors: result.errors
      }]
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    return {
      success: false,
      errors: [`Ошибка применения тактики: ${errorMessage}`]
    };
  }
}

/**
 * Применяет тактику наценки ко всем элементам позиции заказчика
 * @param positionId ID позиции заказчика
 * @param tacticId ID тактики наценок
 * @returns Результат применения тактики
 */
export async function applyTacticToPosition(
  positionId: string,
  tacticId: string
): Promise<TacticApplicationResult> {
  try {
    // Загружаем все элементы позиции
    const { data: boqItems, error: itemsError } = await supabase
      .from('boq_items')
      .select('*')
      .eq('client_position_id', positionId)
      .order('sort_number');

    if (itemsError || !boqItems) {
      return {
        success: false,
        errors: [`Ошибка загрузки элементов позиции: ${itemsError?.message}`]
      };
    }

    if (boqItems.length === 0) {
      return {
        success: true,
        updatedCount: 0,
        errors: ['Нет элементов для обработки в позиции']
      };
    }

    // Загружаем тактику и параметры один раз для всех элементов
    const { data: tactic, error: tacticError } = await supabase
      .from('markup_tactics')
      .select('*')
      .eq('id', tacticId)
      .single();

    if (tacticError || !tactic) {
      return {
        success: false,
        errors: [`Тактика наценок не найдена: ${tacticId}`]
      };
    }

    // Получаем ID тендера из первого элемента
    const tenderId = boqItems[0].tender_id;
    const markupParameters = await loadMarkupParameters(tenderId);

    // Применяем тактику к каждому элементу
    const details: TacticApplicationResult['details'] = [];
    let successCount = 0;
    const errors: string[] = [];

    for (const item of boqItems) {
      try {
        // Получаем последовательность для типа элемента
        const sequence = tactic.sequences[item.boq_item_type];
        if (!sequence || sequence.length === 0) {
          errors.push(`Элемент ${item.id}: отсутствует последовательность для типа "${item.boq_item_type}"`);
          continue;
        }

        // Создаем контекст и выполняем расчет
        const context: CalculationContext = {
          baseAmount: item.total_amount || 0,
          itemType: item.boq_item_type,
          markupSequence: sequence,
          markupParameters,
          baseCost: tactic.base_costs?.[item.boq_item_type]
        };

        const result = calculateMarkupResult(context);

        // Определяем тип и обновляем
        const isMaterial = ['мат', 'суб-мат', 'мат-комп.'].includes(item.boq_item_type);
        const updateData: any = {
          commercial_markup: result.markupCoefficient,
          updated_at: new Date().toISOString()
        };

        // Устанавливаем значение в нужное поле
        if (isMaterial) {
          updateData.total_commercial_material_cost = result.commercialCost;
        } else {
          updateData.total_commercial_work_cost = result.commercialCost;
        }

        const { error: updateError } = await supabase
          .from('boq_items')
          .update(updateData)
          .eq('id', item.id);

        if (updateError) {
          errors.push(`Элемент ${item.id}: ${updateError.message}`);
        } else {
          successCount++;
          details?.push({
            itemId: item.id,
            commercialCost: result.commercialCost,
            markupCoefficient: result.markupCoefficient,
            errors: result.errors
          });
        }

      } catch (itemError) {
        const errorMessage = itemError instanceof Error ? itemError.message : 'Неизвестная ошибка';
        errors.push(`Элемент ${item.id}: ${errorMessage}`);
      }
    }

    // Обновляем итоги в client_positions
    await updatePositionTotals(positionId);

    return {
      success: successCount > 0,
      updatedCount: successCount,
      errors: errors.length > 0 ? errors : undefined,
      details
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    return {
      success: false,
      errors: [`Ошибка применения тактики к позиции: ${errorMessage}`]
    };
  }
}

/**
 * Применяет тактику наценки ко всем элементам тендера
 * @param tenderId ID тендера
 * @param tacticId ID тактики наценок (если не указан, используется тактика из тендера)
 * @returns Результат применения тактики
 */
export async function applyTacticToTender(
  tenderId: string,
  tacticId?: string
): Promise<TacticApplicationResult> {
  try {
    // Если тактика не указана, получаем ее из тендера
    if (!tacticId) {
      const { data: tender, error: tenderError } = await supabase
        .from('tenders')
        .select('markup_tactic_id')
        .eq('id', tenderId)
        .single();

      if (tenderError || !tender?.markup_tactic_id) {
        return {
          success: false,
          errors: ['У тендера не задана тактика наценок']
        };
      }

      tacticId = tender.markup_tactic_id;
    }

    // Загружаем все позиции тендера
    const { data: positions, error: positionsError } = await supabase
      .from('client_positions')
      .select('id')
      .eq('tender_id', tenderId);

    if (positionsError) {
      return {
        success: false,
        errors: [`Ошибка загрузки позиций: ${positionsError.message}`]
      };
    }

    if (!positions || positions.length === 0) {
      return {
        success: true,
        updatedCount: 0,
        errors: ['Нет позиций для обработки в тендере']
      };
    }

    // Применяем тактику к каждой позиции
    let totalUpdated = 0;
    const allErrors: string[] = [];
    const allDetails: TacticApplicationResult['details'] = [];

    for (const position of positions) {
      const result = await applyTacticToPosition(position.id!, tacticId);

      if (result.updatedCount) {
        totalUpdated += result.updatedCount;
      }

      if (result.errors) {
        allErrors.push(...result.errors.map(e => `Позиция ${position.id}: ${e}`));
      }

      if (result.details) {
        allDetails.push(...result.details);
      }
    }

    return {
      success: totalUpdated > 0,
      updatedCount: totalUpdated,
      errors: allErrors.length > 0 ? allErrors : undefined,
      details: allDetails
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    return {
      success: false,
      errors: [`Ошибка применения тактики к тендеру: ${errorMessage}`]
    };
  }
}

/**
 * Обновляет итоговые суммы в позиции заказчика
 * @param positionId ID позиции
 */
async function updatePositionTotals(positionId: string): Promise<void> {
  try {
    // Загружаем все элементы позиции
    const { data: boqItems, error } = await supabase
      .from('boq_items')
      .select('total_commercial_material_cost, total_commercial_work_cost')
      .eq('client_position_id', positionId);

    if (error || !boqItems) {
      console.error('Ошибка загрузки элементов для расчета итогов:', error);
      return;
    }

    // Суммируем коммерческие стоимости
    let totalCommercialMaterial = 0;
    let totalCommercialWork = 0;

    for (const item of boqItems) {
      totalCommercialMaterial += item.total_commercial_material_cost || 0;
      totalCommercialWork += item.total_commercial_work_cost || 0;
    }

    // Обновляем позицию
    const { error: updateError } = await supabase
      .from('client_positions')
      .update({
        total_commercial_material: totalCommercialMaterial,
        total_commercial_work: totalCommercialWork,
        updated_at: new Date().toISOString()
      })
      .eq('id', positionId);

    if (updateError) {
      console.error('Ошибка обновления итогов позиции:', updateError);
    }

  } catch (error) {
    console.error('Ошибка в updatePositionTotals:', error);
  }
}

/**
 * Пересчитывает коммерческие стоимости при изменении параметров наценок
 * @param tenderId ID тендера
 * @param changedParameterKey Ключ измененного параметра (опционально)
 * @returns Результат пересчета
 */
export async function recalculateAfterParameterChange(
  tenderId: string,
  changedParameterKey?: string
): Promise<TacticApplicationResult> {
  try {
    // Получаем тактику тендера
    const { data: tender, error: tenderError } = await supabase
      .from('tenders')
      .select('markup_tactic_id')
      .eq('id', tenderId)
      .single();

    if (tenderError || !tender?.markup_tactic_id) {
      return {
        success: false,
        errors: ['У тендера не задана тактика наценок']
      };
    }

    // Применяем тактику ко всему тендеру
    return await applyTacticToTender(tenderId, tender.markup_tactic_id);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    return {
      success: false,
      errors: [`Ошибка пересчета: ${errorMessage}`]
    };
  }
}

/**
 * Проверяет, нужен ли пересчет для элемента BOQ
 * @param item Элемент BOQ
 * @returns true, если нужен пересчет
 */
export function needsRecalculation(item: BoqItem): boolean {
  // Пересчет нужен, если:
  // 1. Есть базовая стоимость, но нет коммерческой
  // 2. Коэффициент наценки не соответствует отношению коммерческой к базовой стоимости

  if (!item.total_amount || item.total_amount === 0) {
    return false;
  }

  const isMaterial = ['мат', 'суб-мат', 'мат-комп.'].includes(item.boq_item_type);
  const commercialCost = isMaterial
    ? item.total_commercial_material_cost
    : item.total_commercial_work_cost;

  // Если коммерческая стоимость не задана
  if (!commercialCost) {
    return true;
  }

  // Проверяем соответствие коэффициента
  if (item.commercial_markup) {
    const expectedCost = item.total_amount * item.commercial_markup;
    const difference = Math.abs(expectedCost - commercialCost);

    // Если разница больше 0.01 (1 копейка), нужен пересчет
    return difference > 0.01;
  }

  return true;
}