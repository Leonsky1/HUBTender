# Документация страницы Номенклатуры

## Обзор

Страница Номенклатуры (`/admin/nomenclatures`) управляет фундаментальными библиотеками наименований материалов и работ, а также единицами измерения. Это основа для всех данных библиотек и BOQ в системе.

**Маршрут**: `/admin/nomenclatures`
**Компонент**: `src/pages/Admin/Nomenclatures/Nomenclatures.tsx`
**Уровень доступа**: Администраторы

## Назначение

**Управление базовыми данными**:
- Библиотека наименований материалов (уникальные имена)
- Библиотека наименований работ (уникальные имена)
- Единицы измерения (код + название)

**Почему отдельно от библиотек?**
- **Нормализация**: Избежание дублирования имен в записях библиотеки
- **Согласованность**: Единый источник правды для наименований
- **Переиспользование**: Несколько элементов библиотеки могут ссылаться на одно имя
- **Оптимизация поиска**: Более быстрый поиск и фильтрация

## Возможности

### 1. Интерфейс с тремя вкладками
- **Вкладка Материалы**: Библиотека наименований материалов
- **Вкладка Работы**: Библиотека наименований работ
- **Вкладка Единицы**: Коды и названия единиц измерения

### 2. Единый поиск
- **Единая строка поиска**: Влияет на активную вкладку
- **Фильтр в реальном времени**: Обновляется по мере ввода
- **Без минимальной длины**: Поиск любого текста
- **Кнопка очистки**: Быстрый сброс

### 3. CRUD операции
- **Добавить**: Создание новых записей (модальная форма)
- **Редактировать**: Inline редактирование (клик для редактирования)
- **Удалить**: Удаление записей (с проверкой использования)
- **Пагинация**: 10, 20, 50, 100 на страницу

### 4. Цветовая система единиц измерения
Согласованная цветовая кодировка в приложении:
- `шт` (штуки) - Синий
- `м` (метры) - Зеленый
- `м2` (кв метры) - Голубой
- `м3` (куб метры) - Фиолетовый
- `кг` (килограммы) - Оранжевый
- `т` (тонны) - Красный
- `л` (литры) - Пурпурный
- `компл` (комплект) - Volcano
- `м.п.` (погонные метры) - Geekblue

### 5. Валидация использования
**Перед удалением**:
- Проверка использования имени в библиотеках
- Проверка использования единицы в материалах/работах
- Предотвращение удаления если используется
- Показ предупреждения с количеством использований

## Компоненты интерфейса

### Компонент MaterialsTab
**Файл**: `src/pages/Admin/Nomenclatures/components/MaterialsTab.tsx`

**Колонки**:
1. Название (редактируемый текст)
2. Код единицы (редактируемый, цветной тег)
3. Действия (кнопки Редактировать, Удалить)

**Возможности**:
- Inline редактирование
- Фильтрация поиском
- Пагинация
- Модальное окно добавления

**Свойства таблицы**:
```typescript
interface MaterialsTabProps {
  data: MaterialName[];
  loading: boolean;
  unitsList: Unit[];
  unitColors: Record<string, string>;
  currentPage: number;
  pageSize: number;
  onDelete: (id: string) => Promise<void>;
  onSave: (id: string, values: any) => Promise<void>;
  onPageChange: (page: number, pageSize: number) => void;
}
```

### Компонент WorksTab
**Файл**: `src/pages/Admin/Nomenclatures/components/WorksTab.tsx`

**Колонки**:
1. Название (редактируемый текст)
2. Код единицы (редактируемый, цветной тег)
3. Действия (кнопки Редактировать, Удалить)

**Возможности**:
- То же, что MaterialsTab
- Отдельный источник данных

**Свойства таблицы**:
```typescript
interface WorksTabProps {
  data: WorkName[];
  loading: boolean;
  unitsList: Unit[];
  unitColors: Record<string, string>;
  currentPage: number;
  pageSize: number;
  onDelete: (id: string) => Promise<void>;
  onSave: (id: string, values: any) => Promise<void>;
  onPageChange: (page: number, pageSize: number) => void;
}
```

### Компонент UnitsTab
**Файл**: `src/pages/Admin/Nomenclatures/components/UnitsTab.tsx`

**Колонки**:
1. Код (редактируемый текст, цветной тег)
2. Название (редактируемый текст)
3. Действия (кнопки Редактировать, Удалить)

**Возможности**:
- Inline редактирование
- Предпросмотр цвета
- Фильтрация поиском (код + название)
- Пагинация

