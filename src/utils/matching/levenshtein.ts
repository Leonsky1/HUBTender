/**
 * Алгоритм Левенштейна для вычисления расстояния редактирования между строками
 *
 * Вычисляет минимальное количество операций (вставка, удаление, замена) необходимых
 * для преобразования одной строки в другую
 *
 * Используется для определения схожести наименований работ при сопоставлении версий
 */

/**
 * Вычислить расстояние Левенштейна между двумя строками
 * @param str1 - первая строка
 * @param str2 - вторая строка
 * @returns расстояние редактирования (минимальное количество операций)
 */
export function levenshteinDistance(str1: string, str2: string): number {
  // Нормализация: приведение к нижнему регистру и обрезка пробелов
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  const len1 = s1.length;
  const len2 = s2.length;

  // Оптимизация: если одна из строк пустая
  if (len1 === 0) return len2;
  if (len2 === 0) return len1;

  // Матрица расстояний
  const matrix: number[][] = [];

  // Инициализация первой строки и столбца
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Заполнение матрицы
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;

      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // удаление
        matrix[i][j - 1] + 1,      // вставка
        matrix[i - 1][j - 1] + cost // замена
      );
    }
  }

  return matrix[len1][len2];
}
