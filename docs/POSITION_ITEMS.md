# Документация страницы элементов позиции

## Обзор

Страница элементов позиции (`/positions/:positionId/items`) управляет элементами ведомости объёмов работ (BOQ) - работами и материалами - для отдельных позиций заказчика. Она предоставляет функциональность мгновенного добавления, расчёта цен и возможности связывания материалов с работами.

**Маршрут**: `/positions/:positionId/items`
**Компонент**: `src/pages/PositionItems/PositionItems.tsx`
**Уровень доступа**: Все авторизованные пользователи
**Родитель**: Страница позиций заказчика

## Возможности

### 1. Интерфейс мгновенного добавления
- **Два поля AutoComplete**: Работы и материалы рядом
- **Зелёные кнопки +**: Добавление одним кликом
- **Автозаполнение**: Данные из библиотек предзаполняются
- **Умный поиск**: Нечёткое совпадение по названиям работ/материалов
- **Поддержка шаблонов**: Добавление полных наборов работа-материалы

### 2. Система расчёта цен
- **Три поля цен**:
  - `initial_price`: Базовая цена из библиотеки
  - `calculated_price`: После применения наценки
  - `total_price`: calculated_price × количество
- **Автопересчёт**: При изменении наценки или количества
- **Конвертация валюты**: Автоматическая конвертация USD/EUR/CNY в RUB
- **Рост материалов**: Специальный коэффициент для ценообразования материалов

### 3. Связывание материалов с работами
- **Назначение родительской работы**: Связь материалов с конкретными работами
- **Коэффициент пересчёта**: Расход материала на единицу работы
- **Иерархический вывод**: Материалы с отступом под родительскими работами
- **Мягкое удаление**: `ON DELETE SET NULL` сохраняет материалы
- **Независимые материалы**: Могут существовать без родительской работы

### 4. Встроенное редактирование
- **Раскрываемые строки**: Нажмите редактировать для раскрытия встроенной формы
- **Поля формы работы**:
  - Выбор названия работы
  - Категория затрат
  - Количество
  - Валюта и цена
  - Тип (раб, суб-раб, раб-комп.)
- **Поля формы материала**:
  - Выбор названия материала
  - Связь с родительской работой
  - Коэффициент пересчёта
  - Категория затрат
  - Валюта и цена
  - Тип (мат, суб-мат, мат-комп.)

### 5. Данные ГП (Генподрядчика)
**Обычные позиции**:
- Объём ГП (редактируемый InputNumber)
- Примечание ГП (редактируемый Input)
- Отображается в верхнем правом углу

**Дополнительные работы (ДОП)**:
- Название работы (редактируемое)
- Селектор кода единицы измерения
- Объём ГП (редактируемый)
- Примечание ГП (редактируемое)
- Все поля редактируемые в строке

### 6. Система типов элементов
**Работы**:
- `раб` (Работа) - Оранжевый фон
- `суб-раб` (Субподрядная работа) - Фиолетовый фон
- `раб-комп.` (Компонентная работа) - Красный фон

**Материалы**:
- `мат` (Материал) - Синий фон
- `суб-мат` (Субподрядный материал) - Зелёный фон
- `мат-комп.` (Компонентный материал) - Бирюзовый фон

### 7. Вставка шаблонов
- **Селектор шаблонов**: AutoComplete для поиска шаблонов
- **Массовое добавление**: Вставка всех работ и материалов шаблона
- **Наследование цен**: Использует цены из шаблона
- **Сохранение связей**: Сохраняются связи родитель-потомок

## UI-компоненты

### Заголовок позиции
**Назначение**: Отображение информации о позиции и данных ГП

**Элементы**:
- Кнопка назад с состоянием навигации
- Номер и название позиции
- Тег ДОП для дополнительных работ
- Отображение объёма заказчика
- Редакторы объёма и примечания ГП

### AddItemForm
**Назначение**: Интерфейс мгновенного добавления работ, материалов, шаблонов

**Макет**:
```
[AutoComplete работ] [+] | [AutoComplete материалов] [+] | [AutoComplete шаблонов] [+]
```