**Свойства таблицы**:
```typescript
interface UnitsTabProps {
  data: Unit[];
  loading: boolean;
  unitColors: Record<string, string>;
  currentPage: number;
  pageSize: number;
  onDelete: (id: string) => Promise<void>;
  onSave: (id: string, values: any) => Promise<void>;
  onPageChange: (page: number, pageSize: number) => void;
}
```

## Модель данных

### Таблица: `material_names`
```sql
CREATE TABLE material_names (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  unit_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_material_names_name ON material_names(name);
```

**Поля**:
- `name`: Уникальное наименование материала (например, "Кирпич керамический")
- `unit_code`: Единица измерения по умолчанию для этого материала (опционально)

**Использование**:
```sql
-- Используется в materials_library
SELECT * FROM materials_library ml
JOIN material_names mn ON ml.material_name_id = mn.id;
```

### Таблица: `work_names`
```sql
CREATE TABLE work_names (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  unit_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_work_names_name ON work_names(name);
```

**Поля**:
- `name`: Уникальное наименование работы (например, "Кирпичная кладка")
- `unit_code`: Единица измерения по умолчанию для этой работы (опционально)

**Использование**:
```sql
-- Используется в works_library
SELECT * FROM works_library wl
JOIN work_names wn ON wl.work_name_id = wn.id;
```

### Таблица: `units`
```sql
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_units_code ON units(code);
```

**Поля**:
- `code`: Сокращение единицы (например, "м2", "шт")
- `name`: Полное название единицы (например, "квадратный метр", "штука")

**Использование**:
```sql
-- Используется в materials_library и works_library через код
SELECT * FROM materials_library WHERE unit_code = 'м2';
```

## API эндпоинты (Supabase)

### Наименования материалов

#### Получение всех
```typescript
const { data, error } = await supabase
  .from('material_names')
  .select('*')
  .order('name', { ascending: true });
```

#### Добавление наименования материала
```typescript
const { data, error } = await supabase
  .from('material_names')
  .insert({
    name: materialName,
    unit_code: defaultUnit,
  })
  .select()
  .single();
```

#### Обновление наименования материала
```typescript
const { error } = await supabase
  .from('material_names')
  .update({
    name: newName,
    unit_code: newUnitCode,
  })
  .eq('id', materialNameId);
```

#### Удаление наименования материала
```typescript
// Сначала проверка использования
const { data: usageCheck, error: checkError } = await supabase
  .from('materials_library')
  .select('id')
  .eq('material_name_id', materialNameId)
  .limit(1);

if (usageCheck && usageCheck.length > 0) {
  throw new Error('Material name is in use');
}

// Удаление, если не используется
const { error } = await supabase
  .from('material_names')
  .delete()
  .eq('id', materialNameId);
```

### Наименования работ

#### Получение всех
```typescript
const { data, error } = await supabase
  .from('work_names')
  .select('*')
  .order('name', { ascending: true });
```

#### Добавление наименования работы
```typescript
const { data, error } = await supabase
  .from('work_names')
  .insert({
    name: workName,
    unit_code: defaultUnit,
  })
  .select()
  .single();
```

#### Обновление наименования работы
```typescript
const { error } = await supabase
  .from('work_names')
  .update({
    name: newName,
    unit_code: newUnitCode,
  })
  .eq('id', workNameId);
```

#### Удаление наименования работы
```typescript
// Сначала проверка использования
const { data: usageCheck } = await supabase
  .from('works_library')
  .select('id')
  .eq('work_name_id', workNameId)
  .limit(1);

if (usageCheck && usageCheck.length > 0) {
  throw new Error('Work name is in use');
}

// Удаление, если не используется
const { error } = await supabase
  .from('work_names')
  .delete()
  .eq('id', workNameId);
```

### Единицы измерения

#### Получение всех
```typescript
const { data, error } = await supabase
  .from('units')
  .select('*')
  .order('code', { ascending: true });
```

#### Добавление единицы
```typescript
const { data, error } = await supabase
  .from('units')
  .insert({
    code: unitCode,
    name: unitName,
  })
  .select()
  .single();
```

#### Обновление единицы
```typescript
const { error } = await supabase
  .from('units')
  .update({
    code: newCode,
    name: newName,
  })
  .eq('id', unitId);
```

