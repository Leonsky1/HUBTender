import * as XLSX from 'xlsx-js-style';
import { supabase } from '../lib/supabase';
import type {
  ClientPosition,
  BoqItemType,
  MaterialType,
  CurrencyType,
  DeliveryPriceType
} from '../lib/supabase';

/**
 * Интерфейс для строки Excel экспорта
 */
interface ExportRow {
  // Позиционирование
  itemNo: string | number;          // Номер позиции
  positionNumber: number;            // № п/п

  // Категория
  costCategory: string;              // Затрата на строительство

  // Типы
  elementType: string;               // Тип элемента
  materialType: string;              // Тип материала

  // Наименование
  name: string;                      // Наименование

  // Единица измерения и количество
  unit: string;                      // Ед. изм.
  clientVolume: number | null;       // Количество заказчика
  conversionCoeff: number | null;    // Коэфф. перевода
  consumptionCoeff: number | null;   // Коэфф. расхода
  gpVolume: number | null;           // Количество ГП

  // Финансы
  currency: string;                  // Валюта
  deliveryType: string;              // Тип доставки
  deliveryCost: number | null;       // Стоимость доставки
  unitPrice: number | null;          // Цена за единицу
  totalAmount: number | null;        // Итоговая сумма

  // Примечания
  quoteLink: string;                 // Ссылка на КП
  clientNote: string;                // Примечание заказчика
  gpNote: string;                    // Примечание ГП

  // Мета-информация для стилизации
  isPosition: boolean;               // Это позиция заказчика
  isLeaf: boolean;                   // Конечная позиция
  boqItemType: BoqItemType | null;   // Тип BOQ элемента
}

/**
 * Интерфейс для BOQ Item с JOIN данными
 */
interface BoqItemFull {
  id: string;
  tender_id: string;
  client_position_id: string;
  sort_number?: number;
  boq_item_type: BoqItemType;
  material_type?: MaterialType | null;
  unit_code?: string | null;
  quantity?: number | null;
  base_quantity?: number | null;
  consumption_coefficient?: number | null;
  conversion_coefficient?: number | null;
  parent_work_item_id?: string | null;
  delivery_price_type?: DeliveryPriceType | null;
  delivery_amount?: number | null;
  currency_type?: CurrencyType;
  unit_rate?: number | null;
  total_amount?: number | null;
  detail_cost_category_id?: string | null;
  quote_link?: string | null;
  description?: string | null;
  work_names?: { name: string; unit: string } | null;
  material_names?: { name: string; unit: string } | null;
  detail_cost_categories?: {
    name: string;
    location: string;
    cost_categories: { name: string } | null;
  } | null;
}

/**
 * Проверяет является ли тип элемента работой
 */
const isWorkType = (type: BoqItemType): boolean => {
  return ['раб', 'суб-раб', 'раб-комп.'].includes(type);
};

/**
 * Проверяет является ли тип элемента материалом
 */
const isMaterialType = (type: BoqItemType): boolean => {
  return ['мат', 'суб-мат', 'мат-комп.'].includes(type);
};

/**
 * Загружает все позиции заказчика для тендера
 */
async function loadClientPositions(tenderId: string): Promise<ClientPosition[]> {
  const { data, error } = await supabase
    .from('client_positions')
    .select('*')
    .eq('tender_id', tenderId)
    .order('position_number', { ascending: true });

  if (error) {
    throw new Error(`Ошибка загрузки позиций: ${error.message}`);
  }

  return data || [];
}

/**
 * Загружает ВСЕ BOQ items для всего тендера одним запросом
 */