**Возможности**:
- Поиск в реальном времени в библиотеках
- Фильтрация с задержкой (300мс)
- Очистка после добавления
- Визуальное разделение между типами

### ItemsTable
**Назначение**: Основная таблица отображения элементов BOQ

**Колонки**:
1. Тип (цветной тег)
2. Название (название работы/материала)
3. Единица измерения
4. Количество
5. Начальная цена
6. Расчётная цена
7. Общая цена
8. Действия (Редактировать, Удалить)

**Возможности строк**:
- Раскрываемые для редактирования
- Цветной фон по типу
- Эффекты при наведении
- Выбор строк

### WorkEditForm
**Назначение**: Встроенная форма редактирования для элементов работ

**Поля**:
- Название работы (Select с поиском)
- Категория затрат (AutoComplete)
- Количество (InputNumber)
- Валюта (Select: RUB, USD, EUR, CNY)
- Цена (InputNumber)
- Тип работы (Select: раб, суб-раб, раб-комп.)

### MaterialEditForm
**Назначение**: Встроенная форма редактирования для элементов материалов

**Поля**:
- Название материала (Select с поиском)
- Родительская работа (Select, необязательно)
- Коэффициент пересчёта (InputNumber, если выбрана родительская работа)
- Категория затрат (AutoComplete)
- Количество (InputNumber)
- Валюта (Select: RUB, USD, EUR, CNY)
- Цена (InputNumber)
- Тип материала (Select: мат, суб-мат, мат-комп.)

## Рабочие процессы пользователя

### Добавление работы
1. Введите название работы в AutoComplete работ
2. Выберите из выпадающих подсказок
3. Нажмите зелёную кнопку +
4. Работа добавлена со значениями по умолчанию
5. Отредактируйте встроенную форму для настройки

### Добавление материала
1. Введите название материала в AutoComplete материалов
2. Выберите из выпадающих подсказок
3. Нажмите зелёную кнопку +
4. Материал добавлен со значениями по умолчанию
5. Отредактируйте встроенную форму для связи с работой и установки коэффициента

### Связывание материала с работой
1. Нажмите "Редактировать" на элементе материала
2. Встроенная форма раскрывается
3. Выберите родительскую работу из выпадающего списка
4. Введите коэффициент пересчёта (например, 0.5 = 0.5 единиц материала на 1 единицу работы)
5. Сохраните изменения
6. Материал теперь с отступом под работой в таблице

### Редактирование цен элементов
1. Нажмите кнопку "Редактировать" на строке элемента
2. Форма раскрывается с текущими значениями
3. Измените поля валюты или цены
4. Сохраните изменения
5. Цены автоматически пересчитываются с наценкой
6. Общая цена обновляется

### Вставка шаблона
1. Введите название шаблона в AutoComplete шаблонов
2. Выберите из выпадающего списка
3. Нажмите зелёную кнопку +
4. Все работы и материалы шаблона добавлены
5. Связи родитель-потомок сохранены
6. Отредактируйте отдельные элементы по необходимости

### Редактирование данных ГП (обычная позиция)
1. Нажмите на поле "Объём ГП"
2. Введите новый объём
3. Нажмите вне поля или нажмите Enter
4. Значение сохранено в базу данных
5. Повторите для примечания ГП

### Редактирование данных ГП (дополнительная работа)
1. Все поля редактируемые в строке
2. Название работы: Текстовый ввод
3. Код единицы измерения: Выпадающий селектор
4. Объём ГП: Числовой ввод
5. Примечание ГП: Текстовый ввод
6. Автосохранение при потере фокуса

## Модель данных

### Основная таблица: `boq_items`

