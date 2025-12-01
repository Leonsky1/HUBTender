/**
 * Утилиты для валидации правил перераспределения
 */

import type { SourceRule, TargetCost } from './calculateDistribution';

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Валидация списка правил вычитания
 */
export function validateSourceRules(sourceRules: SourceRule[]): ValidationError[] {
  const errors: ValidationError[] = [];

  if (sourceRules.length === 0) {
    errors.push({
      field: 'sourceRules',
      message: 'Необходимо добавить хотя бы одно правило вычитания',
    });
    return errors;
  }

  for (let i = 0; i < sourceRules.length; i++) {
    const rule = sourceRules[i];

    // Проверка процента
    if (rule.percentage <= 0) {
      errors.push({
        field: `sourceRules[${i}].percentage`,
        message: `Процент вычета должен быть больше 0`,
      });
    }

    if (rule.percentage > 100) {
      errors.push({
        field: `sourceRules[${i}].percentage`,
        message: `Процент вычета не может быть больше 100`,
      });
    }

    // Проверка наличия категории
    if (!rule.detail_cost_category_id && !rule.category_id) {
      errors.push({
        field: `sourceRules[${i}].category`,
        message: `Необходимо выбрать затрату на строительство`,
      });
    }
  }

  // Проверка на дубликаты категорий
  const categoryKeys = sourceRules.map((rule) =>
    rule.level === 'category' ? `cat_${rule.category_id}` : `det_${rule.detail_cost_category_id}`
  );
  const duplicates = categoryKeys.filter(
    (key, index) => categoryKeys.indexOf(key) !== index
  );

  if (duplicates.length > 0) {
    errors.push({
      field: 'sourceRules',
      message: 'Обнаружены дублирующиеся затраты. Каждая затрата может использоваться только один раз.',
    });
  }

  return errors;
}

/**
 * Валидация списка целевых затрат
 */
export function validateTargetCosts(targetCosts: TargetCost[]): ValidationError[] {
  const errors: ValidationError[] = [];

  if (targetCosts.length === 0) {
    errors.push({
      field: 'targetCosts',
      message: 'Необходимо добавить хотя бы одну целевую затрату',
    });
    return errors;
  }

  for (let i = 0; i < targetCosts.length; i++) {
    const target = targetCosts[i];

    // Проверка наличия категории
    if (!target.detail_cost_category_id && !target.category_id) {
      errors.push({
        field: `targetCosts[${i}].category`,
        message: `Необходимо выбрать затрату на строительство`,
      });
    }
  }

  // Проверка на дубликаты категорий
  const categoryKeys = targetCosts.map((target) =>
    target.level === 'category' ? `cat_${target.category_id}` : `det_${target.detail_cost_category_id}`
  );
  const duplicates = categoryKeys.filter(
    (key, index) => categoryKeys.indexOf(key) !== index
  );

  if (duplicates.length > 0) {
    errors.push({
      field: 'targetCosts',
      message: 'Обнаружены дублирующиеся затраты. Каждая затрата может использоваться только один раз.',
    });
  }

  return errors;
}

/**
 * Проверка конфликта: категория не может быть одновременно в источниках и целях
 */
export function validateNoConflicts(
  sourceRules: SourceRule[],
  targetCosts: TargetCost[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  const sourceCategoryKeys = new Set(
    sourceRules.map((rule) =>
      rule.level === 'category' ? `cat_${rule.category_id}` : `det_${rule.detail_cost_category_id}`
    )
  );
  const targetCategoryKeys = new Set(
    targetCosts.map((target) =>
      target.level === 'category' ? `cat_${target.category_id}` : `det_${target.detail_cost_category_id}`
    )
  );

  const conflicts = Array.from(sourceCategoryKeys).filter((key) =>
    targetCategoryKeys.has(key)
  );

  if (conflicts.length > 0) {
    errors.push({
      field: 'rules',
      message:
        'Обнаружены конфликты: одни и те же затраты не могут быть одновременно источником и целью перераспределения',
    });
  }

  return errors;
}

/**
 * Полная валидация правил перераспределения
 */
export function validateRedistributionRules(
  sourceRules: SourceRule[],
  targetCosts: TargetCost[]
): {
  isValid: boolean;
  errors: ValidationError[];
} {
  const allErrors: ValidationError[] = [];

  // Валидация источников
  const sourceErrors = validateSourceRules(sourceRules);
  allErrors.push(...sourceErrors);

  // Валидация целей
  const targetErrors = validateTargetCosts(targetCosts);
  allErrors.push(...targetErrors);

  // Валидация конфликтов
  if (sourceErrors.length === 0 && targetErrors.length === 0) {
    const conflictErrors = validateNoConflicts(sourceRules, targetCosts);
    allErrors.push(...conflictErrors);
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  };
}

/**
 * Получить читаемое сообщение об ошибках
 */
export function getErrorMessages(errors: ValidationError[]): string[] {
  return errors.map((error) => error.message);
}
