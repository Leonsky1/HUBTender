# Документация страницы Конструктор наценок

## Обзор

Конструктор наценок (`/admin/markup_constructor`) — это сложная система для настройки тактик расчёта наценок с упорядоченными последовательностями, базовыми процентами и правилами распределения цен для расчётов строительных тендеров.

**Маршрут**: `/admin/markup_constructor`
**Компонент**: `src/pages/Admin/MarkupConstructor/MarkupConstructor.tsx`
**Уровень доступа**: Администраторы

## Назначение

**Настройка сложных расчётов наценок**:
- Создание тактик наценок (именованные стратегии)
- Определение параметров наценок (правила расчёта)
- Установка последовательности выполнения (порядок имеет значение)
- Настройка распределения цен (как наценка применяется к типам позиций)
- Назначение тактик тендерам

## Возможности

### 1. Интерфейс с тремя вкладками
**Вкладки**:
1. **Порядок применения наценок** (Последовательности/Тактики)
2. **Базовые проценты** (Базовые проценты)
3. **Ценообразование** (Распределение цен)

### 2. Управление тактиками наценок
- **Просмотр списка**: Все тактики для выбранного тендера
- **Создать тактику**: Построить новую стратегию наценок
- **Редактировать тактику**: Изменить существующую стратегию
- **Копировать тактику**: Дублировать для модификации
- **Удалить тактику**: Удалить стратегию
- **Редактирование названия**: Изменение названия в строке

### 3. Настройка последовательности
**Шесть типов последовательностей** (по одной на тип позиции):
- Работы (раб)
- Материалы (мат)
- Субподрядные работы (суб-раб)
- Субподрядные материалы (суб-мат)
- Компонентные работы (раб-комп.)
- Компонентные материалы (мат-комп.)

**Для каждой последовательности**:
- Выбрать применяемые параметры наценок
- Упорядочить параметры (перетаскивание)
- Настроить коэффициенты
- Включить/отключить параметры

### 4. Базовые проценты
**Параметры наценок**:
- Название параметра (метка)
- Базовое значение (к чему применять коэффициент)
- Коэффициент (множитель)
- Флаг процента
- Порядковый номер (последовательность выполнения)

**Операции**:
- Добавить параметр
- Редактировать название параметра
- Изменить порядок параметров (влияет на все последовательности)
- Удалить параметр

### 5. Распределение цен
**Настройка распределения наценки по типам позиций**:
- Процент разделения работ
- Процент разделения материалов
- Субподрядные работы/материалы
- Компонентные работы/материалы

**Правила**:
- Общая сумма должна равняться 100%
- Минимум 0%, максимум 100% на тип
- Валидация в реальном времени
- Опции Сохранить/Сбросить

## UI Компоненты

### Компонент TacticsList
**Назначение**: Просмотр и выбор тактик наценок

**Возможности**:
- Поиск по названию тактики
- Отображение карточек тактик
- Клик для редактирования
- Кнопка создания новой

**Макет карточки**:
```
[Название тактики]
  Создано: [Дата]
  Параметры: [Количество]
  [Выбрать] [Редактировать] [Копировать] [Удалить]
```

### Компонент TacticEditor
**Назначение**: Редактирование названия тактики и навигация по вкладкам

**Элементы**:
- Кнопка возврата к списку
- Название тактики (редактируемое в строке)
- Кнопка сохранения тактики
- Кнопка копирования тактики
- Кнопка удаления тактики
- Подвкладки для последовательностей

### Компонент SequenceTab
**Назначение**: Настройка последовательности параметров для типа позиции

**Возможности**:
- Выбор параметров (множественный выбор)
- Перетаскивание для изменения порядка
- Редактирование коэффициентов на параметр
- Выбор базового значения
- Переключатели включения/отключения

**Колонки таблицы**:
1. Порядок (ручка перетаскивания)
2. Название параметра
3. Базовое значение (выпадающий список)
4. Коэффициент (редактируемое число)
5. Это процент (чекбокс)
6. Действия (удалить из последовательности)

### Компонент BasePercentagesTab
**Назначение**: Управление библиотекой параметров наценок