async function loadAllBoqItemsForTender(tenderId: string): Promise<Map<string, BoqItemFull[]>> {
  const { data, error } = await supabase
    .from('boq_items')
    .select(`
      *,
      work_names(name, unit),
      material_names(name, unit),
      detail_cost_categories(
        name,
        location,
        cost_categories(name)
      )
    `)
    .eq('tender_id', tenderId)
    .order('sort_number', { ascending: true });

  if (error) {
    throw new Error(`Ошибка загрузки BOQ items: ${error.message}`);
  }

  // Группировать по client_position_id
  const itemsByPosition = new Map<string, BoqItemFull[]>();

  (data || []).forEach((item: any) => {
    const positionId = item.client_position_id;
    if (!itemsByPosition.has(positionId)) {
      itemsByPosition.set(positionId, []);
    }
    itemsByPosition.get(positionId)!.push(item as BoqItemFull);
  });

  return itemsByPosition;
}

/**
 * Форматирует категорию затрат
 */
function formatCostCategory(item: BoqItemFull): string {
  if (!item.detail_cost_categories) return '';

  const category = item.detail_cost_categories.cost_categories?.name || '';
  const detail = item.detail_cost_categories.name || '';
  const location = item.detail_cost_categories.location || '';

  return `${category} / ${detail} / ${location}`;
}

/**
 * Создает строку экспорта из позиции заказчика
 */
function createPositionRow(position: ClientPosition, isLeaf: boolean): ExportRow {
  const totalAmount = (position.total_material || 0) + (position.total_works || 0);

  return {
    itemNo: position.item_no || position.position_number,
    positionNumber: position.position_number,
    costCategory: '',
    elementType: '',
    materialType: '',
    name: position.work_name,
    unit: position.unit_code || '',
    clientVolume: position.volume || null,
    conversionCoeff: null,
    consumptionCoeff: null,
    gpVolume: position.manual_volume || null,
    currency: '',
    deliveryType: '',
    deliveryCost: null,
    unitPrice: null,
    totalAmount: totalAmount || null,
    quoteLink: '',
    clientNote: position.client_note || '',
    gpNote: position.manual_note || '',
    isPosition: true,
    isLeaf: isLeaf,
    boqItemType: null,
  };
}

/**
 * Создает строку экспорта из BOQ item
 */
function createBoqItemRow(item: BoqItemFull, position: ClientPosition): ExportRow {
  const name = isWorkType(item.boq_item_type)
    ? item.work_names?.name || ''
    : item.material_names?.name || '';

  const unit = isWorkType(item.boq_item_type)
    ? item.work_names?.unit || ''
    : item.material_names?.unit || '';

  return {
    itemNo: '',
    positionNumber: position.position_number,
    costCategory: formatCostCategory(item),
    elementType: item.boq_item_type || '',
    materialType: item.material_type || '',
    name: name,
    unit: item.unit_code || unit || '',
    clientVolume: null,
    conversionCoeff: item.conversion_coefficient || null,
    consumptionCoeff: item.consumption_coefficient || null,
    gpVolume: item.quantity || null,
    currency: item.currency_type || '',
    deliveryType: item.delivery_price_type || '',
    deliveryCost: item.delivery_amount || null,
    unitPrice: item.unit_rate || null,
    totalAmount: item.total_amount || null,
    quoteLink: item.quote_link || '',
    clientNote: '',
    gpNote: item.description || '',
    isPosition: false,
    isLeaf: false,
    boqItemType: item.boq_item_type,
  };
}

/**
 * Собирает все строки для экспорта в правильном порядке
 */
