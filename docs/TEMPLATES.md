# Документация страницы шаблонов

## Обзор

Страница шаблонов (`/library/templates`) управляет переиспользуемыми наборами работа-материалы, которые могут быть вставлены в позиции заказчика. Она включает архитектуру с двумя таблицами с универсальным хранением элементов и поддержкой иерархической структуры.

**Маршрут**: `/library/templates`
**Компонент**: `src/pages/Library/Templates.tsx`
**Уровень доступа**: Все авторизованные пользователи

## Возможности

### 1. Управление шаблонами
- **Просмотр списка**: Все шаблоны с фильтрацией
- **Создание**: Построение новых шаблонов
- **Режим редактирования**: Изменение существующих шаблонов
- **Удаление**: Удаление шаблонов с подтверждением
- **Вставка**: Добавление шаблона в позиции

### 2. Универсальная таблица элементов
- **Единая таблица**: И работы, и материалы в `template_items`
- **Колонка-дискриминатор**: Поле `kind` ('work' | 'material')
- **CHECK ограничения**: Обеспечивают целостность данных
- **Поддержка иерархии**: Материалы могут связываться с родительскими работами

### 3. Система фильтрации
- **Поиск по названию**: Фильтр по названию шаблона (мин. 2 символа)
- **Категория затрат**: Фильтр по основной категории
- **Детальная категория**: Фильтр по детальной категории
- **Очистка фильтров**: Сброс для показа всех

### 4. Управление элементами шаблона
- **Добавление работ**: Из библиотеки работ
- **Добавление материалов**: Из библиотеки материалов
- **Связывание материалов**: Соединение с родительскими работами
- **Коэффициенты пересчёта**: Расход материала на единицу работы
- **Переупорядочивание**: Изменение последовательности элементов
- **Удаление**: Удаление элементов

### 5. Вставка в позицию
- **Модальный интерфейс**: Выбор тендера и позиции
- **Иерархический выбор**: Перемещение по дереву позиций
- **Массовая вставка**: Все работы и материалы за раз
- **Сохранение связей**: Связи родитель-потомок сохраняются

## UI-компоненты

### Основные вкладки
**Две вкладки**:
1. **Список шаблонов**: Просмотр и управление существующими шаблонами
2. **Создать шаблон**: Построение нового шаблона с нуля

### Компонент TemplatesList
**Назначение**: Отображение и управление существующими шаблонами

**Возможности**:
- Сворачиваемые карточки для каждого шаблона
- Кнопка редактирования (встроенное редактирование)
- Кнопка удаления (с подтверждением)
- Кнопка вставки (открывает селектор позиций)
- Кнопки добавления элементов (при редактировании)

**Макет карточки**:
```
[Название шаблона] [Категория затрат] [Детальная категория]
  ↳ Работ: X элементов
  ↳ Материалов: Y элементов
  [Редактировать] [Удалить] [Вставить в позицию]
```

### Компонент TemplateEditor
**Назначение**: Создание нового шаблона

**Поля формы**:
- Название шаблона (обязательно)
- Категория затрат (выбор с автодополнением)

**Кнопки действий**:
- Добавить работу (зелёная кнопка +)
- Добавить материал (зелёная кнопка +)
- Сохранить шаблон
- Отмена

**Таблица элементов**:
- Показывает добавленные работы и материалы
- Встроенное редактирование коэффициентов
- Удаление отдельных элементов
- Назначение родительской работы

### Компонент TemplateItemsTable
**Назначение**: Отображение и редактирование элементов шаблона

**Колонки**:
1. Тип (тег Работа/Материал)
2. Название
3. Единица измерения
4. Родительская работа (для материалов)
5. Коэффициент пересчёта (для связанных материалов)
6. Категория затрат
7. Действия (Редактировать, Удалить)

**Стиль строк**:
- Работы: Оранжевый фон
- Материалы: Синий фон
- Связанные материалы: С отступом под родительской работой

### InsertTemplateIntoPositionModal
**Назначение**: Выбор позиции для вставки шаблона