**Возможности**:
- Добавить новый параметр
- Редактировать метки параметров
- Изменить порядок параметров (глобально)
- Удалить параметры
- Индикатор использования

**Колонки таблицы**:
1. Порядок (ручка перетаскивания)
2. Название параметра (редактируемое)
3. Используется в последовательностях (значок)
4. Действия (редактировать, удалить)

### Компонент PricingTab
**Назначение**: Настройка правил распределения цен

**Возможности**:
- Ползунки процентов для каждого типа
- Числовые поля ввода для точности
- Отображение общего процента
- Валидация (должно равняться 100%)
- Кнопки Сохранить/Сбросить

**Поля распределения**:
- Работы %
- Материалы %
- Субподрядные работы %
- Субподрядные материалы %
- Компонентные работы %
- Компонентные материалы %

## Модель данных

### Таблица: `markup_tactics`
```sql
CREATE TABLE markup_tactics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sequences JSONB, -- Хранит конфигурацию последовательностей
  base_costs JSONB, -- Хранит разбивку базовых затрат
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Поля**:
- `tender_id`: Связь с тендером
- `name`: Название тактики (например, "Базовая схема наценок")
- `sequences`: JSON объект с последовательностями для каждого типа
- `base_costs`: JSON объект с разбивкой затрат

**Структура Sequences**:
```json
{
  "works": [
    {
      "parameter_id": "uuid",
      "order": 0,
      "coefficient": 1.15,
      "base_value": "materials",
      "is_percentage": true
    }
  ],
  "materials": [...],
  "sub_works": [...],
  "sub_materials": [...],
  "comp_works": [...],
  "comp_materials": [...]
}
```

### Таблица: `markup_parameters`
```sql
CREATE TABLE markup_parameters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  markup_tactic_id UUID REFERENCES markup_tactics(id) ON DELETE CASCADE,
  order_number INTEGER NOT NULL,
  parameter_name TEXT NOT NULL,
  base_value TEXT NOT NULL,
  coefficient NUMERIC(10,4) NOT NULL DEFAULT 1,
  is_percentage BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Поля**:
- `order_number`: Последовательность выполнения (критично)
- `parameter_name`: Отображаемое название
- `base_value`: К чему применять (варианты ниже)
- `coefficient`: Значение множителя
- `is_percentage`: Коэффициент - это процент

**Варианты Base Value**:
- `"materials"` - Применить к материалам
- `"works"` - Применить к работам
- `"total_materials_works"` - Применить к сумме
- `"subcontract_materials"` - Применить к суб-материалам
- `"subcontract_works"` - Применить к суб-работам
- `"component_materials"` - Применить к комп-материалам
- `"component_works"` - Применить к комп-работам

### Таблица: `tender_markup_percentage`
```sql
CREATE TABLE tender_markup_percentage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE,
  markup_tactic_id UUID REFERENCES markup_tactics(id) ON DELETE CASCADE,
  base_percentage NUMERIC(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(tender_id, markup_tactic_id)
);
```

**Назначение**: Хранение рассчитанных базовых процентов для комбинации тендер-тактика

## API Endpoints (Supabase)

### Получение тактик
```typescript
const { data, error } = await supabase
  .from('markup_tactics')
  .select('*')
  .eq('tender_id', tenderId)
  .order('created_at', { ascending: false });
```

### Создание тактики
```typescript
const { data, error } = await supabase
  .from('markup_tactics')
  .insert({
    tender_id: tenderId,
    name: tacticName,
    sequences: sequencesConfig,
    base_costs: baseCosts,
  })
  .select()
  .single();
```

### Обновление тактики
```typescript
const { error } = await supabase
  .from('markup_tactics')
  .update({
    name: newName,
    sequences: newSequences,
    updated_at: new Date().toISOString(),
  })
  .eq('id', tacticId);
```

### Удаление тактики
```typescript
const { error } = await supabase
  .from('markup_tactics')
  .delete()
  .eq('id', tacticId);
```

### Копирование тактики
```typescript
const { data: newTactic } = await supabase
  .from('markup_tactics')
  .insert({
    ...originalTactic,
    id: undefined,
    name: `${originalTactic.name} (копия)`,
    created_at: new Date().toISOString(),
  })
  .select()
  .single();
```

