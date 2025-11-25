/**
 * Метрики схожести для сопоставления позиций заказчика
 */

import { levenshteinDistance } from './levenshtein';

/**
 * Нормализовать строку для сравнения
 * Убирает лишние пробелы, спецсимволы, приводит к нижнему регистру
 * @param str - исходная строка
 * @returns нормализованная строка
 */
export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')  // Заменить множественные пробелы на один
    .replace(/[^\w\s\u0400-\u04FF]/g, ''); // Убрать спецсимволы, оставить буквы и пробелы
}

/**
 * Вычислить процент схожести двух строк на основе расстояния Левенштейна
 * @param str1 - первая строка
 * @param str2 - вторая строка
 * @returns процент схожести от 0 до 1 (0 = полностью разные, 1 = идентичные)
 */
export function calculateStringSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;

  // Нормализуем строки перед сравнением
  const normalized1 = normalizeString(str1);
  const normalized2 = normalizeString(str2);

  const distance = levenshteinDistance(normalized1, normalized2);
  const maxLength = Math.max(normalized1.length, normalized2.length);

  if (maxLength === 0) return 1;

  // Similarity = 1 - (distance / maxLength)
  return 1 - distance / maxLength;
}

/**
 * Вычислить близость двух числовых значений (volume)
 * @param vol1 - первое значение
 * @param vol2 - второе значение
 * @returns score от 0 до 1 (1 = идентичные или очень близкие)
 */
export function calculateVolumeProximity(
  vol1: number | null,
  vol2: number | null
): number {
  // Если оба null или undefined
  if (vol1 == null && vol2 == null) return 1;

  // Если только одно null
  if (vol1 == null || vol2 == null) return 0;

  // Если оба 0
  if (vol1 === 0 && vol2 === 0) return 1;

  // Если одно 0
  if (vol1 === 0 || vol2 === 0) return 0;

  // Вычисляем относительную разницу
  const diff = Math.abs(vol1 - vol2);
  const avg = (Math.abs(vol1) + Math.abs(vol2)) / 2;
  const relativeDiff = diff / avg;

  // Если разница менее 5% - считаем практически идентичными
  if (relativeDiff < 0.05) return 1;

  // Если разница более 50% - считаем совсем разными
  if (relativeDiff > 0.5) return 0;

  // Линейная интерполяция между 0.05 и 0.5
  return 1 - (relativeDiff - 0.05) / 0.45;
}