#### Удаление единицы
```typescript
// Проверка использования в material_names
const { data: materialUsage } = await supabase
  .from('material_names')
  .select('id')
  .eq('unit_code', unitCode)
  .limit(1);

// Проверка использования в work_names
const { data: workUsage } = await supabase
  .from('work_names')
  .select('id')
  .eq('unit_code', unitCode)
  .limit(1);

if ((materialUsage && materialUsage.length > 0) ||
    (workUsage && workUsage.length > 0)) {
  throw new Error('Unit is in use');
}

// Удаление, если не используется
const { error } = await supabase
  .from('units')
  .delete()
  .eq('id', unitId);
```

## Пользовательские сценарии

### Добавление наименования материала
1. Нажать на вкладку "Материалы"
2. Нажать кнопку "+ Добавить"
3. Открывается модальное окно
4. Ввести наименование материала (например, "Бетон M300")
5. Опционально выбрать единицу по умолчанию
6. Нажать "Создать"
7. Наименование добавлено в таблицу

### Редактирование наименования материала
1. Найти материал в таблице
2. Нажать кнопку "Edit"
3. Строка переходит в режим редактирования
4. Изменить название или единицу
5. Нажать Enter или кликнуть Save
6. Изменения сохранены

### Удаление наименования материала
1. Найти материал в таблице
2. Нажать кнопку "Delete"
3. Система проверяет использование
4. Если используется: Предупреждение, удаление блокируется
5. Если не используется: Диалог подтверждения
6. Нажать "Удалить" для подтверждения
7. Наименование удалено из таблицы

### Добавление единицы
1. Нажать на вкладку "Единицы"
2. Нажать кнопку "+ Добавить"
3. Открывается модальное окно
4. Ввести код единицы (например, "м3")
5. Ввести название единицы (например, "кубический метр")
6. Нажать "Создать"
7. Единица добавлена в таблицу с цветным тегом

### Поиск
1. Ввести в поле поиска (любая вкладка)
2. Таблица фильтруется мгновенно
3. Показываются совпадающие записи
4. Очистить поиск для показа всех

## Управление состоянием

### Состояние компонента
```typescript
interface NomenclaturesState {
  // Материалы
  materialsData: MaterialName[];
  materialsLoading: boolean;

  // Работы
  worksData: WorkName[];
  worksLoading: boolean;

  // Единицы
  unitsData: Unit[];
  unitsLoading: boolean;
  unitsList: Unit[]; // Для выпадающих списков

  // UI
  searchText: string;
  currentPage: number;
  pageSize: number;
}
```

### Пользовательские хуки
- `useMaterials`: CRUD наименований материалов
- `useWorks`: CRUD наименований работ
- `useUnits`: CRUD единиц измерения

**Паттерн хука**:
```typescript
interface UseMaterialsReturn {
  materialsData: MaterialName[];
  loading: boolean;
  loadMaterials: () => Promise<void>;
  saveMaterial: (id: string, values: any) => Promise<void>;
  deleteMaterial: (id: string) => Promise<void>;
}
```

## Inline редактирование

### Активация режима редактирования
```typescript
const handleEdit = (record: MaterialName) => {
  setEditingKey(record.id);
};
```

### Сохранение изменений
```typescript
const handleSave = async (id: string) => {
  const row = await form.validateFields();
  await supabase
    .from('material_names')
    .update(row)
    .eq('id', id);

  setEditingKey('');
  message.success('Сохранено');
  loadMaterials();
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

### Поиск материалов
```typescript
const filteredMaterialsData = materialsData.filter(item =>
  searchText === '' ||
  item.name.toLowerCase().includes(searchText.toLowerCase())
);
```

### Поиск работ
```typescript
const filteredWorksData = worksData.filter(item =>
  searchText === '' ||
  item.name.toLowerCase().includes(searchText.toLowerCase())
);
```

### Поиск единиц
```typescript
const filteredUnitsData = unitsData.filter(item =>
  searchText === '' ||
  item.name.toLowerCase().includes(searchText.toLowerCase()) ||
  item.code.toLowerCase().includes(searchText.toLowerCase())
);
```

## Валидация

### Проверка уникальности имени
```typescript
async function checkUniqueName(name: string, table: string): Promise<boolean> {
  const { data } = await supabase
    .from(table)
    .select('id')
    .eq('name', name);

  return data && data.length === 0;
}

