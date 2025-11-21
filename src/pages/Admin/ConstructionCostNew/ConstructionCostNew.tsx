/**
 * Страница "Затраты на строительство" (новая версия)
 * Отображение и редактирование объемов затрат по категориям с расчетом стоимостей
 */

import React, { useState, useEffect } from 'react';
import {
  Table,
  Select,
  Button,
  Space,
  Typography,
  Row,
  Col,
  message,
  Spin,
  Input,
  InputNumber,
  Segmented,
  Switch,
  Card,
  Tag,
} from 'antd';
import {
  ReloadOutlined,
  SearchOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { supabase } from '../../../lib/supabase';
import type { Tender, DetailCostCategory, ConstructionCostVolume } from '../../../lib/supabase';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx-js-style';

const { Title, Text } = Typography;

// Интерфейс для строки таблицы
interface CostRow {
  key: string;
  detail_cost_category_id?: string;
  cost_category_name: string;
  detail_category_name: string;
  location_name: string;
  volume: number;
  unit: string;
  materials_cost: number;
  works_cost: number;
  sub_materials_cost: number;
  sub_works_cost: number;
  materials_comp_cost: number; // Компонентные материалы
  works_comp_cost: number; // Компонентные работы
  total_cost: number;
  cost_per_unit: number;
  order_num?: number;
  is_category?: boolean; // Флаг для строк-категорий (сворачиваемых)
  children?: CostRow[]; // Дочерние строки
}

interface TenderOption {
  value: string;
  label: string;
  clientName: string;
}

const ConstructionCostNew: React.FC = () => {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [selectedTenderId, setSelectedTenderId] = useState<string | null>(null);
  const [selectedTenderTitle, setSelectedTenderTitle] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CostRow[]>([]);

  // Фильтры и поиск
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [detailFilter, setDetailFilter] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState<string | null>(null);

  // Переключатели
  const [costType, setCostType] = useState<'base' | 'commercial'>('base'); // Прямые / Коммерческие
  const [hideZeros, setHideZeros] = useState(false); // Скрыть нули
  const [viewMode, setViewMode] = useState<'detailed' | 'summary'>('detailed'); // Детальный / Итоговый

  // Получение уникальных наименований тендеров
  const getTenderTitles = (): TenderOption[] => {
    const uniqueTitles = new Map<string, TenderOption>();

    tenders.forEach(tender => {
      if (!uniqueTitles.has(tender.title)) {
        uniqueTitles.set(tender.title, {
          value: tender.title,
          label: tender.title,
          clientName: tender.client_name,
        });
      }
    });

    return Array.from(uniqueTitles.values());
  };

  // Получение версий для выбранного тендера
  const getVersionsForTitle = (title: string) => {
    return tenders
      .filter(t => t.title === title)
      .map(t => ({
        value: t.version || 1,
        label: `Версия ${t.version || 1}`,
      }));
  };

  // Обработка выбора наименования тендера
  const handleTenderTitleChange = (title: string) => {
    setSelectedTenderTitle(title);
    // Сбрасываем версию и ID при смене тендера
    setSelectedVersion(null);
    setSelectedTenderId(null);
    setData([]);
  };

  // Обработка выбора версии
  const handleVersionChange = (version: number) => {
    setSelectedVersion(version);
    const tender = tenders.find(t => t.title === selectedTenderTitle && t.version === version);
    if (tender) {
      setSelectedTenderId(tender.id);
    }
  };

  // Загрузка тендеров
  useEffect(() => {
    fetchTenders();
  }, []);

  const fetchTenders = async () => {
    try {
      const { data, error } = await supabase
        .from('tenders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTenders(data || []);
    } catch (error: any) {
      message.error('Ошибка загрузки тендеров: ' + error.message);
    }
  };

  // Загрузка данных затрат при выборе тендера
  useEffect(() => {
    if (selectedTenderId) {
      fetchConstructionCosts();
    }
  }, [selectedTenderId, costType]);

  const fetchConstructionCosts = async () => {
    if (!selectedTenderId) return;

    setLoading(true);
    try {
      // 1. Загружаем все detail_cost_categories с join к cost_categories и сортировкой по order_num
      const { data: categories, error: catError } = await supabase
        .from('detail_cost_categories')
        .select(`
          id,
          name,
          unit,
          location,
          order_num,
          cost_categories (name)
        `)
        .order('order_num', { ascending: true });

      if (catError) throw catError;

      // 2. Загружаем объемы для выбранного тендера
      const { data: volumes, error: volError } = await supabase
        .from('construction_cost_volumes')
        .select('*')
        .eq('tender_id', selectedTenderId);

      if (volError) throw volError;

      // Создаем Map для быстрого поиска объемов
      const volumeMap = new Map(
        (volumes || []).map(v => [v.detail_cost_category_id, v.volume || 0])
      );

      // 3. Загружаем все boq_items для позиций тендера через join
      const { data: boqItems, error: boqError } = await supabase
        .from('boq_items')
        .select(`
          detail_cost_category_id,
          boq_item_type,
          ${costType === 'base' ? 'total_amount' : 'total_commercial_material_cost, total_commercial_work_cost'},
          client_positions!inner(tender_id)
        `)
        .eq('client_positions.tender_id', selectedTenderId);

      if (boqError) throw boqError;

      // 4. Группируем затраты по detail_cost_category_id и типам
      const costMap = new Map<string, {
        materials: number;
        works: number;
        subMaterials: number;
        subWorks: number;
        materialsComp: number;
        worksComp: number;
      }>();

      (boqItems || []).forEach((item: any) => {
        const catId = item.detail_cost_category_id;
        if (!catId) return;

        if (!costMap.has(catId)) {
          costMap.set(catId, { materials: 0, works: 0, subMaterials: 0, subWorks: 0, materialsComp: 0, worksComp: 0 });
        }

        const costs = costMap.get(catId)!;

        // Для базовых затрат используем total_amount и определяем тип по boq_item_type
        // Для коммерческих используем отдельные поля
        if (costType === 'base') {
          const amount = item.total_amount || 0;
          // Классифицируем по типам
          switch (item.boq_item_type) {
            case 'мат':
              costs.materials += amount;
              break;
            case 'суб-мат':
              costs.subMaterials += amount;
              break;
            case 'мат-комп.':
              costs.materialsComp += amount;
              break;
            case 'раб':
              costs.works += amount;
              break;
            case 'суб-раб':
              costs.subWorks += amount;
              break;
            case 'раб-комп.':
              costs.worksComp += amount;
              break;
          }
        } else {
          // Для коммерческих затрат используем отдельные поля
          const materialCost = item.total_commercial_material_cost || 0;
          const workCost = item.total_commercial_work_cost || 0;

          switch (item.boq_item_type) {
            case 'мат':
              costs.materials += materialCost;
              break;
            case 'суб-мат':
              costs.subMaterials += materialCost;
              break;
            case 'мат-комп.':
              costs.materialsComp += materialCost;
              break;
            case 'раб':
              costs.works += workCost;
              break;
            case 'суб-раб':
              costs.subWorks += workCost;
              break;
            case 'раб-комп.':
              costs.worksComp += workCost;
              break;
          }
        }
      });

      // 5. Формируем иерархическую структуру: категории с детальными строками
      const categoryMap = new Map<string, CostRow>();
      const detailRows: CostRow[] = [];

      (categories || []).forEach((cat: any) => {
        const volume = volumeMap.get(cat.id) || 0;
        const costs = costMap.get(cat.id) || { materials: 0, works: 0, subMaterials: 0, subWorks: 0, materialsComp: 0, worksComp: 0 };
        const totalCost = costs.materials + costs.works + costs.subMaterials + costs.subWorks + costs.materialsComp + costs.worksComp;
        const costPerUnit = volume > 0 ? totalCost / volume : 0;

        const categoryName = cat.cost_categories?.name || '';

        // Создаем детальную строку
        const detailRow: CostRow = {
          key: cat.id,
          detail_cost_category_id: cat.id,
          cost_category_name: categoryName,
          detail_category_name: cat.name,
          location_name: cat.location || '',
          volume,
          unit: cat.unit,
          materials_cost: costs.materials,
          works_cost: costs.works,
          sub_materials_cost: costs.subMaterials,
          sub_works_cost: costs.subWorks,
          materials_comp_cost: costs.materialsComp,
          works_comp_cost: costs.worksComp,
          total_cost: totalCost,
          cost_per_unit: costPerUnit,
          order_num: cat.order_num,
        };

        detailRows.push(detailRow);

        // Создаем или обновляем строку категории
        if (!categoryMap.has(categoryName)) {
          categoryMap.set(categoryName, {
            key: `category-${categoryName}`,
            cost_category_name: categoryName,
            detail_category_name: '',
            location_name: '',
            volume: 0,
            unit: '',
            materials_cost: 0,
            works_cost: 0,
            sub_materials_cost: 0,
            sub_works_cost: 0,
            materials_comp_cost: 0,
            works_comp_cost: 0,
            total_cost: 0,
            cost_per_unit: 0,
            is_category: true,
            children: [],
            order_num: cat.order_num, // Используем order_num первого элемента категории
          });
        }

        const categoryRow = categoryMap.get(categoryName)!;
        categoryRow.children!.push(detailRow);

        // Суммируем затраты категории
        categoryRow.materials_cost += costs.materials;
        categoryRow.works_cost += costs.works;
        categoryRow.sub_materials_cost += costs.subMaterials;
        categoryRow.sub_works_cost += costs.subWorks;
        categoryRow.materials_comp_cost += costs.materialsComp;
        categoryRow.works_comp_cost += costs.worksComp;
        categoryRow.total_cost += totalCost;
      });

      // Преобразуем Map в массив и сортируем по order_num
      const rows: CostRow[] = Array.from(categoryMap.values()).sort((a, b) =>
        (a.order_num || 0) - (b.order_num || 0)
      );

      setData(rows);
    } catch (error: any) {
      console.error('Ошибка загрузки затрат:', error);
      console.error('Детали ошибки:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      message.error(`Не удалось загрузить данные затрат: ${error.message || 'Неизвестная ошибка'}`);
    } finally {
      setLoading(false);
    }
  };

  // Обработка редактирования объема
  const handleVolumeChange = async (value: number | null, record: CostRow) => {
    if (value === null || value === record.volume) return;

    try {
      // Upsert объема в базу данных
      const { error } = await supabase
        .from('construction_cost_volumes')
        .upsert({
          tender_id: selectedTenderId!,
          detail_cost_category_id: record.detail_cost_category_id,
          volume: value,
        }, {
          onConflict: 'tender_id,detail_cost_category_id'
        });

      if (error) throw error;

      message.success('Объем сохранен');
      fetchConstructionCosts(); // Перезагружаем данные
    } catch (error: any) {
      message.error('Ошибка сохранения: ' + error.message);
    }
  };

  // Функция экспорта в Excel с форматированием
  const handleExport = async () => {
    if (!selectedTenderId || !selectedTenderTitle) {
      message.warning('Выберите тендер для экспорта');
      return;
    }

    try {
      // Загружаем коммерческие данные (если сейчас показаны прямые) или прямые (если показаны коммерческие)
      const oppositeType = costType === 'base' ? 'commercial' : 'base';

      const { data: oppositeBOQItems, error: oppError } = await supabase
        .from('boq_items')
        .select(`
          detail_cost_category_id,
          boq_item_type,
          ${oppositeType === 'base' ? 'total_amount' : 'total_commercial_material_cost, total_commercial_work_cost'},
          client_positions!inner(tender_id)
        `)
        .eq('client_positions.tender_id', selectedTenderId);

      if (oppError) throw oppError;

      // Группируем данные противоположного типа по detail_cost_category_id
      const oppositeCostMap = new Map<string, {
        materials: number;
        works: number;
        subMaterials: number;
        subWorks: number;
        materialsComp: number;
        worksComp: number;
      }>();

      (oppositeBOQItems || []).forEach((item: any) => {
        const catId = item.detail_cost_category_id;
        if (!catId) return;

        if (!oppositeCostMap.has(catId)) {
          oppositeCostMap.set(catId, { materials: 0, works: 0, subMaterials: 0, subWorks: 0, materialsComp: 0, worksComp: 0 });
        }

        const costs = oppositeCostMap.get(catId)!;

        if (oppositeType === 'base') {
          const amount = item.total_amount || 0;
          switch (item.boq_item_type) {
            case 'мат':
              costs.materials += amount;
              break;
            case 'суб-мат':
              costs.subMaterials += amount;
              break;
            case 'мат-комп.':
              costs.materialsComp += amount;
              break;
            case 'раб':
              costs.works += amount;
              break;
            case 'суб-раб':
              costs.subWorks += amount;
              break;
            case 'раб-комп.':
              costs.worksComp += amount;
              break;
          }
        } else {
          const materialCost = item.total_commercial_material_cost || 0;
          const workCost = item.total_commercial_work_cost || 0;

          switch (item.boq_item_type) {
            case 'мат':
              costs.materials += materialCost;
              break;
            case 'суб-мат':
              costs.subMaterials += materialCost;
              break;
            case 'мат-комп.':
              costs.materialsComp += materialCost;
              break;
            case 'раб':
              costs.works += workCost;
              break;
            case 'суб-раб':
              costs.subWorks += workCost;
              break;
            case 'раб-комп.':
              costs.worksComp += workCost;
              break;
          }
        }
      });
      // Создаем workbook
      const wb = XLSX.utils.book_new();

      // Создаем пустой массив для данных
      const data: any[][] = [];

      // Строка 1: Главные заголовки (оба типа затрат)
      data.push([
        'Затрата тендера', 'Комментарий', 'Объем', 'Ед. изм.',
        'Прямые Затраты', '', '', '', '', '', '', '', '', '', '', '',
        'Коммерческие Затраты', '', '', '', '', '', '', '', '', '', '', ''
      ]);

      // Строка 2: Подзаголовки (для обоих разделов одинаковые)
      data.push([
        '', '', '', '',
        'Работы', 'Материалы', 'Работы суб.', 'Материал суб.', 'Раб-комп.', 'Мат-комп.', 'Итого работ', 'Итого материалы', 'Итого', 'Итого работ за ед.', 'Итого материалы за ед.', 'Итого за единицу',
        'Работы', 'Материалы', 'Работы суб.', 'Материал суб.', 'Раб-комп.', 'Мат-комп.', 'Итого работ', 'Итого материалы', 'Итого', 'Итого работ за ед.', 'Итого материалы за ед.', 'Итого за единицу'
      ]);

      // Добавляем данные категорий и детализаций
      let categoryIndex = 1;
      filteredData.forEach(category => {
        if (category.is_category) {
          // Пропускаем категории с нулевыми затратами
          if (category.total_cost === 0) {
            return;
          }

          const catNum = String(categoryIndex).padStart(2, '0');

          // Строка категории (жирная с итогами, темный фон)
          const categoryTotalVolume = category.children?.reduce((sum, c) => sum + (c.volume || 0), 0) || 0;
          const categoryTotalWorks = category.works_cost + category.sub_works_cost + category.works_comp_cost;
          const categoryTotalMaterials = category.materials_cost + category.sub_materials_cost + category.materials_comp_cost;

          // Агрегируем данные противоположного типа для категории (суммируем по всем детализациям)
          let oppCatWorks = 0, oppCatMaterials = 0, oppCatSubWorks = 0, oppCatSubMaterials = 0, oppCatWorksComp = 0, oppCatMaterialsComp = 0;
          category.children?.forEach(child => {
            if (child.detail_cost_category_id) {
              const oppCosts = oppositeCostMap.get(child.detail_cost_category_id);
              if (oppCosts) {
                oppCatWorks += oppCosts.works;
                oppCatMaterials += oppCosts.materials;
                oppCatSubWorks += oppCosts.subWorks;
                oppCatSubMaterials += oppCosts.subMaterials;
                oppCatWorksComp += oppCosts.worksComp;
                oppCatMaterialsComp += oppCosts.materialsComp;
              }
            }
          });
          const oppCatTotalWorks = oppCatWorks + oppCatSubWorks + oppCatWorksComp;
          const oppCatTotalMaterials = oppCatMaterials + oppCatSubMaterials + oppCatMaterialsComp;
          const oppCatTotal = oppCatTotalWorks + oppCatTotalMaterials;

          data.push([
            `${catNum}. ${category.cost_category_name.toUpperCase()}`,
            '', // Комментарий
            categoryTotalVolume,
            category.children?.[0]?.unit || 'м2',
            // Прямые затраты (или коммерческие, в зависимости от costType)
            category.works_cost, // Работы
            category.materials_cost, // Материалы
            category.sub_works_cost, // Работы суб.
            category.sub_materials_cost, // Материал суб.
            category.works_comp_cost, // Раб-комп.
            category.materials_comp_cost, // Мат-комп.
            categoryTotalWorks, // Итого работ
            categoryTotalMaterials, // Итого материалы
            category.total_cost, // Итого
            categoryTotalVolume ? categoryTotalWorks / categoryTotalVolume : '', // Итого работ за ед.
            categoryTotalVolume ? categoryTotalMaterials / categoryTotalVolume : '', // Итого материалы за ед.
            categoryTotalVolume ? category.total_cost / categoryTotalVolume : '', // Итого за единицу
            // Коммерческие затраты (или прямые, в зависимости от costType)
            oppCatWorks,
            oppCatMaterials,
            oppCatSubWorks,
            oppCatSubMaterials,
            oppCatWorksComp,
            oppCatMaterialsComp,
            oppCatTotalWorks,
            oppCatTotalMaterials,
            oppCatTotal,
            categoryTotalVolume ? oppCatTotalWorks / categoryTotalVolume : '',
            categoryTotalVolume ? oppCatTotalMaterials / categoryTotalVolume : '',
            categoryTotalVolume ? oppCatTotal / categoryTotalVolume : '',
          ]);

          // Детализации категории с подуровнями
          let detailIndex = 1;
          category.children?.forEach(detail => {
            // Пропускаем детализации с нулевыми затратами
            if (detail.total_cost === 0) {
              return;
            }

            const detailNum = `${catNum}.${String(detailIndex).padStart(2, '0')}.`;
            const detailTotalWorks = detail.works_cost + detail.sub_works_cost + detail.works_comp_cost;
            const detailTotalMaterials = detail.materials_cost + detail.sub_materials_cost + detail.materials_comp_cost;

            // Получаем данные противоположного типа для детализации
            const oppDetailCosts = oppositeCostMap.get(detail.detail_cost_category_id || '') || {
              materials: 0, works: 0, subMaterials: 0, subWorks: 0, materialsComp: 0, worksComp: 0
            };
            const oppDetailTotalWorks = oppDetailCosts.works + oppDetailCosts.subWorks + oppDetailCosts.worksComp;
            const oppDetailTotalMaterials = oppDetailCosts.materials + oppDetailCosts.subMaterials + oppDetailCosts.materialsComp;
            const oppDetailTotal = oppDetailTotalWorks + oppDetailTotalMaterials;

            // Подкатегория (светлый фон)
            data.push([
              `${detailNum} ${detail.detail_category_name}`,
              '', // Комментарий
              detail.volume || '',
              detail.unit || '',
              // Текущий тип затрат
              detail.works_cost || '', // Работы
              detail.materials_cost || '', // Материалы
              detail.sub_works_cost || '', // Работы суб.
              detail.sub_materials_cost || '', // Материал суб.
              detail.works_comp_cost || '', // Раб-комп.
              detail.materials_comp_cost || '', // Мат-комп.
              detailTotalWorks || '', // Итого работ
              detailTotalMaterials || '', // Итого материалы
              detail.total_cost || '', // Итого
              detail.volume ? detailTotalWorks / detail.volume : '', // Итого работ за ед.
              detail.volume ? detailTotalMaterials / detail.volume : '', // Итого материалы за ед.
              detail.volume ? detail.total_cost / detail.volume : '', // Итого за единицу
              // Противоположный тип затрат
              oppDetailCosts.works || '',
              oppDetailCosts.materials || '',
              oppDetailCosts.subWorks || '',
              oppDetailCosts.subMaterials || '',
              oppDetailCosts.worksComp || '',
              oppDetailCosts.materialsComp || '',
              oppDetailTotalWorks || '',
              oppDetailTotalMaterials || '',
              oppDetailTotal || '',
              detail.volume ? oppDetailTotalWorks / detail.volume : '',
              detail.volume ? oppDetailTotalMaterials / detail.volume : '',
              detail.volume ? oppDetailTotal / detail.volume : '',
            ]);

            detailIndex++;
          });

          categoryIndex++;
        }
      });

      // Создаем worksheet из массива
      const ws = XLSX.utils.aoa_to_sheet(data);

      // Настройка ширины колонок (32 колонки)
      ws['!cols'] = [
        { wch: 50 },  // A: Затрата тендера
        { wch: 20 },  // B: Комментарий
        { wch: 12 },  // C: Объем
        { wch: 10 },  // D: Ед. изм.
        // Прямые затраты (или коммерческие)
        { wch: 15 },  // E: Работы
        { wch: 15 },  // F: Материалы
        { wch: 15 },  // G: Работы суб.
        { wch: 15 },  // H: Материал суб.
        { wch: 15 },  // I: Раб-комп.
        { wch: 15 },  // J: Мат-комп.
        { wch: 15 },  // K: Итого работ
        { wch: 15 },  // L: Итого материалы
        { wch: 15 },  // M: Итого
        { wch: 18 },  // N: Итого работ за ед.
        { wch: 20 },  // O: Итого материалы за ед.
        { wch: 18 },  // P: Итого за единицу
        // Коммерческие затраты (или прямые)
        { wch: 15 },  // Q: Работы
        { wch: 15 },  // R: Материалы
        { wch: 15 },  // S: Работы суб.
        { wch: 15 },  // T: Материал суб.
        { wch: 15 },  // U: Раб-комп.
        { wch: 15 },  // V: Мат-комп.
        { wch: 15 },  // W: Итого работ
        { wch: 15 },  // X: Итого материалы
        { wch: 15 },  // Y: Итого
        { wch: 18 },  // Z: Итого работ за ед.
        { wch: 20 },  // AA: Итого материалы за ед.
        { wch: 18 },  // AB: Итого за единицу
      ];

      // Объединяем ячейки
      ws['!merges'] = [
        // Строка 1: "Затрата тендера" (A1:A2)
        { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } },
        // Строка 1: "Комментарий" (B1:B2)
        { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } },
        // Строка 1: "Объем" (C1:C2)
        { s: { r: 0, c: 2 }, e: { r: 1, c: 2 } },
        // Строка 1: "Ед. изм." (D1:D2)
        { s: { r: 0, c: 3 }, e: { r: 1, c: 3 } },
        // Строка 1: "Прямые Затраты" (E1:P1) - 12 колонок
        { s: { r: 0, c: 4 }, e: { r: 0, c: 15 } },
        // Строка 1: "Коммерческие Затраты" (Q1:AB1) - 12 колонок
        { s: { r: 0, c: 16 }, e: { r: 0, c: 27 } },
      ];

      // Стили
      const headerMainStyle = {
        fill: { fgColor: { rgb: 'D4B896' } }, // Темно-бежевый фон как на скриншоте
        font: { bold: true, sz: 11 },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } },
        },
      };

      const headerSubStyle = {
        fill: { fgColor: { rgb: 'E8DCC8' } }, // Светло-бежевый фон
        font: { bold: true, sz: 10 },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } },
        },
      };

      const categoryStyle = {
        fill: { fgColor: { rgb: 'D4B896' } }, // Темно-бежевый для категорий
        font: { bold: true, sz: 10 },
        alignment: { horizontal: 'left', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } },
        },
        numFmt: '# ##0', // Формат без десятичных знаков
      };

      const categoryNumberStyle = {
        ...categoryStyle,
        alignment: { horizontal: 'right', vertical: 'center' },
      };

      const subcategoryStyle = {
        fill: { fgColor: { rgb: 'E8DCC8' } }, // Светло-бежевый для подкатегорий
        font: { sz: 10 },
        alignment: { horizontal: 'left', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } },
        },
        numFmt: '# ##0', // Формат без десятичных знаков
      };

      const subcategoryNumberStyle = {
        ...subcategoryStyle,
        alignment: { horizontal: 'right', vertical: 'center' },
      };

      const dataStyle = {
        fill: { fgColor: { rgb: 'FFFFFF' } }, // Белый фон для данных
        font: { sz: 10 },
        alignment: { horizontal: 'left', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } },
        },
      };

      const numberStyle = {
        ...dataStyle,
        alignment: { horizontal: 'right', vertical: 'center' },
        numFmt: '# ##0', // Формат с разделением разрядов пробелом, без знаков после запятой
      };

      // Применяем стили
      // Строки 1-2: Заголовки (теперь 36 колонок)
      for (let C = 0; C < 36; C++) {
        const cell1 = XLSX.utils.encode_cell({ r: 0, c: C });
        const cell2 = XLSX.utils.encode_cell({ r: 1, c: C });
        if (ws[cell1]) ws[cell1].s = headerMainStyle;
        if (ws[cell2]) ws[cell2].s = headerSubStyle;
      }

      // Применяем стили к данным (начиная со строки 3)
      for (let R = 2; R < data.length; R++) {
        const firstCell = XLSX.utils.encode_cell({ r: R, c: 0 });
        const cellValue = ws[firstCell]?.v ? String(ws[firstCell].v) : '';

        // Определяем уровень вложенности по номеру
        const isCategory = cellValue.match(/^\d{2}\. /); // "01. "
        const isSubcategory = cellValue.match(/^\d{2}\.\d{2}\. /); // "01.01. "
        const isDetail = cellValue.match(/^\d{2}\.\d{2}\.\d{2}\. /); // "01.01.01. "

        for (let C = 0; C < 36; C++) {
          const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[cellRef]) continue;

          if (isCategory) {
            // Для категорий: числовые колонки с числовым форматом
            if (C >= 4 && C <= 35) {
              ws[cellRef].s = categoryNumberStyle;
            } else {
              ws[cellRef].s = categoryStyle;
            }
          } else if (isSubcategory) {
            // Для подкатегорий: числовые колонки с числовым форматом
            if (C >= 4 && C <= 35) {
              ws[cellRef].s = subcategoryNumberStyle;
            } else {
              ws[cellRef].s = subcategoryStyle;
            }
          } else if (isDetail) {
            // Белый фон для конечных элементов
            if (C >= 4 && C <= 35) {
              // Колонки E-AJ: числовые данные
              ws[cellRef].s = numberStyle;
            } else {
              ws[cellRef].s = dataStyle;
            }
          } else {
            // По умолчанию белый фон
            if (C >= 4 && C <= 35) {
              // Колонки E-AJ: числовые данные
              ws[cellRef].s = numberStyle;
            } else {
              ws[cellRef].s = dataStyle;
            }
          }
        }
      }

      // Добавляем worksheet в workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Затраты');

      // Формируем имя файла
      const costTypeLabel = costType === 'base' ? 'Прямые' : 'Коммерческие';
      const fileName = `Затраты_${selectedTenderTitle}_v${selectedVersion || 1}_${costTypeLabel}_${dayjs().format('DD-MM-YYYY')}.xlsx`;

      // Сохраняем файл
      XLSX.writeFile(wb, fileName);
      message.success('Файл успешно экспортирован');
    } catch (error: any) {
      console.error('Ошибка экспорта:', error);
      message.error('Ошибка экспорта: ' + error.message);
    }
  };

  // Рекурсивная фильтрация данных с учетом иерархии
  const filterRow = (row: CostRow): CostRow | null => {
    // Если это категория, фильтруем её дочерние элементы
    if (row.is_category && row.children) {
      const filteredChildren = row.children
        .map(child => filterRow(child))
        .filter((child): child is CostRow => child !== null);

      // Если после фильтрации не осталось дочерних элементов, скрываем категорию
      if (filteredChildren.length === 0) {
        return null;
      }

      // Пересчитываем итоги категории на основе отфильтрованных детей
      const categoryTotals = filteredChildren.reduce(
        (acc, child) => ({
          materials: acc.materials + child.materials_cost,
          works: acc.works + child.works_cost,
          subMaterials: acc.subMaterials + child.sub_materials_cost,
          subWorks: acc.subWorks + child.sub_works_cost,
          total: acc.total + child.total_cost,
        }),
        { materials: 0, works: 0, subMaterials: 0, subWorks: 0, total: 0 }
      );

      // Возвращаем категорию с обновленными итогами
      return {
        ...row,
        children: filteredChildren,
        materials_cost: categoryTotals.materials,
        works_cost: categoryTotals.works,
        sub_materials_cost: categoryTotals.subMaterials,
        sub_works_cost: categoryTotals.subWorks,
        total_cost: categoryTotals.total,
      };
    }

    // Для детализаций применяем фильтры
    // Поиск
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      if (
        !row.cost_category_name.toLowerCase().includes(searchLower) &&
        !row.detail_category_name.toLowerCase().includes(searchLower) &&
        !row.location_name.toLowerCase().includes(searchLower)
      ) {
        return null;
      }
    }

    // Фильтры по столбцам
    if (categoryFilter && row.cost_category_name !== categoryFilter) return null;
    if (detailFilter && row.detail_category_name !== detailFilter) return null;
    if (locationFilter && row.location_name !== locationFilter) return null;

    // Скрыть нули (применяется к детализациям)
    if (hideZeros && row.total_cost === 0) return null;

    return row;
  };

  const filteredData = data
    .map(row => filterRow(row))
    .filter((row): row is CostRow => row !== null);

  // Подсчет итогов
  const totals = filteredData.reduce(
    (acc, row) => ({
      materials: acc.materials + row.materials_cost,
      works: acc.works + row.works_cost,
      subMaterials: acc.subMaterials + row.sub_materials_cost,
      subWorks: acc.subWorks + row.sub_works_cost,
      materialsComp: acc.materialsComp + row.materials_comp_cost,
      worksComp: acc.worksComp + row.works_comp_cost,
      totalWorks: acc.totalWorks + row.works_cost + row.sub_works_cost + row.works_comp_cost,
      totalMaterials: acc.totalMaterials + row.materials_cost + row.sub_materials_cost + row.materials_comp_cost,
      total: acc.total + row.total_cost,
    }),
    { materials: 0, works: 0, subMaterials: 0, subWorks: 0, materialsComp: 0, worksComp: 0, totalWorks: 0, totalMaterials: 0, total: 0 }
  );

  // Получение уникальных значений для фильтров
  const uniqueCategories = Array.from(new Set(data.map(row => row.cost_category_name))).filter(Boolean);
  const uniqueDetails = Array.from(new Set(data.map(row => row.detail_category_name))).filter(Boolean);
  const uniqueLocations = Array.from(new Set(data.map(row => row.location_name))).filter(Boolean);

  // Колонки таблицы
  // Базовые столбцы (одинаковые для обоих режимов)
  const baseColumns: ColumnsType<CostRow> = [
    {
      title: <div style={{ textAlign: 'center' }}>Категория</div>,
      dataIndex: 'cost_category_name',
      key: 'cost_category_name',
      width: 140,
      fixed: 'left',
      render: (value: string, record: CostRow) => {
        // Для строк-категорий отображаем название жирным
        if (record.is_category) {
          return <Text strong style={{ fontSize: '14px' }}>{value}</Text>;
        }
        // Для детальных строк не отображаем (категория показана в родителе)
        return null;
      },
      filterDropdown: () => (
        <div style={{ padding: 8 }}>
          <Select
            placeholder="Выберите категорию"
            style={{ width: 200 }}
            value={categoryFilter}
            onChange={setCategoryFilter}
            allowClear
            options={uniqueCategories.map(c => ({ label: c, value: c }))}
          />
        </div>
      ),
      filterIcon: <SearchOutlined style={{ color: categoryFilter ? '#1890ff' : undefined }} />,
    },
    {
      title: <div style={{ textAlign: 'center' }}>Вид</div>,
      dataIndex: 'detail_category_name',
      key: 'detail_category_name',
      width: 180,
      render: (value: string, record: CostRow) => {
        // Для строк-категорий не отображаем
        if (record.is_category) {
          return null;
        }
        return value;
      },
      filterDropdown: () => (
        <div style={{ padding: 8 }}>
          <Select
            placeholder="Выберите вид"
            style={{ width: 200 }}
            value={detailFilter}
            onChange={setDetailFilter}
            allowClear
            options={uniqueDetails.map(c => ({ label: c, value: c }))}
          />
        </div>
      ),
      filterIcon: <SearchOutlined style={{ color: detailFilter ? '#1890ff' : undefined }} />,
    },
    {
      title: <div style={{ textAlign: 'center' }}>Локация</div>,
      dataIndex: 'location_name',
      key: 'location_name',
      width: 110,
      render: (value: string, record: CostRow) => {
        // Для строк-категорий не отображаем
        if (record.is_category) {
          return null;
        }
        return value;
      },
      filterDropdown: () => (
        <div style={{ padding: 8 }}>
          <Select
            placeholder="Выберите локацию"
            style={{ width: 200 }}
            value={locationFilter}
            onChange={setLocationFilter}
            allowClear
            options={uniqueLocations.map(c => ({ label: c, value: c }))}
          />
        </div>
      ),
      filterIcon: <SearchOutlined style={{ color: locationFilter ? '#1890ff' : undefined }} />,
    },
    {
      title: <div style={{ textAlign: 'center' }}>Объем</div>,
      dataIndex: 'volume',
      key: 'volume',
      width: 100,
      align: 'right',
      render: (value: number, record: CostRow) => {
        // Для строк-категорий не показываем поле ввода
        if (record.is_category) {
          return null;
        }
        // Для детальных строк показываем InputNumber
        return (
          <InputNumber
            value={value}
            onBlur={(e) => {
              const newValue = parseFloat(e.target.value);
              if (!isNaN(newValue)) {
                handleVolumeChange(newValue, record);
              }
            }}
            onPressEnter={(e) => {
              const target = e.target as HTMLInputElement;
              const newValue = parseFloat(target.value);
              if (!isNaN(newValue)) {
                handleVolumeChange(newValue, record);
                target.blur();
              }
            }}
            min={0}
            step={0.01}
            precision={2}
            style={{ width: '100%' }}
            size="small"
          />
        );
      },
    },
    {
      title: <div style={{ textAlign: 'center' }}>Ед.</div>,
      dataIndex: 'unit',
      key: 'unit',
      width: 60,
      align: 'center',
      render: (value: string, record: CostRow) => {
        // Для строк-категорий не отображаем
        if (record.is_category) {
          return null;
        }
        return value;
      },
    },
    {
      title: <div style={{ textAlign: 'center' }}>₽/ед.</div>,
      dataIndex: 'cost_per_unit',
      key: 'cost_per_unit',
      width: 110,
      align: 'right',
      render: (value: number, record: CostRow) => {
        // Для строк-категорий не отображаем
        if (record.is_category) {
          return null;
        }
        return <Text strong>{value.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</Text>;
      },
    },
  ];

  // Детальные столбцы (режим "Детальный")
  const detailedColumns: ColumnsType<CostRow> = [
    {
      title: <div style={{ textAlign: 'center' }}>Мат.</div>,
      key: 'materials_total',
      width: 110,
      align: 'right',
      render: (_: any, record: CostRow) => {
        const total = record.materials_cost + record.materials_comp_cost;
        return total.toLocaleString('ru-RU', { minimumFractionDigits: 0 });
      },
    },
    {
      title: <div style={{ textAlign: 'center' }}>Раб.</div>,
      key: 'works_total',
      width: 110,
      align: 'right',
      render: (_: any, record: CostRow) => {
        const total = record.works_cost + record.works_comp_cost;
        return total.toLocaleString('ru-RU', { minimumFractionDigits: 0 });
      },
    },
    {
      title: <div style={{ textAlign: 'center' }}>Суб-мат.</div>,
      dataIndex: 'sub_materials_cost',
      key: 'sub_materials_cost',
      width: 110,
      align: 'right',
      render: (value: number) => value.toLocaleString('ru-RU', { minimumFractionDigits: 0 }),
    },
    {
      title: <div style={{ textAlign: 'center' }}>Суб-раб.</div>,
      dataIndex: 'sub_works_cost',
      key: 'sub_works_cost',
      width: 110,
      align: 'right',
      render: (value: number) => value.toLocaleString('ru-RU', { minimumFractionDigits: 0 }),
    },
  ];

  // Итоговые столбцы (режим "Итоговый")
  const summaryColumns: ColumnsType<CostRow> = [
    {
      title: <div style={{ textAlign: 'center' }}>Итого работы</div>,
      key: 'total_works',
      width: 130,
      align: 'right',
      render: (_: any, record: CostRow) => {
        const totalWorks = record.works_cost + record.sub_works_cost + record.works_comp_cost;
        return (
          <Text style={{ color: '#0891b2' }}>
            {Math.round(totalWorks).toLocaleString('ru-RU')}
          </Text>
        );
      },
    },
    {
      title: <div style={{ textAlign: 'center' }}>Итого материалы</div>,
      key: 'total_materials',
      width: 150,
      align: 'right',
      render: (_: any, record: CostRow) => {
        const totalMaterials = record.materials_cost + record.sub_materials_cost + record.materials_comp_cost;
        return (
          <Text style={{ color: '#059669' }}>
            {totalMaterials.toLocaleString('ru-RU', { minimumFractionDigits: 0 })}
          </Text>
        );
      },
    },
  ];

  // Финальный столбец "Итого" (всегда)
  const totalColumn: ColumnsType<CostRow> = [
    {
      title: <div style={{ textAlign: 'center' }}>Итого</div>,
      dataIndex: 'total_cost',
      key: 'total_cost',
      width: 120,
      align: 'right',
      fixed: 'right',
      render: (value: number) => (
        <Text strong style={{ color: '#10b981' }}>
          {value.toLocaleString('ru-RU', { minimumFractionDigits: 0 })}
        </Text>
      ),
    },
  ];

  // Собираем итоговые столбцы в зависимости от режима
  const columns: ColumnsType<CostRow> = [
    ...baseColumns,
    ...(viewMode === 'detailed' ? detailedColumns : summaryColumns),
    ...totalColumn,
  ];

  // Если тендер не выбран, показываем только выбор тендера
  if (!selectedTenderId) {
    return (
      <div style={{ margin: '-16px', padding: '24px' }}>
        <Card bordered={false} style={{ height: '100%' }}>
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <Title level={4} style={{ marginBottom: 24 }}>
              Затраты на строительство
            </Title>
            <Text type="secondary" style={{ fontSize: 16, marginBottom: 24, display: 'block' }}>
              Выберите тендер для просмотра затрат
            </Text>
            <Select
              style={{ width: 400, marginBottom: 32 }}
              placeholder="Выберите тендер"
              value={selectedTenderTitle}
              onChange={handleTenderTitleChange}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={getTenderTitles()}
              size="large"
            />

            {selectedTenderTitle && (
              <Select
                style={{ width: 200, marginBottom: 32, marginLeft: 16 }}
                placeholder="Выберите версию"
                value={selectedVersion}
                onChange={handleVersionChange}
                options={getVersionsForTitle(selectedTenderTitle)}
                size="large"
              />
            )}

            {/* Быстрый выбор через карточки */}
            {tenders.length > 0 && (
              <div style={{ marginTop: 32 }}>
                <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                  Или выберите из списка:
                </Text>
                <Row gutter={[16, 16]} justify="center">
                  {tenders.slice(0, 6).map(tender => (
                    <Col key={tender.id}>
                      <Card
                        hoverable
                        style={{
                          width: 200,
                          textAlign: 'center',
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          // При быстром выборе через карточку - автоматически выбираем тендер и версию
                          setSelectedTenderTitle(tender.title);
                          setSelectedVersion(tender.version || 1);
                          setSelectedTenderId(tender.id);
                        }}
                      >
                        <div style={{ marginBottom: 8 }}>
                          <Tag color="blue">{tender.tender_number}</Tag>
                        </div>
                        <div style={{ marginBottom: 8 }}>
                          <Text strong style={{ marginRight: 8 }}>
                            {tender.title}
                          </Text>
                          <Tag color="orange">v{tender.version || 1}</Tag>
                        </div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {tender.client_name}
                        </Text>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ margin: '-16px', padding: '24px', height: 'calc(100vh - 64px)' }}>
      {/* Шапка с кнопкой назад */}
      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
          onClick={() => {
            setSelectedTenderId(null);
            setSelectedTenderTitle(null);
            setSelectedVersion(null);
            setData([]);
          }}
        >
          ← Назад к выбору тендера
        </Button>
      </div>

      {/* Заголовок страницы */}
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          Затраты на строительство [NEW VERSION]
        </Title>
      </div>

      {/* Выбор тендера и версии */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <Space size="small">
          <Text type="secondary">Тендер:</Text>
          <Select
            style={{ width: 300 }}
            placeholder="Выберите тендер"
            value={selectedTenderTitle}
            onChange={handleTenderTitleChange}
            loading={loading}
            options={getTenderTitles()}
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
          />
        </Space>
        {selectedTenderTitle && (
          <Space size="small">
            <Text type="secondary">Версия:</Text>
            <Select
              style={{ width: 150 }}
              placeholder="Выберите версию"
              value={selectedVersion}
              onChange={handleVersionChange}
              options={getVersionsForTitle(selectedTenderTitle)}
            />
          </Space>
        )}
      </div>

      {/* Панель управления и таблица */}
      <Card bordered={false} style={{ height: 'calc(100% - 140px)' }}>
        {/* Панель управления */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            {/* Левая часть - переключатели вертикально */}
            <Space direction="vertical" size="middle">
              <Space>
                <Text>Тип затрат:</Text>
                <Segmented
                  options={[
                    { label: 'Прямые затраты', value: 'base' },
                    { label: 'Коммерческие затраты', value: 'commercial' },
                  ]}
                  value={costType}
                  onChange={(value) => setCostType(value as 'base' | 'commercial')}
                />
              </Space>
              <Space size="large">
                <Space>
                  <Text>Представление:</Text>
                  <Segmented
                    options={[
                      { label: 'Детальное', value: 'detailed' },
                      { label: 'Итоговое', value: 'summary' },
                    ]}
                    value={viewMode}
                    onChange={(value) => setViewMode(value as 'detailed' | 'summary')}
                  />
                </Space>
                <Space>
                  <Switch
                    checkedChildren={<EyeInvisibleOutlined />}
                    unCheckedChildren={<EyeOutlined />}
                    checked={hideZeros}
                    onChange={setHideZeros}
                  />
                  <Text type="secondary">Скрыть нули</Text>
                </Space>
              </Space>
            </Space>

            {/* Правая часть - кнопки и поиск вертикально */}
            <Space direction="vertical" size="middle" align="end">
              <Space>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={handleExport}
                  disabled={!selectedTenderId || filteredData.length === 0}
                >
                  Экспорт
                </Button>
                <Button icon={<ReloadOutlined />} onClick={fetchConstructionCosts}>
                  Обновить
                </Button>
              </Space>
              <Input
                placeholder="Поиск..."
                prefix={<SearchOutlined />}
                style={{ width: 300 }}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Space>
          </div>
        </div>

        {/* Таблица */}
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={filteredData}
            pagination={false}
            size="small"
            scroll={{ y: 'calc(100vh - 340px)' }}
            bordered
            expandable={{
              defaultExpandAllRows: true,
              childrenColumnName: 'children',
              indentSize: 20,
            }}
            summary={() => (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={6}>
                    <Text strong>Итого:</Text>
                  </Table.Summary.Cell>
                  {viewMode === 'detailed' ? (
                    <>
                      <Table.Summary.Cell index={6} align="right">
                        <Text strong>{(totals.materials + totals.materialsComp).toLocaleString('ru-RU', { minimumFractionDigits: 0 })}</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={7} align="right">
                        <Text strong>{(totals.works + totals.worksComp).toLocaleString('ru-RU', { minimumFractionDigits: 0 })}</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={8} align="right">
                        <Text strong>{totals.subMaterials.toLocaleString('ru-RU', { minimumFractionDigits: 0 })}</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={9} align="right">
                        <Text strong>{totals.subWorks.toLocaleString('ru-RU', { minimumFractionDigits: 0 })}</Text>
                      </Table.Summary.Cell>
                    </>
                  ) : (
                    <>
                      <Table.Summary.Cell index={6} align="right">
                        <Text strong style={{ color: '#0891b2' }}>
                          {Math.round(totals.totalWorks).toLocaleString('ru-RU')}
                        </Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={7} align="right">
                        <Text strong style={{ color: '#059669' }}>
                          {totals.totalMaterials.toLocaleString('ru-RU', { minimumFractionDigits: 0 })}
                        </Text>
                      </Table.Summary.Cell>
                    </>
                  )}
                  <Table.Summary.Cell index={viewMode === 'detailed' ? 10 : 8} align="right">
                    <Text strong style={{ color: '#10b981', fontSize: 16 }}>
                      {totals.total.toLocaleString('ru-RU', { minimumFractionDigits: 0 })}
                    </Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />
        </Spin>
      </Card>
    </div>
  );
};

export default ConstructionCostNew;
