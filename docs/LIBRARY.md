# Документация страницы Библиотека

## Обзор

Страница Библиотека (`/library`) обеспечивает комплексное управление библиотеками работ и материалов. Она включает встроенное редактирование, возможности поиска, пагинацию и полные CRUD-операции для работ и материалов, которые служат исходными данными для позиций смет.

**Маршрут**: `/library`
**Компонент**: `src/pages/Library/index.tsx`
**Уровень доступа**: Все аутентифицированные пользователи

## Возможности

### 1. Двойной интерфейс вкладок
- **Вкладка Материалы**: Управление записями библиотеки материалов
- **Вкладка Работы**: Управление записями библиотеки работ
- **Общий поиск**: Единая строка поиска влияет на активную вкладку
- **Состояние вкладок**: Поиск очищается при переключении вкладок

### 2. Встроенное редактирование
- **Редактирование по клику**: Двойной клик или кнопка редактирования
- **Редактируемые поля**:
  - Наименование (через выбор из библиотеки наименований)
  - Код единицы измерения
  - Валюта
  - Цена
  - Статья затрат
  - Тип позиции
- **Способы сохранения**: Кнопка сохранения или клавиша Enter
- **Способы отмены**: Кнопка отмены или клавиша Escape

### 3. Поиск и фильтрация
- **Поиск в реальном времени**: Фильтрует по мере ввода
- **Поля поиска**: Наименование, код единицы
- **Без минимальной длины**: Поиск любой длины
- **Кнопка очистки**: Быстрый сброс поиска

### 4. Пагинация
- **Варианты размера страницы**: 10, 20, 50, 100 элементов на страницу
- **Отображение итогов**: Показывает общее количество элементов
- **Сохранение страницы**: Сохраняет страницу при редактировании
- **Умный сброс**: Возвращает на страницу 1 при поиске

### 5. Добавление новых элементов
- **Модальная форма**: Выделенная форма добавления
- **Обязательные поля**: Наименование, единица, цена
- **Необязательные поля**: Статья затрат
- **Значения по умолчанию**: Валюта RUB, Тип мат/раб

### 6. Удаление элементов
- **Диалог подтверждения**: Предотвращает случайное удаление
- **Проверка каскадности**: Предупреждает, если элемент используется в позициях
- **Опция мягкого удаления**: Архивация вместо удаления

