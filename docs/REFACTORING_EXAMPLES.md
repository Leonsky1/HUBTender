# Примеры рефакторинга модулей

## MarkupConstructor - Детальные примеры

### 1. hooks/useMarkupTactics.ts

```typescript
import { useState } from 'react';
import { message } from 'antd';
import { supabase } from '../../../lib/supabase';
import type { MarkupTactic, Tender } from '../../../lib/supabase';
import type { TabKey, MarkupSequences } from '../types';

export const useMarkupTactics = () => {
  const [tactics, setTactics] = useState<MarkupTactic[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentTacticId, setCurrentTacticId] = useState<string | null>(null);
  const [currentTacticName, setCurrentTacticName] = useState<string>('');

  const fetchTactics = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('markup_tactics')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTactics(data || []);
    } catch (error) {
      console.error('Ошибка загрузки тактик:', error);
      message.error('Не удалось загрузить список тактик');
    } finally {
      setLoading(false);
    }
  };

  const fetchTacticFromSupabase = async (tenderId?: string) => {
    try {
      let tacticId: string | null = null;

      if (tenderId) {
        const { data: tenderData } = await supabase
          .from('tenders')
          .select('markup_tactic_id')
          .eq('id', tenderId)
          .single();

        if (tenderData?.markup_tactic_id) {
          tacticId = tenderData.markup_tactic_id;
        }
      }

      if (!tacticId) {
        const { data: globalTactic } = await supabase
          .from('markup_tactics')
          .select('id')
          .eq('name', 'Текущая тактика')
          .eq('is_global', true)
          .single();

        tacticId = globalTactic?.id || null;
      }

      if (!tacticId) {
        console.warn('Не найдена тактика для загрузки');
        return null;
      }

      const { data, error } = await supabase
        .from('markup_tactics')
        .select('*')
        .eq('id', tacticId)
        .single();

      if (error) throw error;

      if (data) {
        setCurrentTacticId(data.id);
        setCurrentTacticName(data.name || 'Текущая тактика');

        // Преобразование из русского формата в английский
        const sequencesEn: MarkupSequences = {
          works: data.sequences['раб'] || [],
          materials: data.sequences['мат'] || [],
          subcontract_works: data.sequences['суб-раб'] || [],
          subcontract_materials: data.sequences['суб-мат'] || [],
          work_comp: data.sequences['раб-комп.'] || [],
          material_comp: data.sequences['мат-комп.'] || [],
        };

        const baseCostsEn = {
          works: data.base_costs['раб'] || 0,
          materials: data.base_costs['мат'] || 0,
          subcontract_works: data.base_costs['суб-раб'] || 0,
          subcontract_materials: data.base_costs['суб-мат'] || 0,
          work_comp: data.base_costs['раб-комп.'] || 0,
          material_comp: data.base_costs['мат-комп.'] || 0,
        };

        return { sequences: sequencesEn, baseCosts: baseCostsEn, tacticId: data.id };
      }

      return null;
    } catch (error) {
      console.error('Ошибка при загрузке тактики:', error);
      return null;
    }
  };

  const saveTactic = async (
    sequences: MarkupSequences,
    baseCosts: Record<TabKey, number>,
    tacticId: string | null,
    tacticName: string
  ) => {
    try {
      // Преобразование в русский формат для БД
      const sequencesRu = {
        'раб': sequences.works,
        'мат': sequences.materials,
        'суб-раб': sequences.subcontract_works,
        'суб-мат': sequences.subcontract_materials,
        'раб-комп.': sequences.work_comp,
        'мат-комп.': sequences.material_comp,
      };

      const baseCostsRu = {
        'раб': baseCosts.works,
        'мат': baseCosts.materials,
        'суб-раб': baseCosts.subcontract_works,
        'суб-мат': baseCosts.subcontract_materials,
        'раб-комп.': baseCosts.work_comp,
        'мат-комп.': baseCosts.material_comp,
      };

      if (tacticId) {
        const { error } = await supabase
          .from('markup_tactics')
          .update({
            name: tacticName,
            sequences: sequencesRu,
            base_costs: baseCostsRu,
            updated_at: new Date().toISOString(),
          })
          .eq('id', tacticId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('markup_tactics')
          .insert({
            name: tacticName,
            sequences: sequencesRu,
            base_costs: baseCostsRu,
            is_global: false,
          })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setCurrentTacticId(data.id);
        }
      }

      message.success('Тактика успешно сохранена');
      return true;
    } catch (error) {
      console.error('Ошибка сохранения тактики:', error);
      message.error('Не удалось сохранить тактику');
      return false;
    }
  };

  const copyTactic = async (sourceTacticId: string, newName: string) => {
    try {
      const { data: sourceTactic, error: fetchError } = await supabase
        .from('markup_tactics')
        .select('*')
        .eq('id', sourceTacticId)
        .single();

      if (fetchError) throw fetchError;

      const { data: newTactic, error: insertError } = await supabase
        .from('markup_tactics')
        .insert({
          name: newName,
          sequences: sourceTactic.sequences,
          base_costs: sourceTactic.base_costs,
          is_global: false,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      message.success(`Тактика "${newName}" успешно создана`);
      await fetchTactics();
      return newTactic.id;
    } catch (error) {
      console.error('Ошибка копирования тактики:', error);
      message.error('Не удалось скопировать тактику');
      return null;
    }
  };

  const deleteTactic = async (tacticId: string) => {
    try {
      const { error } = await supabase
        .from('markup_tactics')
        .delete()
        .eq('id', tacticId);

      if (error) throw error;

      message.success('Тактика удалена');
      await fetchTactics();
    } catch (error) {
      console.error('Ошибка удаления тактики:', error);
      message.error('Не удалось удалить тактику');
    }
  };

  return {
    tactics,
    loading,
    currentTacticId,
    currentTacticName,
    setCurrentTacticName,
    fetchTactics,
    fetchTacticFromSupabase,
    saveTactic,
    copyTactic,
    deleteTactic,
  };
};
```