**Шаги**:
1. Выбрать тендер (выпадающий список)
2. Выбрать версию (выпадающий список)
3. Выбрать позицию (иерархическое дерево)
4. Подтвердить вставку

**Валидация**:
- Должен быть выбран тендер
- Должна быть выбрана позиция
- Разрешены только листовые позиции

## Рабочие процессы пользователя

### Создание шаблона
1. Нажмите вкладку "Создать шаблон"
2. Введите название шаблона
3. Выберите категорию затрат
4. Добавьте работы:
   - Введите название работы в поиске
   - Выберите из выпадающего списка
   - Нажмите зелёную кнопку +
5. Добавьте материалы:
   - Введите название материала в поиске
   - Выберите из выпадающего списка
   - Нажмите зелёную кнопку +
6. Свяжите материалы с работами:
   - Нажмите на строку материала
   - Выберите родительскую работу
   - Введите коэффициент пересчёта
7. Нажмите "Сохранить шаблон"
8. Шаблон создан и добавлен в список

### Редактирование шаблона
1. Найдите шаблон в списке
2. Нажмите кнопку "Редактировать"
3. Карточка шаблона раскрывается с формой редактирования
4. Измените название шаблона или категорию затрат
5. Добавьте/удалите элементы по необходимости
6. Обновите коэффициенты пересчёта
7. Нажмите "Сохранить" для применения изменений
8. Нажмите "Отмена" для отмены изменений

### Вставка шаблона в позицию
1. Найдите шаблон в списке
2. Нажмите кнопку "Вставить в позицию"
3. Открывается модальное окно
4. Выберите тендер из выпадающего списка
5. Выберите версию
6. Перейдите по дереву позиций для поиска целевой
7. Нажмите на листовую позицию для выбора
8. Нажмите "Вставить шаблон"
9. Все работы и материалы добавлены в позицию
10. Модальное окно закрывается с сообщением об успехе

### Фильтрация шаблонов
1. Введите в поиск по названию (мин. 2 символа)
2. И/или выберите фильтр категории затрат
3. И/или выберите фильтр детальной категории
4. Список шаблонов обновляется мгновенно
5. Нажмите очистить для сброса фильтров

## Модель данных

### Таблица: `templates`
```sql
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  detail_cost_category_id UUID REFERENCES detail_cost_categories(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);
```

**Поля**:
- `name`: Название шаблона
- `detail_cost_category_id`: Связь с категорией затрат
- `user_id`: Владелец (для RLS)

### Таблица: `template_items` (Универсальная)
```sql
CREATE TABLE template_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('work', 'material')),
  work_library_id UUID REFERENCES works_library(id),
  material_library_id UUID REFERENCES materials_library(id),
  parent_work_item_id UUID REFERENCES template_items(id) ON DELETE SET NULL,
  conversation_coeff NUMERIC(10,4),
  position INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- CHECK ограничения для целостности данных
  CONSTRAINT work_item_check CHECK (
    (kind = 'work' AND work_library_id IS NOT NULL AND material_library_id IS NULL AND parent_work_item_id IS NULL)
  ),
  CONSTRAINT material_item_check CHECK (
    (kind = 'material' AND material_library_id IS NOT NULL AND work_library_id IS NULL)
  )
);
```

**Паттерн дискриминатора**:
- `kind = 'work'`: Строка является работой
  - `work_library_id` IS NOT NULL
  - `material_library_id` IS NULL
  - `parent_work_item_id` IS NULL
- `kind = 'material'`: Строка является материалом
  - `material_library_id` IS NOT NULL
  - `work_library_id` IS NULL
  - `parent_work_item_id` может быть NULL или ссылкой на работу

**Ключевые поля**:
- `kind`: Дискриминатор ('work' | 'material')
- `work_library_id`: Связь с работой (только если kind = 'work')
- `material_library_id`: Связь с материалом (только если kind = 'material')
- `parent_work_item_id`: Связь с родительским элементом работы (мягкое удаление)
- `conversation_coeff`: Единицы материала на единицу работы
- `position`: Порядок отображения