function collectExportRows(
  positions: ClientPosition[],
  boqItemsByPosition: Map<string, BoqItemFull[]>
): ExportRow[] {
  const rows: ExportRow[] = [];

  // Разделить на обычные и ДОП работы
  const normalPositions = positions.filter(p => !p.is_additional);
  const additionalPositions = positions.filter(p => p.is_additional);

  // Обработать обычные позиции
  for (const position of normalPositions) {
    // Проверить является ли позиция конечной
    const isLeaf = position.hierarchy_level !== undefined && position.hierarchy_level >= 3;

    // Добавить строку позиции
    rows.push(createPositionRow(position, isLeaf));

    // Если конечная позиция, добавить её BOQ items
    if (isLeaf) {
      const boqItems = boqItemsByPosition.get(position.id) || [];

      // Разделить на работы и материалы
      const works = boqItems.filter(item => isWorkType(item.boq_item_type));
      const materials = boqItems.filter(item => isMaterialType(item.boq_item_type));

      // Для каждой работы: работа + её материалы
      for (const work of works) {
        rows.push(createBoqItemRow(work, position));

        // Материалы привязанные к этой работе
        const linkedMaterials = materials.filter(
          m => m.parent_work_item_id === work.id
        );
        linkedMaterials.forEach(mat => {
          rows.push(createBoqItemRow(mat, position));
        });
      }

      // Непривязанные материалы (standalone)
      const standaloneMaterials = materials.filter(
        m => !m.parent_work_item_id || m.parent_work_item_id === null
      );
      standaloneMaterials.forEach(mat => {
        rows.push(createBoqItemRow(mat, position));
      });

      // ДОП работы для этой позиции
      const childAdditional = additionalPositions.filter(
        ap => ap.parent_position_id === position.id
      );

      for (const dopWork of childAdditional) {
        // Добавить строку ДОП работы
        rows.push(createPositionRow(dopWork, true));

        // BOQ items для ДОП работы
        const dopBoqItems = boqItemsByPosition.get(dopWork.id) || [];

        const dopWorks = dopBoqItems.filter(item => isWorkType(item.boq_item_type));
        const dopMaterials = dopBoqItems.filter(item => isMaterialType(item.boq_item_type));

        for (const work of dopWorks) {
          rows.push(createBoqItemRow(work, dopWork));

          const linkedMaterials = dopMaterials.filter(
            m => m.parent_work_item_id === work.id
          );
          linkedMaterials.forEach(mat => {
            rows.push(createBoqItemRow(mat, dopWork));
          });
        }

        const standaloneMaterials = dopMaterials.filter(
          m => !m.parent_work_item_id || m.parent_work_item_id === null
        );
        standaloneMaterials.forEach(mat => {
          rows.push(createBoqItemRow(mat, dopWork));
        });
      }
    }
  }

  return rows;
}

/**
 * Получает стиль для ячейки в зависимости от типа строки
 */
function getCellStyle(row: ExportRow) {
  const baseStyle = {
    border: {
      top: { style: 'thin', color: { rgb: 'D3D3D3' } },
      bottom: { style: 'thin', color: { rgb: 'D3D3D3' } },
      left: { style: 'thin', color: { rgb: 'D3D3D3' } },
      right: { style: 'thin', color: { rgb: 'D3D3D3' } },
    },
    alignment: {
      wrapText: true,    // Перенос строк в ячейках
      vertical: 'center',  // Выравнивание по центру по вертикали
    },
  };

  // Для позиций заказчика
  if (row.isPosition) {
    if (row.isLeaf && (row.totalAmount === null || row.totalAmount === 0)) {
      // Конечная позиция без работ/материалов - красный фон
      return {
        ...baseStyle,
        fill: { fgColor: { rgb: 'FFCCCC' } },
      };
    }
    // Неконечные и расцененные позиции - белый фон
    return baseStyle;
  }

  // Для BOQ items
  const colorMap: Record<string, string> = {
    'раб': 'FFE6CC',
    'суб-раб': 'E6D9F2',
    'раб-комп.': 'FFDDDD',
    'мат': 'D9EAFF',
    'суб-мат': 'E8F5E0',
    'мат-комп.': 'CCF2EF',
  };

  const color = row.boqItemType ? colorMap[row.boqItemType] : null;
  return color
    ? { ...baseStyle, fill: { fgColor: { rgb: color } } }
    : baseStyle;
}

/**
 * Форматирует число БЕЗ разделителя тысяч, с запятой как десятичным разделителем
 */
function formatNumber(value: number | null, decimalPlaces: number = 2): string | number {
  if (value === null || value === undefined) return '';

  // Форматировать с нужным количеством знаков после запятой, заменить точку на запятую
  return value.toFixed(decimalPlaces).replace('.', ',');
}

/**
 * Создает рабочий лист Excel с данными и стилями
 */