```sql
CREATE TABLE boq_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_position_id UUID REFERENCES client_positions(id) ON DELETE CASCADE,
  boq_item_type boq_item_type NOT NULL,
  work_library_id UUID REFERENCES works_library(id),
  material_library_id UUID REFERENCES materials_library(id),
  parent_work_item_id UUID REFERENCES boq_items(id) ON DELETE SET NULL,
  conversion_coefficient NUMERIC(10,4),
  detail_cost_category_id UUID REFERENCES detail_cost_categories(id),
  quantity NUMERIC(15,3) NOT NULL DEFAULT 1,
  currency TEXT DEFAULT 'RUB',
  material_price NUMERIC(15,2),
  work_price NUMERIC(15,2),
  initial_price NUMERIC(15,2),
  calculated_price NUMERIC(15,2),
  total_price NUMERIC(15,2),
  material_growth_coefficient NUMERIC(10,4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Ключевые поля**:
- `boq_item_type`: ENUM('мат', 'суб-мат', 'мат-комп.', 'раб', 'суб-раб', 'раб-комп.')
- `parent_work_item_id`: Мягкая связь с работой (NULL при удалении работы)
- `conversion_coefficient`: Единицы материала на единицу работы
- `initial_price`: Базовая цена до наценки
- `calculated_price`: После применения наценки
- `total_price`: calculated_price × количество

### Связанные таблицы
- `client_positions`: Родительская позиция
- `works_library`: Справочные данные работ
- `materials_library`: Справочные данные материалов
- `detail_cost_categories`: Назначения категорий затрат
- `work_names`: Справочник названий работ
- `material_names`: Справочник названий материалов
- `units`: Единицы измерения
- `tenders`: Для курсов валют

### ENUM тип: `boq_item_type`
```sql
CREATE TYPE boq_item_type AS ENUM (
  'мат',      -- Материал
  'суб-мат',  -- Субподрядный материал
  'мат-комп.', -- Компонентный материал
  'раб',      -- Работа
  'суб-раб',  -- Субподрядная работа
  'раб-комп.' -- Компонентная работа
);
```

## API-эндпоинты (Supabase)

### Получение позиции и элементов
```typescript
// Получение позиции
const { data: position } = await supabase
  .from('client_positions')
  .select('*')
  .eq('id', positionId)
  .single();

// Получение элементов
const { data: items } = await supabase
  .from('boq_items')
  .select(`
    *,
    work_library:work_library_id(*, work_names(*)),
    material_library:material_library_id(*, material_names(*)),
    detail_cost_category:detail_cost_category_id(*),
    parent_work:parent_work_item_id(
      work_library:work_library_id(work_names(*))
    )
  `)
  .eq('client_position_id', positionId)
  .order('created_at', { ascending: true });
```

### Добавление работы
```typescript
const { data, error } = await supabase
  .from('boq_items')
  .insert({
    client_position_id: positionId,
    boq_item_type: 'раб',
    work_library_id: workLibraryId,
    detail_cost_category_id: costCategoryId,
    quantity: 1,
    currency: 'RUB',
    initial_price: workPrice,
    calculated_price: calculatedPrice,
    total_price: calculatedPrice,
  })
  .select()
  .single();
```

### Добавление материала с родительской работой
```typescript
const { data, error } = await supabase
  .from('boq_items')
  .insert({
    client_position_id: positionId,
    boq_item_type: 'мат',
    material_library_id: materialLibraryId,
    parent_work_item_id: parentWorkId,
    conversion_coefficient: coefficient,
    detail_cost_category_id: costCategoryId,
    quantity: gpVolume * coefficient, // Автоматический расчёт
    currency: 'RUB',
    initial_price: materialPrice,
    calculated_price: calculatedPrice,
    total_price: calculatedPrice * quantity,
  })
  .select()
  .single();
```

### Обновление элемента
```typescript
const { error } = await supabase
  .from('boq_items')
  .update({
    quantity: newQuantity,
    currency: newCurrency,
    initial_price: newPrice,
    calculated_price: recalculatedPrice,
    total_price: recalculatedPrice * newQuantity,
    updated_at: new Date().toISOString(),
  })
  .eq('id', itemId);
```

### Удаление элемента
```typescript
const { error } = await supabase
  .from('boq_items')
  .delete()
  .eq('id', itemId);
```

### Вставка шаблона
```typescript
// 1. Получение элементов шаблона
const { data: templateItems } = await supabase
  .from('template_items')
  .select(`
    *,
    work_library:work_library_id(*),
    material_library:material_library_id(*)
  `)
  .eq('template_id', templateId);

// 2. Создание маппинга ID работ (старый -> новый)
const workIdMap = new Map();