### 2. components/TacticSelector.tsx

```typescript
import React, { useState } from 'react';
import { Card, Select, Space, Typography, Button, Input, Modal } from 'antd';
import { EditOutlined, CheckOutlined, CloseOutlined, CopyOutlined, DeleteOutlined } from '@ant-design/icons';
import type { Tender, MarkupTactic } from '../../../lib/supabase';

const { Text } = Typography;

interface TacticSelectorProps {
  tenders: Tender[];
  tactics: MarkupTactic[];
  selectedTenderId: string | null;
  selectedTacticId: string | null;
  currentTacticName: string;
  isEditingName: boolean;
  editingName: string;
  tacticSearchText: string;
  loadingTactics: boolean;
  onTenderChange: (tenderId: string) => void;
  onTacticChange: (tacticId: string) => void;
  onStartEditName: () => void;
  onSaveName: () => void;
  onCancelEditName: () => void;
  onNameChange: (name: string) => void;
  onSearchChange: (text: string) => void;
  onCopyTactic: () => void;
  onDeleteTactic: () => void;
}

export const TacticSelector: React.FC<TacticSelectorProps> = ({
  tenders,
  tactics,
  selectedTenderId,
  selectedTacticId,
  currentTacticName,
  isEditingName,
  editingName,
  tacticSearchText,
  loadingTactics,
  onTenderChange,
  onTacticChange,
  onStartEditName,
  onSaveName,
  onCancelEditName,
  onNameChange,
  onSearchChange,
  onCopyTactic,
  onDeleteTactic,
}) => {
  // Фильтрация тактик по поисковому запросу
  const filteredTactics = tactics.filter(tactic =>
    tactic.name.toLowerCase().includes(tacticSearchText.toLowerCase())
  );

  return (
    <Card title="Выбор тендера и схемы наценок" bordered={false}>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {/* Выбор тендера */}
        <div>
          <Text strong>Тендер:</Text>
          <Select
            style={{ width: '100%', marginTop: 8 }}
            placeholder="Выберите тендер"
            value={selectedTenderId}
            onChange={onTenderChange}
            options={tenders.map(t => ({
              value: t.id,
              label: `${t.tender_number} - ${t.title}`,
            }))}
            showSearch
            optionFilterProp="label"
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
          />
        </div>

        {/* Название текущей тактики */}
        {currentTacticName && (
          <div>
            <Text strong>Текущая схема:</Text>
            <Space style={{ marginTop: 8, width: '100%' }}>
              {isEditingName ? (
                <>
                  <Input
                    value={editingName}
                    onChange={(e) => onNameChange(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <Button
                    type="primary"
                    size="small"
                    icon={<CheckOutlined />}
                    onClick={onSaveName}
                  />
                  <Button
                    size="small"
                    icon={<CloseOutlined />}
                    onClick={onCancelEditName}
                  />
                </>
              ) : (
                <>
                  <Text>{currentTacticName}</Text>
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={onStartEditName}
                  />
                </>
              )}
            </Space>
          </div>
        )}

        {/* Поиск схем */}
        <div>
          <Text strong>Загрузить другую схему:</Text>
          <Input.Search
            placeholder="Поиск схем..."
            value={tacticSearchText}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{ width: '100%', marginTop: 8 }}
            allowClear
          />
        </div>

        {/* Список схем */}
        <Select
          style={{ width: '100%' }}
          placeholder="Выберите схему"
          value={selectedTacticId}
          onChange={onTacticChange}
          loading={loadingTactics}
          options={filteredTactics.map(t => ({
            value: t.id,
            label: t.name,
          }))}
        />

        {/* Действия */}
        <Space>
          <Button icon={<CopyOutlined />} onClick={onCopyTactic}>
            Копировать схему
          </Button>
          <Button danger icon={<DeleteOutlined />} onClick={onDeleteTactic}>
            Удалить схему
          </Button>
        </Space>
      </Space>
    </Card>
  );
};
```