### Связанные таблицы
- `works_library`: Исходные данные работ
- `materials_library`: Исходные данные материалов
- `detail_cost_categories`: Назначения категорий затрат
- `work_names`: Справочник названий работ
- `material_names`: Справочник названий материалов

## API-эндпоинты (Supabase)

### Получение всех шаблонов
```typescript
const { data, error } = await supabase
  .from('templates')
  .select(`
    *,
    detail_cost_categories (
      id,
      name,
      cost_categories (
        id,
        name
      )
    )
  `)
  .order('created_at', { ascending: false });
```

### Получение элементов шаблона
```typescript
const { data, error } = await supabase
  .from('template_items')
  .select(`
    *,
    work_library:work_library_id(
      *,
      work_names(*)
    ),
    material_library:material_library_id(
      *,
      material_names(*)
    ),
    parent_work:parent_work_item_id(
      work_library:work_library_id(
        work_names(*)
      )
    )
  `)
  .eq('template_id', templateId)
  .order('position', { ascending: true });
```

### Создание шаблона с элементами
```typescript
// 1. Создать шаблон
const { data: template, error: templateError } = await supabase
  .from('templates')
  .insert({
    name: templateName,
    detail_cost_category_id: costCategoryId,
    user_id: userId,
  })
  .select()
  .single();

if (templateError) throw templateError;

// 2. Вставить работы
const workItems = works.map((work, index) => ({
  template_id: template.id,
  kind: 'work',
  work_library_id: work.id,
  position: index,
}));

const { error: worksError } = await supabase
  .from('template_items')
  .insert(workItems);

if (worksError) throw worksError;

// 3. Вставить материалы
const materialItems = materials.map((material, index) => ({
  template_id: template.id,
  kind: 'material',
  material_library_id: material.id,
  parent_work_item_id: material.parent_work_item_id,
  conversation_coeff: material.conversation_coeff,
  position: works.length + index,
}));

const { error: materialsError } = await supabase
  .from('template_items')
  .insert(materialItems);

if (materialsError) throw materialsError;
```

### Обновление шаблона
```typescript
const { error } = await supabase
  .from('templates')
  .update({
    name: newName,
    detail_cost_category_id: newCostCategoryId,
    updated_at: new Date().toISOString(),
  })
  .eq('id', templateId);
```

### Удаление шаблона
```typescript
// Каскадное удаление обрабатывает template_items автоматически
const { error } = await supabase
  .from('templates')
  .delete()
  .eq('id', templateId);
```

### Добавление работы в шаблон
```typescript
const { data, error } = await supabase
  .from('template_items')
  .insert({
    template_id: templateId,
    kind: 'work',
    work_library_id: workLibraryId,
    position: nextPosition,
  })
  .select()
  .single();
```

### Добавление материала в шаблон
```typescript
const { data, error } = await supabase
  .from('template_items')
  .insert({
    template_id: templateId,
    kind: 'material',
    material_library_id: materialLibraryId,
    parent_work_item_id: parentWorkItemId, // Может быть null
    conversation_coeff: coefficient, // Может быть null
    position: nextPosition,
  })
  .select()
  .single();
```

### Обновление коэффициента элемента
```typescript
const { error } = await supabase
  .from('template_items')
  .update({
    conversation_coeff: newCoefficient,
  })
  .eq('id', itemId);
```

### Обновление родителя элемента
```typescript
const { error } = await supabase
  .from('template_items')
  .update({
    parent_work_item_id: newParentId,
  })
  .eq('id', itemId);
```

### Удаление элемента шаблона
```typescript
const { error } = await supabase
  .from('template_items')
  .delete()
  .eq('id', itemId);
```

## Логика вставки шаблона

### Шаг 1: Получение элементов шаблона
```typescript
const { data: templateItems } = await supabase
  .from('template_items')
  .select(`
    *,
    work_library:work_library_id(*),
    material_library:material_library_id(*)
  `)
  .eq('template_id', templateId);
```

### Шаг 2: Создание маппинга ID
```typescript
// Маппинг старых ID template_items на новые ID boq_items
const workIdMap = new Map<string, string>();
```