// 3. Сначала вставляем работы
for (const item of templateItems.filter(i => i.kind === 'work')) {
  const { data: newWork } = await supabase
    .from('boq_items')
    .insert({
      client_position_id: positionId,
      boq_item_type: 'раб',
      work_library_id: item.work_library_id,
      // ... другие поля
    })
    .select()
    .single();

  workIdMap.set(item.id, newWork.id);
}

// 4. Вставляем материалы со смапированными родительскими ID
for (const item of templateItems.filter(i => i.kind === 'material')) {
  await supabase
    .from('boq_items')
    .insert({
      client_position_id: positionId,
      boq_item_type: 'мат',
      material_library_id: item.material_library_id,
      parent_work_item_id: item.parent_work_item_id
        ? workIdMap.get(item.parent_work_item_id)
        : null,
      conversion_coefficient: item.conversation_coeff,
      // ... другие поля
    });
}
```

## Расчёты

### Поток расчёта цены
```typescript
// 1. Получаем базовую цену из библиотеки
const basePrice = isWork
  ? workLibrary.work_price
  : materialLibrary.material_price;

// 2. Конвертируем валюту при необходимости
const priceInRub = convertCurrency(
  basePrice,
  currency,
  currencyRates
);

// 3. Применяем тактику наценки
const markedUpPrice = applyMarkupTactic(
  priceInRub,
  markupTactic,
  markupParameters
);

// 4. Применяем коэффициент роста материалов (только для материалов)
const finalPrice = isMaterial
  ? markedUpPrice * (1 + materialGrowthCoefficient)
  : markedUpPrice;

// 5. Рассчитываем итог
const totalPrice = finalPrice * quantity;
```

### Конвертация валюты
```typescript
function getCurrencyRate(currency: string, rates: CurrencyRates): number {
  switch (currency) {
    case 'USD': return rates.usd_rate || 1;
    case 'EUR': return rates.eur_rate || 1;
    case 'CNY': return rates.cny_rate || 1;
    case 'RUB': return 1;
    default: return 1;
  }
}

function convertToRub(amount: number, currency: string, rates: CurrencyRates): number {
  return amount * getCurrencyRate(currency, rates);
}
```

### Количество материала из коэффициента пересчёта
```typescript
// Если материал связан с работой
function calculateMaterialQuantity(
  gpVolume: number,
  conversionCoeff: number
): number {
  return gpVolume * conversionCoeff;
}

// Пример: Объём ГП = 100 м², Коэффициент = 0.5
// Количество материала = 100 × 0.5 = 50 единиц
```

### Применение наценки
```typescript
function applyMarkup(
  basePrice: number,
  parameters: MarkupParameter[],
  itemType: string
): number {
  let result = basePrice;

  // Параметры применяются по порядку
  for (const param of parameters.sort((a, b) => a.order_number - b.order_number)) {
    // Проверяем, применяется ли параметр к этому типу элемента
    if (shouldApplyParameter(param, itemType)) {
      const coefficient = param.coefficient;
      const base = getBaseValue(param.base_value, result, basePrice);

      if (param.is_percentage) {
        result += base * (coefficient / 100);
      } else {
        result += base * coefficient;
      }
    }
  }

  return result;
}
```

## Управление состоянием

### Состояние компонента
```typescript
interface PositionItemsState {
  position: ClientPosition | null;
  items: BoqItem[];
  works: WorkLibrary[];
  materials: MaterialLibrary[];
  templates: Template[];
  loading: boolean;
  currencyRates: CurrencyRates;
  costCategories: CostCategory[];
  workNames: WorkName[];
  materialNames: MaterialName[];
  units: Unit[];
  gpVolume: number;
  gpNote: string;
  workName: string; // Для дополнительных работ
  unitCode: string; // Для дополнительных работ
  expandedRowKeys: string[];
}
```

### Используемые хуки
- `useBoqItems`: Получает данные позиции и элементов
- `useItemActions`: Обрабатывает операции добавления/редактирования/удаления
- `useParams`: Получает positionId из URL
- `useSearchParams`: Управление состоянием навигации

## Система цветового кодирования

### Типы работ
```css
.boq-row-rab {
  background-color: rgba(255, 152, 0, 0.15);
}
.boq-row-sub-rab {
  background-color: rgba(156, 39, 176, 0.15);
}
.boq-row-rab-comp {
  background-color: rgba(244, 67, 54, 0.15);
}
```

### Типы материалов
```css
.boq-row-mat {
  background-color: rgba(33, 150, 243, 0.15);
}
.boq-row-sub-mat {
  background-color: rgba(156, 204, 101, 0.15);
}
.boq-row-mat-comp {
  background-color: rgba(0, 137, 123, 0.15);
}
```

## Паттерн навигации

### К элементам позиции
```typescript
// Со страницы позиций заказчика
navigate(`/positions/${record.id}/items?tenderId=${tenderId}&positionId=${positionId}`);
```

### Назад к позициям заказчика
```typescript
// Сохраняем контекст для подсветки
const tenderId = searchParams.get('tenderId');
const positionId = searchParams.get('positionId');

