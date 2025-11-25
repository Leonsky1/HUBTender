/**
 * Парсинг Excel файла для новой версии тендера
 *
 * Формат файла ВОР (Bill of Quantities):
 * Колонки:
 * 0 - item_no (номер раздела)
 * 1 - hierarchy_level (уровень иерархии)
 * 2 - work_name (наименование работы)
 * 3 - unit_code (единица измерения)
 * 4 - volume (количество заказчика)
 * 5 - client_note (примечание заказчика)
 */

import * as XLSX from 'xlsx';
import type { ParsedRow } from './matching';

/**
 * Результат парсинга Excel файла
 */
export interface ParseExcelResult {
  positions: ParsedRow[];
  errors: string[];
  warnings: string[];
}

/**
 * Опции парсинга
 */
export interface ParseOptions {
  skipFirstRow?: boolean; // Пропустить первую строку (заголовки)
  validateUnits?: boolean; // Валидировать единицы измерения
}

/**
 * Парсить Excel файл новой версии ВОР
 *
 * @param file - Excel файл
 * @param options - опции парсинга
 * @returns результат с распарсенными позициями и ошибками
 */
export async function parseExcelForVersion(
  file: File,
  options: ParseOptions = {}
): Promise<ParseExcelResult> {
  const { skipFirstRow = true } = options;

  const result: ParseExcelResult = {
    positions: [],
    errors: [],
    warnings: [],
  };

  try {
    // Читаем файл
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });

    // Берем первый лист
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, { header: 1 });

    // Пропускаем первую строку если нужно
    const rows = skipFirstRow ? jsonData.slice(1) : jsonData;

    // Парсим каждую строку
    rows.forEach((row: unknown, index: number) => {
      if (!Array.isArray(row) || row.length === 0) {
        return; // Пропускаем пустые строки
      }

      // Проверяем что строка не полностью пустая
      const hasData = row.some(cell => cell !== undefined && cell !== null && cell !== '');
      if (!hasData) {
        return;
      }

      const cells = row as unknown[];
      const rowNumber = skipFirstRow ? index + 2 : index + 1; // Номер строки в Excel

      try {
        const parsedRow: ParsedRow = {
          item_no: cells[0] ? String(cells[0]).trim() : '',
          hierarchy_level: cells[1] ? Number(cells[1]) : 0,
          work_name: cells[2] ? String(cells[2]).trim() : '',
          unit_code: cells[3] ? String(cells[3]).trim() : '',
          volume: cells[4] ? Number(cells[4]) : 0,
          client_note: cells[5] ? String(cells[5]).trim() : '',
        };

        // Валидация обязательных полей
        if (!parsedRow.work_name) {
          result.errors.push(`Строка ${rowNumber}: отсутствует наименование работы`);
          return;
        }

        // Предупреждения
        if (!parsedRow.item_no) {
          result.warnings.push(`Строка ${rowNumber}: отсутствует номер раздела`);
        }

        if (!parsedRow.unit_code) {
          result.warnings.push(`Строка ${rowNumber}: отсутствует единица измерения`);
        }

        if (!parsedRow.volume || parsedRow.volume === 0) {
          result.warnings.push(`Строка ${rowNumber}: количество равно 0`);
        }

        result.positions.push(parsedRow);

      } catch (error: any) {
        result.errors.push(`Строка ${rowNumber}: ошибка парсинга - ${error.message}`);
      }
    });

    // Проверка что есть хотя бы одна позиция
    if (result.positions.length === 0 && result.errors.length === 0) {
      result.errors.push('Файл не содержит данных или все строки пустые');
    }

  } catch (error: any) {
    result.errors.push(`Ошибка чтения файла: ${error.message}`);
  }

  return result;
}

/**
 * Валидировать распарсенные позиции
 *
 * @param positions - массив позиций
 * @returns массив ошибок валидации
 */
export function validateParsedPositions(positions: ParsedRow[]): string[] {
  const errors: string[] = [];

  // Проверка дубликатов по work_name
  const nameMap = new Map<string, number[]>();
  positions.forEach((pos, idx) => {
    const name = pos.work_name.toLowerCase();
    if (!nameMap.has(name)) {
      nameMap.set(name, []);
    }
    nameMap.get(name)!.push(idx + 1);
  });

  nameMap.forEach((indices, name) => {
    if (indices.length > 1) {
      errors.push(
        `Дубликат наименования "${name}" в строках: ${indices.join(', ')}`
      );
    }
  });

  // Проверка hierarchy_level
  positions.forEach((pos, idx) => {
    if (pos.hierarchy_level < 0 || pos.hierarchy_level > 10) {
      errors.push(`Строка ${idx + 1}: некорректный уровень иерархии (${pos.hierarchy_level})`);
    }
  });

  return errors;
}

/**
 * Получить статистику по распарсенным позициям
 *
 * @param positions - массив позиций
 * @returns статистика
 */
export function getParseStatistics(positions: ParsedRow[]) {
  const uniqueSections = new Set(positions.map(p => p.item_no).filter(Boolean));
  const uniqueUnits = new Set(positions.map(p => p.unit_code).filter(Boolean));

  const hierarchyLevels = positions.reduce((acc, pos) => {
    acc[pos.hierarchy_level] = (acc[pos.hierarchy_level] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const totalVolume = positions.reduce((sum, pos) => sum + (pos.volume || 0), 0);

  return {
    totalPositions: positions.length,
    uniqueSections: uniqueSections.size,
    uniqueUnits: uniqueUnits.size,
    hierarchyLevels,
    totalVolume,
  };
}