### 3. utils/calculations.ts

```typescript
import type { MarkupStep, TabKey } from '../types';
import type { MarkupParameter } from '../../../lib/supabase';

/**
 * Расчет итоговой стоимости для конкретной вкладки
 */
export const calculateTotalCost = (
  baseCost: number,
  markupSequence: MarkupStep[],
  markupParameters: MarkupParameter[],
  formValues: Record<string, number>
): number => {
  let total = baseCost;
  const stepResults: number[] = [];

  for (const step of markupSequence) {
    // Получаем базу для текущего шага
    const base = step.baseIndex === -1 ? baseCost : stepResults[step.baseIndex] || 0;

    // Применяем первую операцию
    total = applyOperation(
      base,
      step.action1,
      step.operand1Type,
      step.operand1Key,
      step.operand1Index,
      step.operand1MultiplyFormat,
      markupParameters,
      formValues,
      stepResults
    );

    // Применяем вторую операцию (если есть)
    if (step.action2 && step.operand2Type) {
      total = applyOperation(
        total,
        step.action2,
        step.operand2Type,
        step.operand2Key,
        step.operand2Index,
        step.operand2MultiplyFormat,
        markupParameters,
        formValues,
        stepResults
      );
    }

    // Применяем третью операцию (если есть)
    if (step.action3 && step.operand3Type) {
      total = applyOperation(
        total,
        step.action3,
        step.operand3Type,
        step.operand3Key,
        step.operand3Index,
        step.operand3MultiplyFormat,
        markupParameters,
        formValues,
        stepResults
      );
    }

    // Применяем четвертую операцию (если есть)
    if (step.action4 && step.operand4Type) {
      total = applyOperation(
        total,
        step.action4,
        step.operand4Type,
        step.operand4Key,
        step.operand4Index,
        step.operand4MultiplyFormat,
        markupParameters,
        formValues,
        stepResults
      );
    }

    // Применяем пятую операцию (если есть)
    if (step.action5 && step.operand5Type) {
      total = applyOperation(
        total,
        step.action5,
        step.operand5Type,
        step.operand5Key,
        step.operand5Index,
        step.operand5MultiplyFormat,
        markupParameters,
        formValues,
        stepResults
      );
    }

    // Сохраняем результат шага
    stepResults.push(total);
  }

  return total;
};

/**
 * Применение одной операции
 */
function applyOperation(
  base: number,
  action: 'multiply' | 'divide' | 'add' | 'subtract',
  operandType: 'markup' | 'step' | 'number',
  operandKey?: string | number,
  operandIndex?: number,
  multiplyFormat?: 'addOne' | 'direct',
  markupParameters?: MarkupParameter[],
  formValues?: Record<string, number>,
  stepResults?: number[]
): number {
  let operandValue = 0;

  // Получаем значение операнда
  if (operandType === 'number') {
    operandValue = Number(operandKey) || 0;
  } else if (operandType === 'step') {
    operandValue = stepResults?.[operandIndex || 0] || 0;
  } else if (operandType === 'markup') {
    const param = markupParameters?.find(p => p.key === operandKey);
    operandValue = formValues?.[param?.key || ''] || 0;
  }

  // Применяем операцию
  switch (action) {
    case 'multiply':
      if (multiplyFormat === 'addOne') {
        return base * (1 + operandValue / 100);
      } else {
        return base * (operandValue / 100);
      }
    case 'divide':
      return operandValue !== 0 ? base / operandValue : base;
    case 'add':
      return base + operandValue;
    case 'subtract':
      return base - operandValue;
    default:
      return base;
  }
}

/**
 * Форматирование формулы для отображения
 */
export const formatFormula = (
  step: MarkupStep,
  markupParameters: MarkupParameter[],
  stepIndex: number
): string => {
  let formula = step.baseIndex === -1 ? 'Базовая стоимость' : `Результат шага ${step.baseIndex + 1}`;

  // Первая операция
  formula += ` ${getActionSymbol(step.action1)} ${formatOperand(step.operand1Type, step.operand1Key, step.operand1Index, markupParameters, step.operand1MultiplyFormat)}`;

  // Вторая операция
  if (step.action2 && step.operand2Type) {
    formula += ` ${getActionSymbol(step.action2)} ${formatOperand(step.operand2Type, step.operand2Key, step.operand2Index, markupParameters, step.operand2MultiplyFormat)}`;
  }

  // Третья операция
  if (step.action3 && step.operand3Type) {
    formula += ` ${getActionSymbol(step.action3)} ${formatOperand(step.operand3Type, step.operand3Key, step.operand3Index, markupParameters, step.operand3MultiplyFormat)}`;
  }

  // Четвертая операция
  if (step.action4 && step.operand4Type) {
    formula += ` ${getActionSymbol(step.action4)} ${formatOperand(step.operand4Type, step.operand4Key, step.operand4Index, markupParameters, step.operand4MultiplyFormat)}`;
  }

  // Пятая операция
  if (step.action5 && step.operand5Type) {
    formula += ` ${getActionSymbol(step.action5)} ${formatOperand(step.operand5Type, step.operand5Key, step.operand5Index, markupParameters, step.operand5MultiplyFormat)}`;
  }

  return formula;
};

function getActionSymbol(action: 'multiply' | 'divide' | 'add' | 'subtract'): string {
  switch (action) {
    case 'multiply': return '×';
    case 'divide': return '÷';
    case 'add': return '+';
    case 'subtract': return '−';
    default: return '';
  }
}

function formatOperand(
  type: 'markup' | 'step' | 'number',
  key?: string | number,
  index?: number,
  markupParameters?: MarkupParameter[],
  multiplyFormat?: 'addOne' | 'direct'
): string {
  if (type === 'number') {
    return String(key);
  } else if (type === 'step') {
    return `Шаг ${(index || 0) + 1}`;
  } else if (type === 'markup') {
    const param = markupParameters?.find(p => p.key === key);
    const label = param?.label || String(key);
    if (multiplyFormat === 'addOne') {
      return `(1 + ${label})`;
    } else {
      return label;
    }
  }
  return '';
}
```