### Получение параметров
```typescript
const { data, error } = await supabase
  .from('markup_parameters')
  .select('*')
  .eq('markup_tactic_id', tacticId)
  .order('order_number', { ascending: true });
```

### Добавление параметра
```typescript
const { data, error } = await supabase
  .from('markup_parameters')
  .insert({
    markup_tactic_id: tacticId,
    order_number: nextOrder,
    parameter_name: name,
    base_value: 'materials',
    coefficient: 1,
    is_percentage: true,
  })
  .select()
  .single();
```

### Изменение порядка параметров
```typescript
// Обновить order_number для нескольких параметров
const updates = parameters.map((param, index) => ({
  id: param.id,
  order_number: index,
}));

for (const update of updates) {
  await supabase
    .from('markup_parameters')
    .update({ order_number: update.order_number })
    .eq('id', update.id);
}
```

### Получение распределения цен
```typescript
const { data, error } = await supabase
  .from('tender_markup_percentage')
  .select('*')
  .eq('tender_id', tenderId);
```

### Сохранение распределения цен
```typescript
const { error } = await supabase
  .from('tender_markup_percentage')
  .upsert({
    tender_id: tenderId,
    markup_tactic_id: tacticId,
    base_percentage: calculatedPercentage,
  });
```

## Пользовательские сценарии

### Создание тактики наценок
1. Нажать "Создать новую схему"
2. Открывается редактор тактики
3. Редактировать название тактики (по умолчанию: "Новая схема наценок")
4. **Настроить последовательности**:
   - Нажать на каждую вкладку (Работы, Материалы и т.д.)
   - Добавить параметры в последовательность
   - Установить порядок перетаскиванием
   - Настроить коэффициенты
5. Нажать "Сохранить схему"
6. Тактика создана и сохранена

### Редактирование названия тактики
1. Открыть тактику в редакторе
2. Нажать на поле названия
3. Редактировать в строке
4. Нажать иконку сохранения или Enter
5. Название обновлено

### Настройка последовательности параметров
1. Выбрать тактику для редактирования
2. Нажать на вкладку последовательности (например, "Работы")
3. Увидеть доступные параметры слева
4. **Добавить в последовательность**:
   - Выбрать параметр из списка
   - Нажать "Добавить" или перетащить в последовательность
5. **Изменить порядок**:
   - Перетаскивать параметры для изменения порядка
   - Порядок определяет последовательность расчёта
6. **Настроить**:
   - Редактировать коэффициент (например, 1.15 = 115%)
   - Выбрать базовое значение
   - Переключить флаг процента
7. **Удалить**:
   - Нажать X для удаления из последовательности
8. Сохранить тактику

### Добавление параметра наценки
1. Нажать вкладку "Базовые проценты"
2. Нажать "Добавить параметр"
3. Открывается модальное окно
4. Ввести название параметра (например, "Наценка на материалы")
5. Нажать "Добавить"
6. Параметр добавлен в список
7. Использовать в последовательностях

### Изменение порядка параметров (глобально)
1. Нажать вкладку "Базовые проценты"
2. Перетащить строки параметров для изменения порядка
3. Порядок влияет на все последовательности, использующие этот параметр
4. Автосохранение при отпускании

### Удаление параметра
1. Нажать вкладку "Базовые проценты"
2. Найти параметр в списке
3. Нажать иконку удаления
4. Диалог подтверждения
5. Если параметр используется в последовательностях, показывается предупреждение
6. Подтвердить для удаления из всех последовательностей
7. Параметр удалён

### Настройка распределения цен
1. Нажать вкладку "Ценообразование"
2. Настроить ползунки или ввести числа:
   - Работы: X%
   - Материалы: Y%
   - Субподрядные работы: Z%
   - и т.д.
3. Убедиться что сумма = 100% (показывается валидация)
4. Нажать "Сохранить"
5. Распределение сохранено

### Копирование тактики
1. Открыть тактику в редакторе
2. Нажать "Копировать схему"
3. Появляется диалог подтверждения
4. Нажать "Копировать"
5. Создана новая тактика с суффиксом " (копия)"
6. Все последовательности и параметры скопированы
7. Редактировать по необходимости