### Шаг 3: Вставка работ
```typescript
for (const item of templateItems.filter(i => i.kind === 'work')) {
  const { data: newBoqItem } = await supabase
    .from('boq_items')
    .insert({
      client_position_id: positionId,
      boq_item_type: 'раб',
      work_library_id: item.work_library_id,
      quantity: 1,
      currency: item.work_library.currency,
      initial_price: item.work_library.work_price,
      // ... расчёт цен
    })
    .select()
    .single();

  // Маппинг старого ID на новый ID
  workIdMap.set(item.id, newBoqItem.id);
}
```

### Шаг 4: Вставка материалов со смапированными родителями
```typescript
for (const item of templateItems.filter(i => i.kind === 'material')) {
  // Разрешить ID родительской работы
  const newParentId = item.parent_work_item_id
    ? workIdMap.get(item.parent_work_item_id)
    : null;

  await supabase
    .from('boq_items')
    .insert({
      client_position_id: positionId,
      boq_item_type: 'мат',
      material_library_id: item.material_library_id,
      parent_work_item_id: newParentId,
      conversion_coefficient: item.conversation_coeff,
      quantity: 1,
      currency: item.material_library.currency,
      initial_price: item.material_library.material_price,
      // ... расчёт цен
    });
}
```

## Расчёты

### Следующий номер позиции
```typescript
function getNextPosition(items: TemplateItem[]): number {
  if (items.length === 0) return 0;
  return Math.max(...items.map(i => i.position)) + 1;
}
```

### Количество материала из коэффициента
```typescript
// При вставке в позицию
function calculateMaterialQuantity(
  gpVolume: number,
  coefficient: number | null
): number {
  if (!coefficient) return 1; // Количество по умолчанию
  return gpVolume * coefficient;
}

// Пример: Объём ГП = 100, Коэффициент = 0.5
// Количество материала = 50
```

## Управление состоянием

### Состояние компонента
```typescript
interface TemplatesState {
  templates: Template[];
  loadedTemplateItems: Record<string, TemplateItem[]>;
  openedTemplate: string | null;
  editingTemplate: string | null;
  selectedTemplateForInsert: string | null;
  insertModalOpen: boolean;

  // Состояние создания
  templateItems: TemplateItem[];
  selectedWork: string | null;
  selectedMaterial: string | null;

  // Фильтры
  templateSearchText: string;
  filterCostCategory: string | null;
  filterDetailCategory: string | null;
}
```

### Пользовательские хуки
- `useTemplates`: Получает и управляет шаблонами
- `useTemplateItems`: Управляет загрузкой элементов шаблона
- `useLibraryData`: Предоставляет работы, материалы, категории затрат
- `useTemplateCreation`: Обрабатывает создание нового шаблона
- `useTemplateEditing`: Обрабатывает редактирование шаблона

## Стилизация строк

### CSS-классы
```css
.template-row-work {
  background-color: rgba(255, 152, 0, 0.1);
}

.template-row-material {
  background-color: rgba(33, 150, 243, 0.1);
}

.template-row-material-linked {
  padding-left: 24px;
}
```

### Назначение классов
```typescript
function getRowClassName(record: TemplateItem): string {
  if (record.kind === 'work') {
    return 'template-row-work';
  }
  if (record.parent_work_item_id) {
    return 'template-row-material template-row-material-linked';
  }
  return 'template-row-material';
}
```

## Логика фильтрации

```typescript
const filteredTemplates = templates.filter(template => {
  // Фильтр по названию (мин. 2 символа)
  if (
    templateSearchText.length >= 2 &&
    !template.name.toLowerCase().includes(templateSearchText.toLowerCase())
  ) {
    return false;
  }

  // Фильтр категории затрат
  if (
    filterCostCategory &&
    template.cost_category_name !== filterCostCategory
  ) {
    return false;
  }

  // Фильтр детальной категории
  if (
    filterDetailCategory &&
    template.detail_category_name !== filterDetailCategory
  ) {
    return false;
  }

  return true;
});
```

