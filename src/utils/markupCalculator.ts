/**
 * Модуль калькулятора наценок
 * Реализует логику расчета коммерческой стоимости на основе тактик наценок
 */

import type { MarkupStep, BoqItemType } from '../lib/supabase';

/**
 * Контекст для расчета наценок
 */
export interface CalculationContext {
  baseAmount: number; // Базовая стоимость из total_amount
  itemType: BoqItemType; // Тип элемента BOQ
  markupSequence: MarkupStep[]; // Последовательность операций наценок
  markupParameters: Map<string, number>; // Параметры наценок (ключ -> значение)
  baseCost?: number; // Базовая стоимость из тактики (если задана)
}

/**
 * Результат расчета наценки
 */
export interface CalculationResult {
  commercialCost: number; // Итоговая коммерческая стоимость
  markupCoefficient: number; // Итоговый коэффициент наценки
  stepResults: number[]; // Результаты каждого шага расчета
  errors?: string[]; // Ошибки расчета (если были)
}

/**
 * Тип операции
 */
type OperationType = 'multiply' | 'divide' | 'add' | 'subtract';

/**
 * Применяет последовательность операций наценок к базовой стоимости
 * @param context Контекст расчета
 * @returns Результат расчета коммерческой стоимости
 */
export function calculateMarkupResult(context: CalculationContext): CalculationResult {
  const { baseAmount, markupSequence, markupParameters, baseCost } = context;
  const errors: string[] = [];
  const stepResults: number[] = [];

  // DEBUG: Логирование входных данных
  console.log('calculateMarkupResult входные данные:', {
    baseAmount,
    baseCost,
    sequenceLength: markupSequence?.length,
    sequence: markupSequence,
    markupParametersSize: markupParameters?.size,
    markupParametersEntries: markupParameters ? Array.from(markupParameters.entries()) : []
  });

  // Проверяем наличие последовательности
  if (!markupSequence || !Array.isArray(markupSequence)) {
    console.error('markupSequence не является массивом:', markupSequence);
    return {
      commercialCost: baseAmount,
      markupCoefficient: 1,
      stepResults: [],
      errors: ['Последовательность операций не определена']
    };
  }

  if (markupSequence.length === 0) {
    console.log('markupSequence пустой массив');
    return {
      commercialCost: baseAmount,
      markupCoefficient: 1,
      stepResults: [],
      errors: ['Последовательность операций пуста']
    };
  }

  // Используем базовую стоимость из тактики или из элемента
  let currentAmount = baseCost ?? baseAmount;
  console.log('Начальная стоимость для расчета:', currentAmount);

  // Если базовая стоимость 0 или отрицательная, возвращаем ее без изменений
  if (currentAmount <= 0) {
    console.log('Базовая стоимость <= 0, возвращаем без расчета');
    return {
      commercialCost: currentAmount,
      markupCoefficient: 1,
      stepResults: [],
      errors: currentAmount < 0 ? ['Базовая стоимость отрицательная'] : []
    };
  }

  // Обрабатываем каждый шаг последовательности
  console.log(`Начинаем обработку ${markupSequence.length} шагов`);
  for (let i = 0; i < markupSequence.length; i++) {
    const step = markupSequence[i];
    console.log(`\nШаг ${i + 1}:`, {
      step,
      baseIndex: step.baseIndex,
      action1: step.action1,
      operand1Type: step.operand1Type,
      operand1Key: step.operand1Key
    });

    try {
      // Получаем базовое значение для этого шага
      const baseValue = getBaseValue(step.baseIndex, baseAmount, stepResults);
      console.log(`  Базовое значение: ${baseValue}`);

      // Применяем до 5 операций (если они определены)
      let stepResult = baseValue;

      // Операция 1 (обязательная)
      console.log(`  Получаем операнд1: тип=${step.operand1Type}, ключ=${step.operand1Key}`);
      const operand1 = getOperandValue(
        step.operand1Type,
        step.operand1Key,
        step.operand1Index,
        step.operand1MultiplyFormat,
        markupParameters,
        stepResults,
        baseAmount
      );
      console.log(`  Операнд1 = ${operand1}`);
      stepResult = applyOperation(stepResult, step.action1, operand1);
      console.log(`  Результат операции ${step.action1}: ${baseValue} ${step.action1} ${operand1} = ${stepResult}`);

      // Операция 2 (опциональная)
      if (step.action2 && step.operand2Type) {
        const operand2 = getOperandValue(
          step.operand2Type,
          step.operand2Key,
          step.operand2Index,
          step.operand2MultiplyFormat,
          markupParameters,
          stepResults,
          baseAmount
        );
        stepResult = applyOperation(stepResult, step.action2, operand2);
      }

      // Операция 3 (опциональная)
      if (step.action3 && step.operand3Type) {
        const operand3 = getOperandValue(
          step.operand3Type,
          step.operand3Key,
          step.operand3Index,
          step.operand3MultiplyFormat,
          markupParameters,
          stepResults,
          baseAmount
        );
        stepResult = applyOperation(stepResult, step.action3, operand3);
      }

      // Операция 4 (опциональная)
      if (step.action4 && step.operand4Type) {
        const operand4 = getOperandValue(
          step.operand4Type,
          step.operand4Key,
          step.operand4Index,
          step.operand4MultiplyFormat,
          markupParameters,
          stepResults,
          baseAmount
        );
        stepResult = applyOperation(stepResult, step.action4, operand4);
      }

      // Операция 5 (опциональная)
      if (step.action5 && step.operand5Type) {
        const operand5 = getOperandValue(
          step.operand5Type,
          step.operand5Key,
          step.operand5Index,
          step.operand5MultiplyFormat,
          markupParameters,
          stepResults,
          baseAmount
        );
        stepResult = applyOperation(stepResult, step.action5, operand5);
      }

      stepResults.push(stepResult);
      currentAmount = stepResult; // Последний результат становится итоговой стоимостью
      console.log(`  Шаг ${i + 1} завершен. Результат: ${stepResult}, Текущая стоимость: ${currentAmount}`);
      console.log(`  stepResults теперь:`, stepResults);

    } catch (error) {
      const errorMessage = `Ошибка в шаге ${i + 1}: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`;
      errors.push(errorMessage);
      console.error(errorMessage, { step, error, stackTrace: error instanceof Error ? error.stack : undefined });

      // Продолжаем расчет, используя предыдущее значение
      stepResults.push(currentAmount);
      console.log(`  После ошибки stepResults:`, stepResults);
    }
  }

  console.log(`\nЗавершена обработка шагов. Итоговая стоимость: ${currentAmount}, Всего шагов обработано: ${stepResults.length}`);

  // Рассчитываем итоговый коэффициент наценки
  const markupCoefficient = baseAmount > 0 ? currentAmount / baseAmount : 1;

  return {
    commercialCost: currentAmount,
    markupCoefficient,
    stepResults,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Получает базовое значение для шага
 * @param baseIndex Индекс базы (-1 для базовой стоимости, >= 0 для результата предыдущего шага)
 * @param baseAmount Базовая стоимость элемента
 * @param stepResults Результаты предыдущих шагов
 * @returns Базовое значение
 */
function getBaseValue(
  baseIndex: number,
  baseAmount: number,
  stepResults: number[]
): number {
  if (baseIndex === -1) {
    return baseAmount;
  }

  if (baseIndex >= 0 && baseIndex < stepResults.length) {
    return stepResults[baseIndex];
  }

  throw new Error(`Недопустимый baseIndex: ${baseIndex}. Доступно шагов: ${stepResults.length}`);
}

/**
 * Получает значение операнда
 * @param operandType Тип операнда
 * @param operandKey Ключ операнда (для markup или number)
 * @param operandIndex Индекс операнда (для step)
 * @param multiplyFormat Формат умножения (для markup)
 * @param markupParameters Параметры наценок
 * @param stepResults Результаты предыдущих шагов
 * @param baseAmount Базовая сумма (для operandIndex = -1)
 * @returns Значение операнда
 */
function getOperandValue(
  operandType?: 'markup' | 'step' | 'number',
  operandKey?: string | number,
  operandIndex?: number,
  multiplyFormat?: 'addOne' | 'direct',
  markupParameters?: Map<string, number>,
  stepResults?: number[],
  baseAmount?: number
): number {
  if (!operandType) {
    throw new Error('Не указан тип операнда');
  }

  switch (operandType) {
    case 'markup': {
      if (!operandKey || !markupParameters) {
        throw new Error('Не указан ключ наценки или отсутствуют параметры наценок');
      }

      const markupValue = markupParameters.get(String(operandKey));

      // Специальное логирование для material_cost_growth
      if (String(operandKey) === 'material_cost_growth') {
        console.log('🔍 ПРОВЕРКА material_cost_growth в getOperandValue:');
        console.log('  - Ключ запрошен:', operandKey);
        console.log('  - Значение из Map:', markupValue);
        console.log('  - Все параметры в Map:', Array.from(markupParameters.entries()));
      }

      if (markupValue === undefined) {
        console.error(`❌ Параметр "${operandKey}" НЕ НАЙДЕН в Map!`);
        console.error('Доступные параметры:', Array.from(markupParameters.keys()));
        throw new Error(`Параметр наценки "${operandKey}" не найден`);
      }

      // Применяем формат умножения
      if (multiplyFormat === 'addOne') {
        // Формат (1 + %): например, 10% становится 1.1
        const result = 1 + markupValue / 100;
        if (String(operandKey) === 'material_cost_growth') {
          console.log(`  - Формат: addOne, результат: ${result} (1 + ${markupValue}/100)`);
        }
        return result;
      } else {
        // Прямое значение: например, 10% становится 0.1
        const result = markupValue / 100;
        if (String(operandKey) === 'material_cost_growth') {
          console.log(`  - Формат: direct, результат: ${result} (${markupValue}/100)`);
        }
        return result;
      }
    }

    case 'step': {
      if (operandIndex === undefined || !stepResults) {
        throw new Error('Не указан индекс шага или отсутствуют результаты шагов');
      }

      // Специальный случай: -1 означает базовое значение (baseAmount)
      if (operandIndex === -1) {
        if (baseAmount === undefined) {
          throw new Error('Базовая сумма не передана для operandIndex = -1');
        }
        console.log(`  🔹 operandIndex = -1, возвращаем baseAmount = ${baseAmount}`);
        return baseAmount;
      }

      if (operandIndex < 0 || operandIndex >= stepResults.length) {
        throw new Error(`Недопустимый индекс шага: ${operandIndex}. Доступно шагов: ${stepResults.length}`);
      }

      return stepResults[operandIndex];
    }

    case 'number': {
      if (operandKey === undefined) {
        throw new Error('Не указано числовое значение');
      }

      return Number(operandKey);
    }

    default:
      throw new Error(`Неизвестный тип операнда: ${operandType}`);
  }
}

/**
 * Применяет операцию к базовому значению
 * @param baseValue Базовое значение
 * @param operation Операция
 * @param operandValue Значение операнда
 * @returns Результат операции
 */
function applyOperation(
  baseValue: number,
  operation: OperationType,
  operandValue: number
): number {
  switch (operation) {
    case 'multiply':
      return baseValue * operandValue;

    case 'divide':
      if (operandValue === 0) {
        throw new Error('Деление на ноль');
      }
      return baseValue / operandValue;

    case 'add':
      return baseValue + operandValue;

    case 'subtract':
      return baseValue - operandValue;

    default:
      throw new Error(`Неизвестная операция: ${operation}`);
  }
}

/**
 * Проверяет корректность последовательности наценок
 * @param sequence Последовательность операций
 * @returns Массив ошибок валидации (пустой, если все корректно)
 */
export function validateMarkupSequence(sequence: MarkupStep[]): string[] {
  const errors: string[] = [];

  for (let i = 0; i < sequence.length; i++) {
    const step = sequence[i];
    const stepNum = i + 1;

    // Проверка baseIndex
    if (step.baseIndex < -1 || step.baseIndex >= i) {
      errors.push(`Шаг ${stepNum}: недопустимый baseIndex (${step.baseIndex})`);
    }

    // Проверка обязательной первой операции
    if (!step.action1 || !step.operand1Type) {
      errors.push(`Шаг ${stepNum}: отсутствует обязательная первая операция`);
    }

    // Проверка операндов для типа 'step'
    if (step.operand1Type === 'step' && (step.operand1Index === undefined || step.operand1Index >= i)) {
      errors.push(`Шаг ${stepNum}: недопустимый operand1Index для типа 'step'`);
    }
    if (step.operand2Type === 'step' && (step.operand2Index === undefined || step.operand2Index >= i)) {
      errors.push(`Шаг ${stepNum}: недопустимый operand2Index для типа 'step'`);
    }
    if (step.operand3Type === 'step' && (step.operand3Index === undefined || step.operand3Index >= i)) {
      errors.push(`Шаг ${stepNum}: недопустимый operand3Index для типа 'step'`);
    }
    if (step.operand4Type === 'step' && (step.operand4Index === undefined || step.operand4Index >= i)) {
      errors.push(`Шаг ${stepNum}: недопустимый operand4Index для типа 'step'`);
    }
    if (step.operand5Type === 'step' && (step.operand5Index === undefined || step.operand5Index >= i)) {
      errors.push(`Шаг ${stepNum}: недопустимый operand5Index для типа 'step'`);
    }
  }

  return errors;
}

/**
 * Форматирует коммерческую стоимость для отображения
 * @param value Числовое значение
 * @param decimals Количество знаков после запятой (по умолчанию 2)
 * @returns Отформатированная строка
 */
export function formatCommercialCost(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

/**
 * Рассчитывает процент наценки
 * @param baseAmount Базовая стоимость
 * @param commercialCost Коммерческая стоимость
 * @returns Процент наценки
 */
export function calculateMarkupPercentage(baseAmount: number, commercialCost: number): number {
  if (baseAmount === 0) {
    return 0;
  }

  return ((commercialCost - baseAmount) / baseAmount) * 100;
}