// Перед вставкой
if (!await checkUniqueName(materialName, 'material_names')) {
  message.error('Материал с таким названием уже существует');
  return;
}
```

### Проверка уникальности кода (единицы)
```typescript
async function checkUniqueCode(code: string): Promise<boolean> {
  const { data } = await supabase
    .from('units')
    .select('id')
    .eq('code', code);

  return data && data.length === 0;
}
```

### Проверка использования перед удалением
```typescript
async function checkUsage(
  nameId: string,
  libraryTable: string,
  foreignKey: string
): Promise<number> {
  const { data, count } = await supabase
    .from(libraryTable)
    .select('id', { count: 'exact' })
    .eq(foreignKey, nameId);

  return count || 0;
}

const usageCount = await checkUsage(
  materialNameId,
  'materials_library',
  'material_name_id'
);

if (usageCount > 0) {
  message.error(`Нельзя удалить. Используется в ${usageCount} записях библиотеки`);
  return;
}
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
    onChange: handlePageChange,
  }}
/>
```

## Обработка ошибок

### Дублирование имени
```typescript
try {
  await supabase.from('material_names').insert({ name });
} catch (error: any) {
  if (error.code === '23505') { // Нарушение уникальности
    message.error('Материал с таким названием уже существует');
  } else {
    message.error('Ошибка добавления материала');
  }
}
```

### Удаление используемой записи
```typescript
if (usageCount > 0) {
  Modal.error({
    title: 'Удаление невозможно',
    content: `Это наименование используется в ${usageCount} записях библиотеки. Сначала удалите эти записи.`,
  });
  return;
}
```

### Сетевые ошибки
```typescript
try {
  const { error } = await supabase.from('material_names').insert(data);
  if (error) throw error;
} catch (error) {
  console.error('Error:', error);
  message.error('Ошибка сети. Проверьте подключение.');
}
```

## Оптимизация производительности

### Индексированный поиск
```sql
-- Поиск по именам использует индексы
CREATE INDEX idx_material_names_name ON material_names(name);
CREATE INDEX idx_work_names_name ON work_names(name);
CREATE INDEX idx_units_code ON units(code);
```

### Фильтрация на клиенте
```typescript
// Поиск происходит на клиенте (данные уже загружены)
const filtered = data.filter(item =>
  item.name.toLowerCase().includes(search.toLowerCase())
);
// Быстро, без запросов к БД
```

### Мемоизированные компоненты
```typescript
const columns = useMemo(() => [
  {
    title: 'Наименование',
    dataIndex: 'name',
    // ... render
  },
], [editingKey, form, unitsList]);
```

## Связанные страницы

- **[Library](LIBRARY.md)**: Использует наименования материалов/работ
- **[Position Items](POSITION_ITEMS.md)**: Использует наименования косвенно
- **[Templates](TEMPLATES.md)**: Использует наименования косвенно

## Скриншоты

_Здесь могут быть размещены скриншоты:_
1. Вкладка материалов с inline редактированием
2. Вкладка работ с поиском
3. Вкладка единиц с цветными тегами
4. Модальное окно добавления материала
5. Подтверждение удаления с предупреждением об использовании
6. Фильтрация поиском

## Технические заметки

### Зачем отдельные библиотеки наименований?

**Нормализация базы данных**:
```
Без библиотек наименований:
materials_library: [id, name="Кирпич", price=100]
materials_library: [id, name="Кирпич", price=150] ❌ Дубль

С библиотеками наименований:
material_names: [id=1, name="Кирпич"]
materials_library: [id, material_name_id=1, price=100] ✓
materials_library: [id, material_name_id=1, price=150] ✓
```

**Преимущества**:
- Согласованность: Одно имя, несколько цен
- Поиск: Однократный поиск имени
- Обновления: Изменить имя один раз, влияет на все
- Целостность: Ограничения внешних ключей

### Стратегия хранения единиц

Единицы хранятся как TEXT коды, а не внешние ключи:
```sql
-- materials_library и works_library
unit_code TEXT  -- Прямое хранение кода

-- Преимущества:
-- 1. Простые запросы (без JOIN)
-- 2. Быстрый поиск
-- 3. Гибкость (единицы могут добавляться динамически)

-- Недостаток:
-- Требуется ручная проверка целостности перед удалением единицы
```

## Будущие улучшения

- [ ] Массовый импорт из Excel
- [ ] Алиасы/синонимы наименований
- [ ] Статистика использования наименований
- [ ] Слияние дублирующихся наименований
- [ ] Категории/теги наименований
- [ ] Отслеживание истории наименований
- [ ] Многоязычные наименования
- [ ] Предложения/автодополнение наименований
- [ ] Экспорт наименований в Excel
- [ ] Правила валидации наименований