navigate(
  tenderId && positionId
    ? `/positions?tenderId=${tenderId}&positionId=${positionId}`
    : '/positions'
);
```

## Оптимизации производительности

### Отложенный поиск
- Задержка 300мс для автодополнения
- Отмена предыдущих поисков
- Ограничение результатов выпадающего списка

### Мемоизированные компоненты
- Колонки таблицы мемоизированы
- Рендерер строк мемоизирован
- Компоненты форм мемоизированы

### Ленивая загрузка
- Библиотеки загружаются при монтировании
- Элементы получаются для каждой позиции
- Курсы валют кешируются

## Обработка ошибок

### Валидация
- Обязательные поля принудительно требуются
- Форматы чисел валидируются
- Ограничения внешних ключей проверяются

### Сетевые ошибки
- Уведомления-тосты при сбоях
- Механизм повтора для временных ошибок
- Откат при частичных сбоях

### Обратная связь с пользователем
- Спиннеры загрузки во время операций
- Сообщения об успехе при завершении
- Детали ошибок в уведомлениях

## Связанные страницы

- **[Позиции заказчика](CLIENT_POSITIONS.md)**: Управление родительскими позициями
- **[Библиотека](LIBRARY.md)**: Источник работ и материалов
- **[Шаблоны](TEMPLATES.md)**: Источник вставки шаблонов
- **[Коммерция](COMMERCE_PAGE.md)**: Использует расчётные цены

## Скриншоты

_Здесь будут размещены скриншоты, показывающие:_
1. Заголовок позиции с данными ГП
2. Интерфейс мгновенного добавления
3. Таблица элементов с цветовым кодированием
4. Встроенная форма редактирования работы
5. Встроенная форма редактирования материала с родительской работой
6. Вставка шаблона
7. Разбивка расчёта цены

## Технические заметки

### Паттерн мягкого удаления
```sql
-- Удаление родительской работы не каскадируется на материалы
ALTER TABLE boq_items
  ADD CONSTRAINT fk_parent_work
  FOREIGN KEY (parent_work_item_id)
  REFERENCES boq_items(id)
  ON DELETE SET NULL;
```

### Паттерн автосохранения
```typescript
<InputNumber
  value={gpVolume}
  onChange={(value) => setGpVolume(value || 0)}
  onBlur={handleSaveGPData}
  precision={2}
/>
```

### Условный рендеринг для ДОП
```typescript
{position.is_additional ? (
  <div>
    <Input value={workName} onBlur={saveAdditionalWorkData} />
    <Select value={unitCode} onChange={saveAdditionalWorkData} />
    <InputNumber value={gpVolume} onBlur={saveGPData} />
  </div>
) : (
  <div>
    <Text>Объём заказчика: {position.volume}</Text>
    <InputNumber value={gpVolume} onBlur={saveGPData} />
  </div>
)}
```

## Будущие улучшения

- [ ] Массовые операции (удаление, редактирование нескольких элементов)
- [ ] Копирование элементов между позициями
- [ ] Импорт элементов из Excel
- [ ] История элементов и аудит
- [ ] Расширенная фильтрация и сортировка
- [ ] Примечания и вложения к элементам
- [ ] Ценообразование на основе формул
- [ ] Замена материалов