---

## Templates - Примеры компонентов

### hooks/useTemplates.ts

```typescript
import { useState, useCallback } from 'react';
import { message } from 'antd';
import { supabase } from '../../lib/supabase';
import type { Template } from '../../lib/supabase';

interface TemplateWithDetails extends Template {
  cost_category_name?: string;
  detail_category_name?: string;
  location?: string;
  cost_category_full?: string;
}

export const useTemplates = () => {
  const [templates, setTemplates] = useState<TemplateWithDetails[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*, detail_cost_categories(name, location, cost_categories(name))')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedTemplates: TemplateWithDetails[] = (data || []).map((item: any) => {
        const costCategoryName = item.detail_cost_categories?.cost_categories?.name || '';
        const detailCategoryName = item.detail_cost_categories?.name || '';
        const location = item.detail_cost_categories?.location || '';
        const costCategoryFull = costCategoryName && detailCategoryName && location
          ? `${costCategoryName} / ${detailCategoryName} / ${location}`
          : '';

        return {
          ...item,
          cost_category_name: costCategoryName,
          detail_category_name: detailCategoryName,
          location: location,
          cost_category_full: costCategoryFull,
        };
      });

      setTemplates(formattedTemplates);
    } catch (error: any) {
      message.error('Ошибка загрузки шаблонов: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      message.success('Шаблон удален');
      await fetchTemplates();
    } catch (error: any) {
      message.error('Ошибка удаления шаблона: ' + error.message);
    }
  };

  const updateTemplate = async (
    templateId: string,
    name: string,
    detailCostCategoryId: string
  ) => {
    try {
      const { error } = await supabase
        .from('templates')
        .update({
          name,
          detail_cost_category_id: detailCostCategoryId,
        })
        .eq('id', templateId);

      if (error) throw error;

      message.success('Шаблон обновлен');
      await fetchTemplates();
    } catch (error: any) {
      message.error('Ошибка обновления шаблона: ' + error.message);
    }
  };

  return {
    templates,
    loading,
    fetchTemplates,
    deleteTemplate,
    updateTemplate,
  };
};
```