function createWorksheet(rows: ExportRow[]) {
  // Заголовки колонок
  const headers = [
    'Номер позиции',
    '№ п/п',
    'Затрата на строительство',
    'Тип элемента',
    'Тип материала',
    'Наименование',
    'Ед. изм.',
    'Количество заказчика',
    'Коэфф. перевода',
    'Коэфф. расхода',
    'Количество ГП',
    'Валюта',
    'Тип доставки',
    'Стоимость доставки',
    'Цена за единицу',
    'Итоговая сумма',
    'Ссылка на КП',
    'Примечание заказчика',
    'Примечание ГП',
  ];

  // Создать массив данных (числа записываем как числа, НЕ как строки!)
  const data = rows.map(row => [
    row.itemNo,
    row.positionNumber,
    row.costCategory,
    row.elementType,
    row.materialType,
    row.name,
    row.unit,
    row.clientVolume !== null ? row.clientVolume : '',       // Число как есть
    row.conversionCoeff !== null ? row.conversionCoeff : '', // Число как есть
    row.consumptionCoeff !== null ? row.consumptionCoeff : '', // Число как есть
    row.gpVolume !== null ? row.gpVolume : '',               // Число как есть
    row.currency,
    row.deliveryType,
    row.deliveryCost !== null ? row.deliveryCost : '',       // Число как есть
    row.unitPrice !== null ? row.unitPrice : '',             // Число как есть
    row.totalAmount !== null ? row.totalAmount : '',         // Число как есть
    row.quoteLink,
    row.clientNote,
    row.gpNote,
  ]);

  // Создать рабочий лист
  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);

  // Применить стили к заголовкам
  const headerStyle = {
    font: { bold: true },
    fill: { fgColor: { rgb: 'E0E0E0' } },
    alignment: {
      horizontal: 'center',
      vertical: 'center',
      wrapText: true  // Перенос текста в заголовках
    },
    border: {
      top: { style: 'thin', color: { rgb: 'D3D3D3' } },
      bottom: { style: 'thin', color: { rgb: 'D3D3D3' } },
      left: { style: 'thin', color: { rgb: 'D3D3D3' } },
      right: { style: 'thin', color: { rgb: 'D3D3D3' } },
    },
  };

  // Применить стили к ячейкам заголовков
  for (let col = 0; col < headers.length; col++) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!ws[cellRef]) ws[cellRef] = { t: 's', v: headers[col] };
    ws[cellRef].s = headerStyle;
  }

  // Применить стили к ячейкам данных
  rows.forEach((row, rowIndex) => {
    const style = getCellStyle(row);

    for (let col = 0; col < headers.length; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: rowIndex + 1, c: col });
      if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' };

      // ВСЕ числовые колонки: 7,8,9,10,13,14,15
      // (Количество заказчика, Коэфф. перевода, Коэфф. расхода, Количество ГП,
      //  Стоимость доставки, Цена за единицу, Итоговая сумма)
      const numericCols = [7, 8, 9, 10, 13, 14, 15];
      const isNumeric = numericCols.includes(col);

      // Базовые границы для всех ячеек
      const cellBorder = {
        top: { style: 'thin', color: { rgb: 'D3D3D3' } },
        bottom: { style: 'thin', color: { rgb: 'D3D3D3' } },
        left: { style: 'thin', color: { rgb: 'D3D3D3' } },
        right: { style: 'thin', color: { rgb: 'D3D3D3' } },
      };

      // Колонка 5 (Наименование) - выравнивание по левому краю с переносом
      // Остальные колонки - выравнивание по центру
      if (col === 5) {
        // Наименование - по левому краю, по вертикали по центру
        ws[cellRef].s = {
          ...style,
          border: cellBorder,  // Явно установить границы
          alignment: {
            wrapText: true,
            vertical: 'center',
            horizontal: 'left'
          },
        };
      } else {
        // Все остальные колонки - по центру
        ws[cellRef].s = {
          ...style,
          border: cellBorder,  // Явно установить границы
          alignment: {
            wrapText: true,
            vertical: 'center',
            horizontal: 'center'
          },
        };
      }

      // Установить числовой формат для ВСЕХ числовых колонок (даже пустых)
      if (isNumeric) {
        // Колонки 7,8,9,10 (количества и коэффициенты) - 4 знака после запятой БЕЗ разделителя тысяч
        // Колонки 13,14,15 (стоимости и суммы) - 2 знака после запятой С разделителем тысяч
        const fourDecimalCols = [7, 8, 9, 10];

        // Числовой формат
        // Для 4 знаков: "0.0000" (БЕЗ разделителя тысяч)
        // Для 2 знаков: "# ##0.00" (С разделителем тысяч пробелом)
        ws[cellRef].z = fourDecimalCols.includes(col) ? '0.0000' : '# ##0.00';

        // Если ячейка не пустая, убедиться что это число
        if (ws[cellRef].v !== '' && ws[cellRef].v !== null && ws[cellRef].v !== undefined) {
          // Если это уже число - просто установить тип
          if (typeof ws[cellRef].v === 'number') {
            ws[cellRef].t = 'n';  // Тип: число
          }
          // Если это строка - попробовать преобразовать
          else if (typeof ws[cellRef].v === 'string') {
            const numValue = parseFloat(ws[cellRef].v);
            if (!isNaN(numValue)) {
              ws[cellRef].t = 'n';  // Тип: число
              ws[cellRef].v = numValue;
            }
          }
        }
      }
    }
  });

  // Установить ширину колонок
  const colWidths = [
    { wch: 15 },  // Номер позиции
    { wch: 10 },  // № п/п
    { wch: 30 },  // Затрата на строительство
    { wch: 12 },  // Тип элемента
    { wch: 12 },  // Тип материала
    { wch: 40 },  // Наименование
    { wch: 10 },  // Ед. изм.
    { wch: 15 },  // Количество заказчика
    { wch: 12 },  // Коэфф. перевода
    { wch: 12 },  // Коэфф. расхода
    { wch: 15 },  // Количество ГП
    { wch: 10 },  // Валюта
    { wch: 15 },  // Тип доставки
    { wch: 15 },  // Стоимость доставки
    { wch: 15 },  // Цена за единицу
    { wch: 15 },  // Итоговая сумма
    { wch: 20 },  // Ссылка на КП
    { wch: 25 },  // Примечание заказчика
    { wch: 25 },  // Примечание ГП
  ];

  ws['!cols'] = colWidths;

  // Установить высоту строки заголовка (увеличена для переноса текста)
  ws['!rows'] = [{ hpt: 40 }];  // Высота первой строки (заголовки) - 40 пунктов

  // Заморозить первую строку (заголовки)
  ws['!freeze'] = { xSplit: 0, ySplit: 1 };

  return ws;
}

/**
 * Главная функция экспорта позиций заказчика в Excel
 */
export async function exportPositionsToExcel(
  tenderId: string,
  tenderTitle: string,
  tenderVersion: number
): Promise<void> {
  try {
    // Загрузить все позиции и все BOQ items ОДНИМ запросом каждый
    const [positions, boqItemsByPosition] = await Promise.all([
      loadClientPositions(tenderId),
      loadAllBoqItemsForTender(tenderId)
    ]);

    if (positions.length === 0) {
      throw new Error('Нет позиций для экспорта');
    }

    // Собрать все строки для экспорта (БЕЗ дополнительных запросов к БД)
    const rows = collectExportRows(positions, boqItemsByPosition);

    // Создать рабочий лист
    const worksheet = createWorksheet(rows);

    // Создать рабочую книгу
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Позиции заказчика');

    // Сформировать имя файла
    const fileName = `${tenderTitle} (Версия ${tenderVersion}).xlsx`;

    // Экспортировать файл
    XLSX.writeFile(workbook, fileName);
  } catch (error: any) {
    console.error('Ошибка экспорта в Excel:', error);
    throw error;
  }
}