## Логика расчёта наценок

### Последовательное выполнение
```typescript
function applyMarkup(
  basePrice: number,
  sequence: SequenceConfig[],
  itemType: string
): number {
  let result = basePrice;

  // Параметры выполняются по порядку
  for (const param of sequence.sort((a, b) => a.order - b.order)) {
    // Получить базовое значение для расчёта
    const base = getBaseValue(param.base_value, result, basePrice);

    // Применить коэффициент
    if (param.is_percentage) {
      result += base * (param.coefficient / 100);
    } else {
      result += base * param.coefficient;
    }
  }

  return result;
}
```

### Разрешение базового значения
```typescript
function getBaseValue(
  baseValueType: string,
  currentResult: number,
  originalPrice: number
): number {
  switch (baseValueType) {
    case 'materials':
      return originalPrice; // Базовая цена материала
    case 'works':
      return originalPrice; // Базовая цена работы
    case 'total_materials_works':
      return currentResult; // Текущая промежуточная сумма
    default:
      return currentResult;
  }
}
```

### Пример расчёта
```typescript
// Базовая цена: 1000 РУБ
// Последовательность:
// 1. Добавить 15% от материалов (base_value="materials", coefficient=15, is_percentage=true)
// 2. Добавить 10% от текущей суммы (base_value="total_materials_works", coefficient=10, is_percentage=true)

let price = 1000;

// Шаг 1: Добавить 15% от материалов
price += 1000 * (15 / 100);  // 1000 + 150 = 1150

// Шаг 2: Добавить 10% от текущей суммы
price += 1150 * (10 / 100);  // 1150 + 115 = 1265

// Итоговая цена: 1265 РУБ
```

### Распределение цен
```typescript
function distributePricing(
  totalMarkup: number,
  distribution: PricingDistribution,
  itemType: string
): number {
  const percentage = distribution[itemType] / 100;
  return totalMarkup * percentage;
}

// Пример:
// Общая наценка: 1000 РУБ
// Распределение: Работы=60%, Материалы=40%

// Работы получают: 1000 * 0.60 = 600
// Материалы получают: 1000 * 0.40 = 400
```

## Управление состоянием

### Состояние компонента
```typescript
interface MarkupConstructorState {
  // Тактики
  tactics: MarkupTactic[];
  currentTacticId: string | null;
  currentTacticName: string;
  loadingTactics: boolean;

  // Параметры
  markupParameters: MarkupParameter[];

  // Последовательности (для каждого типа позиции)
  markupSequences: SequencesConfig;

  // Ценообразование
  pricingDistribution: PricingDistribution | null;

  // UI
  selectedTenderId: string | null;
  isEditingName: boolean;
  editingName: string;
}
```

### Пользовательские хуки
- `useMarkupTactics`: CRUD операции с тактиками
- `useMarkupParameters`: Управление параметрами
- `useMarkupSequences`: Настройка последовательностей
- `usePricingDistribution`: Правила ценообразования

## Правила валидации

### Название тактики
```typescript
function validateTacticName(name: string): boolean {
  if (!name || !name.trim()) {
    message.error('Введите название схемы');
    return false;
  }
  if (name.length > 100) {
    message.error('Название слишком длинное');
    return false;
  }
  return true;
}
```

### Настройка параметра
```typescript
function validateParameter(param: MarkupParameter): boolean {
  if (!param.parameter_name) {
    message.error('Введите название параметра');
    return false;
  }
  if (param.coefficient < 0) {
    message.error('Коэффициент не может быть отрицательным');
    return false;
  }
  return true;
}
```

### Настройка последовательности
```typescript
function validateSequence(sequence: SequenceConfig[]): boolean {
  // Проверить на дублирующиеся порядковые номера
  const orders = sequence.map(s => s.order);
  const uniqueOrders = new Set(orders);

  if (orders.length !== uniqueOrders.size) {
    message.error('Обнаружены дублирующиеся порядковые номера');
    return false;
  }

  return true;
}
```