## Оптимизации производительности

### Ленивая загрузка элементов шаблона
- Элементы загружаются только при открытии шаблона
- Кешируются в состоянии после первой загрузки
- Перезагрузка только при редактировании

### Мемоизированные колонки
```typescript
const columns = useMemo(() =>
  createTemplateColumns(
    isCreating,
    currentItems,
    templateId,
    isEditing,
    isAddingItems,
    currentTheme,
    handlers
  ),
  [isCreating, currentItems, templateId, isEditing, isAddingItems, currentTheme]
);
```

### Отложенный поиск
```typescript
const debouncedSearch = useMemo(
  () => debounce((value: string) => {
    setTemplateSearchText(value);
  }, 300),
  []
);
```

## Обработка ошибок

### Валидация
```typescript
// Название шаблона обязательно
if (!templateName.trim()) {
  message.error('Введите название шаблона');
  return;
}

// Должен быть хотя бы один элемент
if (templateItems.length === 0) {
  message.error('Добавьте хотя бы один элемент');
  return;
}
```

### Нарушение ограничений
```typescript
// Проверка связанных материалов с отсутствующими коэффициентами
const invalidMaterials = templateItems.filter(
  item =>
    item.kind === 'material' &&
    item.parent_work_item_id &&
    !item.conversation_coeff
);

if (invalidMaterials.length > 0) {
  message.error('Укажите коэффициент для связанных материалов');
  return;
}
```

### Сетевые ошибки
```typescript
try {
  const { error } = await supabase.from('templates').insert(data);
  if (error) throw error;
  message.success('Шаблон создан');
} catch (error) {
  console.error('Error creating template:', error);
  message.error('Ошибка создания шаблона');
}
```

## Связанные страницы

- **[Элементы позиций](POSITION_ITEMS.md)**: Принимает вставки шаблонов
- **[Библиотека](LIBRARY.md)**: Источник работ и материалов
- **[Позиции заказчика](CLIENT_POSITIONS.md)**: Цель для вставки шаблонов

## Скриншоты

_Здесь будут размещены скриншоты, показывающие:_
1. Просмотр списка шаблонов
2. Интерфейс создания шаблона
3. Режим редактирования шаблона
4. Модальное окно вставки в позицию
5. Элементы управления фильтрами
6. Таблица элементов шаблона со связанными материалами
7. Редактирование коэффициента пересчёта

## Технические заметки

### Паттерн универсальной таблицы
Таблица `template_items` использует колонку-дискриминатор (`kind`) для хранения как работ, так и материалов в одной таблице. Этот подход:

**Преимущества**:
- Единый запрос для получения всех элементов
- Унифицированное упорядочивание позиций
- Упрощённое каскадное удаление
- Более простые связи родитель-потомок

**Недостатки**:
- Требуются CHECK ограничения для целостности
- NULL колонки в зависимости от kind
- Более сложные запросы

**Альтернатива**: Отдельные таблицы `template_works` и `template_materials`

### Мягкое удаление для родительских работ
При удалении родительской работы из шаблона, связанные материалы не удаляются:
```sql
FOREIGN KEY (parent_work_item_id)
REFERENCES template_items(id)
ON DELETE SET NULL
```

Это позволяет материалам:
- Оставаться в шаблоне
- Стать независимыми
- Быть связанными с другой работой

### Упорядочивание позиций
Элементы отображаются в порядке поля `position`. При добавлении:
```typescript
const maxPosition = Math.max(...existingItems.map(i => i.position), -1);
const newPosition = maxPosition + 1;
```

## Будущие улучшения

- [ ] Категории/теги шаблонов
- [ ] Поиск шаблонов по содержимому
- [ ] Копирование/дублирование шаблонов
- [ ] Версионность шаблонов
- [ ] Экспорт/импорт шаблонов
- [ ] Массовые операции с шаблонами
- [ ] Статистика использования шаблонов
- [ ] Совместное использование шаблонов между пользователями
- [ ] Процесс согласования шаблонов
- [ ] Поле документации шаблона