---

## FinancialIndicators - Пример хука

### hooks/useFinancialData.ts

```typescript
import { useState, useCallback } from 'react';
import { message } from 'antd';
import { supabase } from '../../lib/supabase';
import type { Tender } from '../../lib/supabase';

interface IndicatorRow {
  key: string;
  row_number: number;
  indicator_name: string;
  coefficient?: string;
  sp_cost?: number;
  customer_cost?: number;
  total_cost?: number;
  is_header?: boolean;
  is_total?: boolean;
  is_yellow?: boolean;
  tooltip?: string;
}

export const useFinancialData = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<IndicatorRow[]>([]);
  const [spTotal, setSpTotal] = useState<number>(0);
  const [customerTotal, setCustomerTotal] = useState<number>(0);

  const fetchFinancialIndicators = useCallback(async (tenderId: string) => {
    setLoading(true);
    try {
      // Загружаем тендер
      const { data: tender, error: tenderError } = await supabase
        .from('tenders')
        .select('*')
        .eq('id', tenderId)
        .single();

      if (tenderError) throw tenderError;

      // Загружаем тактику
      const { error: tacticError } = await supabase
        .from('markup_tactics')
        .select('*')
        .eq('id', tender.markup_tactic_id)
        .single();

      if (tacticError && tacticError.code !== 'PGRST116') {
        console.error('Ошибка загрузки тактики:', tacticError);
      }

      // Загружаем проценты наценок
      const { data: tenderMarkupPercentages, error: percentagesError } = await supabase
        .from('tender_markup_percentage')
        .select(`
          *,
          markup_parameter:markup_parameters(*)
        `)
        .eq('tender_id', tenderId);

      if (percentagesError) throw percentagesError;

      // Загружаем BOQ items
      const { data: boqItems, error: boqError } = await supabase
        .from('boq_items')
        .select(`
          *,
          client_position:client_positions!inner(tender_id)
        `)
        .eq('client_position.tender_id', tenderId);

      if (boqError) throw boqError;

      // Расчет прямых затрат по типам
      let subcontractWorks = 0;
      let subcontractMaterials = 0;
      let works = 0;
      let materials = 0;
      let materialsComp = 0;
      let worksComp = 0;

      boqItems?.forEach(item => {
        const baseCost = item.total_amount || 0;
        switch (item.boq_item_type) {
          case 'суб-раб':
            subcontractWorks += baseCost;
            break;
          case 'суб-мат':
            subcontractMaterials += baseCost;
            break;
          case 'раб':
            works += baseCost;
            break;
          case 'мат':
            materials += baseCost;
            break;
          case 'мат-комп.':
            materialsComp += baseCost;
            break;
          case 'раб-комп.':
            worksComp += baseCost;
            break;
        }
      });

      // Дальнейшие расчеты...
      // (см. полный код в исходном файле)

      const tableData: IndicatorRow[] = [
        // Формирование данных таблицы
      ];

      setData(tableData);
      setSpTotal(tender.area_sp || 0);
      setCustomerTotal(tender.area_client || 0);
    } catch (error) {
      console.error('Ошибка загрузки показателей:', error);
      message.error('Не удалось загрузить финансовые показатели');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    data,
    spTotal,
    customerTotal,
    fetchFinancialIndicators,
  };
};
```

---

## Общие принципы

1. **Хуки возвращают:**
   - Данные (state)
   - Функции для работы с данными
   - Флаги загрузки/ошибок

2. **Компоненты получают:**
   - Данные через props
   - Callback-функции для действий
   - Минимальная бизнес-логика внутри

3. **Utils содержат:**
   - Чистые функции
   - Без side effects
   - Легко тестируются

4. **Types централизованы:**
   - Все интерфейсы в types.ts
   - Экспортируются через barrel
   - Переиспользуются

5. **Константы выделены:**
   - Магические значения → константы
   - Конфигурация в constants.ts

