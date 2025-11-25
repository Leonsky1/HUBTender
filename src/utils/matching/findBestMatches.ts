/**
 * Поиск лучших совпадений между позициями старой и новой версий тендера
 */

import {
  calculateMatchScore,
  isAutoMatchScore,
  type ParsedRow,
  type MatchScoreBreakdown,
} from './calculateMatchScore';
import type { ClientPosition } from '../../lib/supabase';

/**
 * Результат сопоставления одной позиции
 */
export interface MatchResult {
  oldPositionId: string;
  newPositionIndex: number;
  score: MatchScoreBreakdown;
  matchType: 'auto' | 'low_confidence';
}

/**
 * Найти лучшие совпадения для всех позиций
 *
 * Алгоритм:
 * 1. Для каждой позиции новой версии ищем лучшее совпадение в старой версии
 * 2. Если score >= threshold (80%) - помечаем как автоматическое совпадение
 * 3. Если score < threshold но > 50% - помечаем как требующее ручного подтверждения
 * 4. Используем жадный алгоритм: одна позиция старой версии может соответствовать только одной позиции новой
 *
 * @param oldPositions - позиции из старой версии тендера
 * @param newPositions - позиции из новой версии (Excel)
 * @param threshold - порог для автоматического сопоставления (по умолчанию 80)
 * @returns массив результатов сопоставления
 */
export function findBestMatches(
  oldPositions: ClientPosition[],
  newPositions: ParsedRow[],
  threshold: number = 80
): MatchResult[] {
  const results: MatchResult[] = [];
  const usedOldPositions = new Set<string>();

  // Для каждой позиции новой версии
  for (let newIdx = 0; newIdx < newPositions.length; newIdx++) {
    const newPos = newPositions[newIdx];
    let bestMatch: {
      oldPos: ClientPosition;
      score: MatchScoreBreakdown;
    } | null = null;

    // Ищем лучшее совпадение среди неиспользованных позиций старой версии
    for (const oldPos of oldPositions) {
      // Пропускаем уже использованные позиции
      if (usedOldPositions.has(oldPos.id)) continue;

      // Пропускаем дополнительные работы (их обрабатываем отдельно)
      if (oldPos.is_additional) continue;

      // Вычисляем оценку совпадения
      const score = calculateMatchScore(oldPos, newPos);

      // Обновляем лучшее совпадение
      if (!bestMatch || score.total > bestMatch.score.total) {
        bestMatch = { oldPos, score };
      }
    }

    // Если нашли совпадение с score > 50%
    if (bestMatch && bestMatch.score.total > 50) {
      const matchType = isAutoMatchScore(bestMatch.score, threshold)
        ? 'auto'
        : 'low_confidence';

      results.push({
        oldPositionId: bestMatch.oldPos.id,
        newPositionIndex: newIdx,
        score: bestMatch.score,
        matchType,
      });

      // Помечаем позицию старой версии как использованную
      usedOldPositions.add(bestMatch.oldPos.id);
    }
  }

  return results;
}

/**
 * Получить не сопоставленные позиции старой версии (удаленные заказчиком)
 *
 * @param oldPositions - все позиции старой версии
 * @param matches - результаты сопоставления
 * @returns позиции, которые не были сопоставлены
 */
export function getUnmatchedOldPositions(
  oldPositions: ClientPosition[],
  matches: MatchResult[]
): ClientPosition[] {
  const matchedIds = new Set(matches.map(m => m.oldPositionId));

  return oldPositions.filter(pos =>
    !matchedIds.has(pos.id) &&
    !pos.is_additional // Дополнительные работы обрабатываем отдельно
  );
}

/**
 * Получить индексы не сопоставленных позиций новой версии (новые позиции)
 *
 * @param newPositions - все позиции новой версии
 * @param matches - результаты сопоставления
 * @returns индексы позиций, которые не были сопоставлены
 */
export function getUnmatchedNewPositionIndices(
  newPositions: ParsedRow[],
  matches: MatchResult[]
): number[] {
  const matchedIndices = new Set(matches.map(m => m.newPositionIndex));

  return newPositions
    .map((_, idx) => idx)
    .filter(idx => !matchedIndices.has(idx));
}

/**
 * Статистика сопоставления
 */
export interface MatchingStatistics {
  totalOld: number;
  totalNew: number;
  autoMatched: number;
  lowConfidence: number;
  deleted: number;
  new: number;
  additionalWorks: number;
}

/**
 * Вычислить статистику сопоставления
 *
 * @param oldPositions - позиции старой версии
 * @param newPositions - позиции новой версии
 * @param matches - результаты сопоставления
 * @returns статистика
 */
export function calculateMatchingStatistics(
  oldPositions: ClientPosition[],
  newPositions: ParsedRow[],
  matches: MatchResult[]
): MatchingStatistics {
  const autoMatched = matches.filter(m => m.matchType === 'auto').length;
  const lowConfidence = matches.filter(m => m.matchType === 'low_confidence').length;

  const unmatchedOld = getUnmatchedOldPositions(oldPositions, matches);
  const unmatchedNew = getUnmatchedNewPositionIndices(newPositions, matches);

  const additionalWorks = oldPositions.filter(p => p.is_additional).length;

  return {
    totalOld: oldPositions.filter(p => !p.is_additional).length,
    totalNew: newPositions.length,
    autoMatched,
    lowConfidence,
    deleted: unmatchedOld.length,
    new: unmatchedNew.length,
    additionalWorks,
  };
}