### Распределение цен
```typescript
function validatePricingDistribution(dist: PricingDistribution): boolean {
  const total = Object.values(dist).reduce((sum, val) => sum + val, 0);

  if (Math.abs(total - 100) > 0.01) { // Допустить 0.01% погрешность округления
    message.error(`Сумма должна быть 100%. Текущая сумма: ${total.toFixed(2)}%`);
    return false;
  }

  // Проверить отдельные диапазоны
  for (const [key, value] of Object.entries(dist)) {
    if (value < 0 || value > 100) {
      message.error(`${key}: значение должно быть от 0 до 100%`);
      return false;
    }
  }

  return true;
}
```

## Реализация перетаскивания

### Настройка React DnD
```typescript
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

<DndProvider backend={HTML5Backend}>
  <SequenceTable />
</DndProvider>
```

### Перетаскиваемая строка
```typescript
const DraggableRow = ({ index, moveRow, children }) => {
  const ref = useRef(null);

  const [, drop] = useDrop({
    accept: 'row',
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        moveRow(item.index, index);
        item.index = index;
      }
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'row',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <tr ref={ref} style={{ opacity: isDragging ? 0.5 : 1 }}>
      {children}
    </tr>
  );
};
```

## Оптимизации производительности

### Мемоизированные последовательности
```typescript
const sequences = useMemo(() =>
  calculateSequences(markupParameters, selectedSequence),
  [markupParameters, selectedSequence]
);
```

### Отложенное сохранение
```typescript
const debouncedSave = useMemo(
  () => debounce(async (tacticId, data) => {
    await saveTactic(tacticId, data);
  }, 500),
  []
);
```

## Обработка ошибок

### Ошибки сохранения тактики
```typescript
try {
  await saveTactic(tacticId, tacticData);
  message.success('Схема наценок сохранена');
} catch (error) {
  console.error('Error saving tactic:', error);
  message.error('Ошибка сохранения схемы наценок');
}
```

### Удаление параметра с проверкой использования
```typescript
const usageCount = sequences.filter(s =>
  s.parameters.some(p => p.id === parameterId)
).length;

if (usageCount > 0) {
  Modal.confirm({
    title: 'Параметр используется',
    content: `Этот параметр используется в ${usageCount} последовательностях. Удалить из всех?`,
    onOk: async () => {
      await deleteParameter(parameterId);
    },
  });
}
```

## Связанные страницы

- **[Position Items](POSITION_ITEMS.md)**: Использует расчёты наценок
- **[Commerce](COMMERCE_PAGE.md)**: Использует тактики наценок
- **[Financial Indicators](FINANCIAL_INDICATORS.md)**: Показывает влияние наценок

## Скриншоты

_Скриншоты будут размещены здесь, показывающие:_
1. Просмотр списка тактик
2. Редактор тактик с вкладками
3. Настройка последовательности с перетаскиванием
4. Управление базовыми процентами
5. Ползунки распределения цен
6. Модальное окно настройки параметров
7. Подтверждение копирования тактики

## Технические примечания

### Почему порядок последовательностей важен

**Порядок выполнения критичен**:
```typescript
// Порядок 1: База → +15% → +10% от результата
// 1000 → 1150 → 1265

// Порядок 2: База → +10% → +15% от результата
// 1000 → 1100 → 1265

// Разный порядок, одинаковый результат если независимы
// Но если base_value ссылается на "total", порядок изменяет результат
```

### Хранение JSONB для последовательностей

Последовательности хранятся как JSONB для гибкости:
- Позволяет динамическую структуру
- Нет миграций схемы для новых полей
- Быстрые операции JSON в PostgreSQL
- Легко версионировать и сравнивать

**Компромисс**: Меньше типобезопасности, требуется больше валидации на уровне приложения.

## Будущие улучшения

- [ ] Библиотека шаблонов тактик
- [ ] UI построителя формул
- [ ] Визуальный предпросмотр расчётов
- [ ] A/B тестирование тактик
- [ ] История производительности тактик
- [ ] Совместное использование тактик между тендерами
- [ ] Расширенные функции базовых значений
- [ ] Условные параметры
- [ ] Группировка параметров
- [ ] Аудит расчётов