### 7. Цветовая кодировка типов
**Материалы**:
- `мат` (Материал) - Оранжевый (#ff9800)
- `суб-мат` (Субподрядный материал) - Фиолетовый (#9c27b0)
- `мат-комп.` (Компонентный материал) - Красный (#f44336)

**Работы**:
- `раб` (Работа) - Оранжевый (#ff9800)
- `суб-раб` (Субподрядная работа) - Фиолетовый (#9c27b0)
- `раб-комп.` (Компонентная работа) - Красный (#f44336)

### 8. Система цветов для единиц измерения
- `шт` (штуки) - Синий
- `м` (метры) - Зеленый
- `м2` (кв. метры) - Голубой
- `м3` (куб. метры) - Фиолетовый
- `кг` (килограммы) - Оранжевый
- `т` (тонны) - Красный
- `л` (литры) - Пурпурный
- `компл` (комплект) - Volcano
- `м.п.` (погонные метры) - Geekblue

## UI Компоненты

### Компонент Library (Основной)
**Файл**: `src/pages/Library/index.tsx`

**Структура**:
```tsx
<Tabs activeKey={activeTab}>
  <Tab key="materials">
    <MaterialsTab searchText={searchText} />
  </Tab>
  <Tab key="works">
    <WorksTab searchText={searchText} />
  </Tab>
</Tabs>
```

**Дополнительная панель вкладок**:
- Поле ввода для поиска (ширина 250px)
- Кнопка добавления (контекстно-зависимая: "Добавить материал" / "Добавить работу")

### MaterialsTab
**Файл**: `src/pages/Library/MaterialsTab/MaterialsTab.tsx`
**Размер**: ~970 строк (требует рефакторинга до ≤600)

**Возможности**:
- Получение материалов из `materials_library`
- Объединение с `material_names` для поиска наименований
- Встроенное редактирование с компонентами EditableCell
- Пагинация и фильтрация
- Операции добавления/редактирования/удаления

**Колонки**:
1. Наименование (редактируемое, выпадающий список с поиском)
2. Единица измерения (редактируемая, цветной тег)
3. Валюта (редактируемый выпадающий список: RUB, USD, EUR, CNY)
4. Цена (редактируемое число)
5. Статья затрат (редактируемая, автозаполнение)
6. Тип (редактируемый выпадающий список)
7. Действия (Кнопки редактирования и удаления)

### WorksTab
**Файл**: `src/pages/Library/WorksTab/WorksTab.tsx`
**Размер**: ~770 строк (требует рефакторинга до ≤600)

**Возможности**:
- Получение работ из `works_library`
- Объединение с `work_names` для поиска наименований
- Встроенное редактирование с компонентами EditableCell
- Пагинация и фильтрация
- Операции добавления/редактирования/удаления

**Колонки**:
1. Наименование (редактируемое, выпадающий список с поиском)
2. Единица измерения (редактируемая, цветной тег)
3. Валюта (редактируемый выпадающий список: RUB, USD, EUR, CNY)
4. Цена (редактируемое число)
5. Статья затрат (редактируемая, автозаполнение)
6. Тип (редактируемый выпадающий список)
7. Действия (Кнопки редактирования и удаления)

### Компоненты EditableCell
**Назначение**: Переиспользуемые ячейки для встроенного редактирования

**Типы**:
- **TextCell**: Простое текстовое редактирование
- **NumberCell**: Ввод числа с точностью
- **SelectCell**: Выбор из выпадающего списка
- **AutoCompleteCell**: Поиск с подсказками

**Шаблон**:
```tsx
<EditableCell
  editing={editing === record.id}
  value={record.field}
  onChange={(value) => handleFieldChange(record.id, 'field', value)}
  onSave={() => handleSave(record.id)}
  onCancel={handleCancel}
/>
```

### Компоненты AddForm
**MaterialsAddForm** / **WorksAddForm**

**Поля**:
- Наименование (Выбор из библиотеки наименований)
- Код единицы (Выбор из единиц)
- Валюта (Выбор: RUB, USD, EUR, CNY)
- Цена (InputNumber)
- Статья затрат (AutoComplete)
- Тип (Выбор: мат/суб-мат/мат-комп. или раб/суб-раб/раб-комп.)

## Пользовательские сценарии

### Добавление материала
1. Нажать кнопку "Добавить материал"
2. Открывается модальное окно с пустой формой
3. Выбрать наименование материала из выпадающего списка
4. Выбрать код единицы
5. Ввести цену (по умолчанию валюта RUB)
6. Опционально выбрать статью затрат
7. Выбрать тип (по умолчанию мат)
8. Нажать "Создать"
9. Модальное окно закрывается, таблица обновляется

### Редактирование материала (встроенное)
1. Нажать на редактируемую ячейку или кнопку "Редактировать"
2. Ячейка/строка переходит в режим редактирования
3. Изменить значения в редактируемых полях
4. Нажать Enter или кликнуть на иконку Сохранить
5. Изменения сохранены в базе данных
6. Строка выходит из режима редактирования
7. Таблица обновляется с новыми значениями

### Удаление материала
1. Нажать кнопку "Удалить" на строке
2. Появляется модальное окно подтверждения
3. Нажать "Удалить" для подтверждения
4. Элемент удален из базы данных
5. Таблица обновляется

### Поиск материалов
1. Ввести текст в поле поиска
2. Таблица фильтруется в реальном времени
3. Показывает только соответствующие элементы
4. Очистить поиск для отображения всех

### Изменение размера страницы
1. Нажать на выпадающий список размера страницы
2. Выбрать 10, 20, 50 или 100
3. Таблица перерисовывается с новым размером
4. Текущая страница сбрасывается на 1

## Модель данных

### Таблица: `materials_library`

```sql
CREATE TABLE materials_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  material_name_id UUID REFERENCES material_names(id) NOT NULL,
  unit_code TEXT NOT NULL,
  currency TEXT DEFAULT 'RUB',
  material_price NUMERIC(15,2) NOT NULL,
  detail_cost_category_id UUID REFERENCES detail_cost_categories(id),
  material_type TEXT DEFAULT 'мат',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);
```

**Ключевые поля**:
- `material_name_id`: Связь с наименованием материала в таблице `material_names`
- `unit_code`: Единица измерения
- `currency`: Валюта цены (RUB, USD, EUR, CNY)
- `material_price`: Базовая цена в указанной валюте
- `detail_cost_category_id`: Необязательное назначение статьи затрат
- `material_type`: Классификация типа (мат, суб-мат, мат-комп.)

### Таблица: `works_library`

```sql
CREATE TABLE works_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_name_id UUID REFERENCES work_names(id) NOT NULL,
  unit_code TEXT NOT NULL,
  currency TEXT DEFAULT 'RUB',
  work_price NUMERIC(15,2) NOT NULL,
  detail_cost_category_id UUID REFERENCES detail_cost_categories(id),
  work_type TEXT DEFAULT 'раб',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);
```

**Ключевые поля**:
- `work_name_id`: Связь с наименованием работы в таблице `work_names`
- `unit_code`: Единица измерения
- `currency`: Валюта цены (RUB, USD, EUR, CNY)
- `work_price`: Базовая цена в указанной валюте
- `detail_cost_category_id`: Необязательное назначение статьи затрат
- `work_type`: Классификация типа (раб, суб-раб, раб-комп.)

### Связанные таблицы

#### `material_names`
```sql
CREATE TABLE material_names (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  unit_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `work_names`
```sql
CREATE TABLE work_names (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  unit_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `detail_cost_categories`
```sql
CREATE TABLE detail_cost_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cost_category_id UUID REFERENCES cost_categories(id),
  name TEXT NOT NULL,
  unit TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## API-эндпоинты (Supabase)

### Получение материалов
```typescript
const { data, error } = await supabase
  .from('materials_library')
  .select(`
    *,
    material_names (
      id,
      name,
      unit_code
    ),
    detail_cost_categories (
      id,
      name
    )
  `)
  .order('created_at', { ascending: false });
```

### Добавление материала
```typescript
const { data, error } = await supabase
  .from('materials_library')
  .insert({
    material_name_id: materialNameId,
    unit_code: unitCode,
    currency: 'RUB',
    material_price: price,
    detail_cost_category_id: costCategoryId,
    material_type: type,
    user_id: userId,
  })
  .select()
  .single();
```

### Обновление материала
```typescript
const { error } = await supabase
  .from('materials_library')
  .update({
    material_name_id: newMaterialNameId,
    unit_code: newUnitCode,
    currency: newCurrency,
    material_price: newPrice,
    detail_cost_category_id: newCostCategoryId,
    material_type: newType,
    updated_at: new Date().toISOString(),
  })
  .eq('id', materialId);
```

### Удаление материала
```typescript
// Сначала проверить использование
const { data: usageCheck } = await supabase
  .from('boq_items')
  .select('id')
  .eq('material_library_id', materialId)
  .limit(1);

if (usageCheck && usageCheck.length > 0) {
  throw new Error('Material is used in BOQ items');
}

// Удалить, если не используется
const { error } = await supabase
  .from('materials_library')
  .delete()
  .eq('id', materialId);
```

### Получение работ
```typescript
const { data, error } = await supabase
  .from('works_library')
  .select(`
    *,
    work_names (
      id,
      name,
      unit_code
    ),
    detail_cost_categories (
      id,
      name
    )
  `)
  .order('created_at', { ascending: false });
```

### Добавление работы
```typescript
const { data, error } = await supabase
  .from('works_library')
  .insert({
    work_name_id: workNameId,
    unit_code: unitCode,
    currency: 'RUB',
    work_price: price,
    detail_cost_category_id: costCategoryId,
    work_type: type,
    user_id: userId,
  })
  .select()
  .single();
```

### Обновление работы
```typescript
const { error } = await supabase
  .from('works_library')
  .update({
    work_name_id: newWorkNameId,
    unit_code: newUnitCode,
    currency: newCurrency,
    work_price: newPrice,
    detail_cost_category_id: newCostCategoryId,
    work_type: newType,
    updated_at: new Date().toISOString(),
  })
  .eq('id', workId);
```

### Удаление работы
```typescript
// Сначала проверить использование
const { data: usageCheck } = await supabase
  .from('boq_items')
  .select('id')
  .eq('work_library_id', workId)
  .limit(1);

if (usageCheck && usageCheck.length > 0) {
  throw new Error('Work is used in BOQ items');
}

// Удалить, если не используется
const { error } = await supabase
  .from('works_library')
  .delete()
  .eq('id', workId);
```

## Управление состоянием

### Состояние компонента (MaterialsTab)
```typescript
interface MaterialsTabState {
  materials: MaterialLibrary[];
  loading: boolean;
  editingKey: string;
  currentPage: number;
  pageSize: number;
  addModalVisible: boolean;
  searchText: string;
  form: FormInstance;
}
```

### Состояние компонента (WorksTab)
```typescript
interface WorksTabState {
  works: WorkLibrary[];
  loading: boolean;
  editingKey: string;
  currentPage: number;
  pageSize: number;
  addModalVisible: boolean;
  searchText: string;
  form: FormInstance;
}
```

### Пользовательские хуки
- `useMaterials`: Получает и управляет данными материалов
- `useWorks`: Получает и управляет данными работ
- `useCostCategories`: Предоставляет варианты статей затрат
- `useUnits`: Предоставляет варианты единиц измерения

## Шаблон встроенного редактирования

### Активация режима редактирования
```typescript
const handleEdit = (record: Material) => {
  form.setFieldsValue({ ...record });
  setEditingKey(record.id);
};
```

### Сохранение изменений
```typescript
const handleSave = async (id: string) => {
  try {
    const row = await form.validateFields();
    const { error } = await supabase
      .from('materials_library')
      .update(row)
      .eq('id', id);

    if (error) throw error;

    setEditingKey('');
    message.success('Сохранено');
    fetchMaterials();
  } catch (error) {
    message.error('Ошибка сохранения');
  }
};
```

### Отмена редактирования
```typescript
const handleCancel = () => {
  setEditingKey('');
  form.resetFields();
};
```

## Реализация поиска

```typescript
// Фильтрация данных на основе текста поиска
const filteredData = materials.filter(item => {
  if (!searchText) return true;

  const searchLower = searchText.toLowerCase();
  return (
    item.material_names?.name.toLowerCase().includes(searchLower) ||
    item.unit_code.toLowerCase().includes(searchLower)
  );
});
```

## Пагинация

```typescript
<Table
  dataSource={filteredData}
  pagination={{
    current: currentPage,
    pageSize: pageSize,
    showSizeChanger: true,
    pageSizeOptions: ['10', '20', '50', '100'],
    showTotal: (total) => `Всего: ${total}`,
    onChange: (page, newPageSize) => {
      setCurrentPage(page);
      if (newPageSize !== pageSize) {
        setPageSize(newPageSize);
        setCurrentPage(1);
      }
    },
  }}
/>
```

## Оптимизация производительности

### Мемоизированные колонки
```typescript
const columns = useMemo(() => [
  {
    title: 'Наименование',
    dataIndex: 'name',
    render: (_, record) => (
      <EditableCell
        editing={editing === record.id}
        value={record.material_names?.name}
        // ...
      />
    ),
  },
  // ... другие колонки
], [editing, form]);
```

### Отложенный поиск
```typescript
const debouncedSearch = useMemo(
  () => debounce((value: string) => {
    setSearchText(value);
    setCurrentPage(1); // Сброс на первую страницу
  }, 300),
  []
);
```

### Ленивая загрузка
- Данные загружаются при монтировании вкладки
- Повторная загрузка только при CRUD-операциях
- Поиск происходит на стороне клиента

## Обработка ошибок

### Ошибки валидации
```typescript
try {
  await form.validateFields();
} catch (error) {
  message.error('Заполните обязательные поля');
  return;
}
```

### Сетевые ошибки
```typescript
try {
  const { error } = await supabase.from('materials_library').insert(data);
  if (error) throw error;
  message.success('Материал добавлен');
} catch (error) {
  console.error('Error adding material:', error);
  message.error('Ошибка добавления материала');
}
```

### Нарушения ограничений
```typescript
// Проверка на существующее наименование
const { data: existing } = await supabase
  .from('materials_library')
  .select('id')
  .eq('material_name_id', materialNameId)
  .eq('unit_code', unitCode);

if (existing && existing.length > 0) {
  message.warning('Материал с таким наименованием и ед. изм. уже существует');
  return;
}
```

## Связанные страницы

- **[Позиции](POSITION_ITEMS.md)**: Использует данные библиотеки
- **[Шаблоны](TEMPLATES.md)**: Использует данные библиотеки
- **[Номенклатуры](NOMENCLATURES.md)**: Управляет библиотеками наименований

## Скриншоты

_Здесь будут размещены скриншоты, показывающие:_
1. Вкладка материалов со встроенным редактированием
2. Вкладка работ с цветовой кодировкой типов
3. Модальное окно добавления материала
4. Фильтрация поиска
5. Элементы управления пагинацией
6. Редактируемая ячейка в действии
7. Диалог подтверждения удаления

## Технические примечания

### Нарушение ограничения размера файла
Оба MaterialsTab.tsx (~970 строк) и WorksTab.tsx (~770 строк) превышают лимит в 600 строк. Рекомендуемый рефакторинг:

**Предлагаемая структура**:
```
Library/
  MaterialsTab/
    MaterialsTab.tsx (~200 строк)
    components/
      MaterialsTable.tsx
      MaterialsAddForm.tsx
      MaterialsEditableCell.tsx
    hooks/
      useMaterialsCRUD.tsx
      useMaterialsFiltering.tsx
  WorksTab/
    WorksTab.tsx (~200 строк)
    components/
      WorksTable.tsx
      WorksAddForm.tsx
      WorksEditableCell.tsx
    hooks/
      useWorksCRUD.tsx
      useWorksFiltering.tsx
```

### Шаблон библиотеки наименований
Наименования хранятся отдельно для избежания дублирования:
- `material_names`: Уникальные наименования материалов
- `work_names`: Уникальные наименования работ
- Библиотеки ссылаются на наименования по ID
- Выпадающий список показывает все доступные наименования

### Поддержка валют
Поддерживаются все четыре валюты:
- RUB (Российский рубль) - по умолчанию
- USD (Доллар США)
- EUR (Евро)
- CNY (Китайский юань)

Цены хранятся в указанной валюте, конвертируются в RUB при расчетах с использованием курсов валют тендера.

## Будущие улучшения

- [ ] Массовый импорт из Excel
- [ ] Операции массового редактирования
- [ ] Экспорт в Excel
- [ ] Отслеживание истории цен
- [ ] Обнаружение дубликатов
- [ ] Расширенная фильтрация (по типу, категории, диапазону цен)
- [ ] Сортировка по нескольким колонкам
- [ ] Версионирование библиотеки
- [ ] Связи материалов/работ
- [ ] Статистика использования
