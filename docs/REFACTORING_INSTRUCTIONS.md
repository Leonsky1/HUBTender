# Инструкции по рефакторингу TenderHUB

## Обзор

Данный документ содержит пошаговые инструкции для выполнения рефакторинга всех файлов проекта, превышающих 600 строк кода.

**Цель**: Разбить большие файлы на модули ≤600 строк для улучшения читаемости, поддержки и тестируемости кода.

**Статус**: ГОТОВ К РЕАЛИЗАЦИИ

---

## Подготовка

### 1. Резервное копирование

Перед началом рефакторинга создайте резервную копию проекта:

```bash
git add .
git commit -m "Сохранить текущее состояние перед рефакторингом"
git branch refactoring-backup
```

### 2. Создайте новую ветку для рефакторинга

```bash
git checkout -b refactor/file-size-optimization
```

---

## Порядок рефакторинга

Рекомендуется рефакторить файлы в следующем порядке (от простых к сложным):

### Этап 1: Простые файлы (600-700 строк)
1. exportPositionsToExcel.ts (610 строк)
2. supabase.ts (644 строки)
3. UploadBOQModal.tsx (647 строк)
4. WorksTab.tsx (685 строк)

### Этап 2: Средние файлы (700-1000 строк)
5. Tenders.tsx (773 строки)
6. MaterialsTab.tsx (891 строка)
7. Commerce.tsx (912 строк)
8. markupTacticService.ts (934 строки)
9. Nomenclatures.tsx (983 строки)

### Этап 3: Большие файлы (1000-1500 строк)
10. ClientPositions.tsx (1142 строки)
11. ConstructionCost.tsx (1248 строк)
12. PositionItems.tsx (1476 строк)
13. ConstructionCostNew.tsx (1479 строк)

### Этап 4: Очень большие файлы (1500+ строк)
14. FinancialIndicators.tsx (1717 строк)
15. Templates.tsx (1943 строки)
16. MarkupConstructor.tsx (3890 строк)

---

## Шаблон рефакторинга

Для каждого файла выполните следующие шаги:

### Шаг 1: Создайте структуру директорий

Для компонента `ComponentName.tsx`:

```bash
mkdir -p src/pages/.../ComponentName/components
mkdir -p src/pages/.../ComponentName/hooks
mkdir -p src/pages/.../ComponentName/utils
```

### Шаг 2: Создайте types.ts

Извлеките все интерфейсы и типы в отдельный файл:

```typescript
// ComponentName/types.ts
export interface DataRow {
  id: string;
  name: string;
  // ...
}

export type SomeType = 'option1' | 'option2' | 'option3';

// Export all types
```

### Шаг 3: Создайте constants.ts

Извлеките все константы:

```typescript
// ComponentName/constants.ts
import type { SomeType } from './types';

export const DEFAULT_PAGE_SIZE = 20;

export const OPTIONS: Record<SomeType, string> = {
  option1: 'Вариант 1',
  option2: 'Вариант 2',
  option3: 'Вариант 3',
};

// Export all constants
```

### Шаг 4: Создайте хуки

Извлеките логику работы с данными в хуки:

```typescript
// ComponentName/hooks/useDataManagement.ts
import { useState, useCallback } from 'react';
import { message } from 'antd';
import { supabase } from '../../../lib/supabase';
import type { DataRow } from '../types';

export const useDataManagement = () => {
  const [data, setData] = useState<DataRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('table_name')
        .select('*');

      if (error) throw error;
      setData(data || []);
    } catch (error) {
      message.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }, []);

  const createItem = async (item: Omit<DataRow, 'id'>) => {
    // ...
  };

  const updateItem = async (id: string, updates: Partial<DataRow>) => {
    // ...
  };

  const deleteItem = async (id: string) => {
    // ...
  };

  return {
    data,
    loading,
    fetchData,
    createItem,
    updateItem,
    deleteItem,
  };
};
```

### Шаг 5: Создайте компоненты

Извлеките UI-компоненты:

```typescript
// ComponentName/components/DataTable.tsx
import React from 'react';
import { Table, Button, Space } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { DataRow } from '../types';

interface DataTableProps {
  data: DataRow[];
  loading: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const DataTable: React.FC<DataTableProps> = ({
  data,
  loading,
  onEdit,
  onDelete,
}) => {
  const columns = [
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: any, record: DataRow) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => onEdit(record.id)}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => onDelete(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      loading={loading}
      rowKey="id"
    />
  );
};
```

### Шаг 6: Создайте утилиты

Извлеките чистые функции:

```typescript
// ComponentName/utils/calculations.ts
export const calculateTotal = (items: number[]): number => {
  return items.reduce((sum, item) => sum + item, 0);
};

export const formatCurrency = (value: number): string => {
  return value.toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
```

### Шаг 7: Создайте barrel exports

```typescript
// ComponentName/components/index.ts
export { DataTable } from './DataTable';
export { DataForm } from './DataForm';
export { DataFilters } from './DataFilters';
```

```typescript
// ComponentName/hooks/index.ts
export { useDataManagement } from './useDataManagement';
export { useFilters } from './useFilters';
```

```typescript
// ComponentName/utils/index.ts
export { calculateTotal, formatCurrency } from './calculations';
export { validateData } from './validation';
```

### Шаг 8: Обновите главный файл

```typescript
// ComponentName.tsx
import React, { useEffect } from 'react';
import { Card } from 'antd';
import { DataTable, DataForm, DataFilters } from './components';
import { useDataManagement, useFilters } from './hooks';
import { DEFAULT_PAGE_SIZE } from './constants';

const ComponentName: React.FC = () => {
  const {
    data,
    loading,
    fetchData,
    createItem,
    updateItem,
    deleteItem,
  } = useDataManagement();

  const {
    filters,
    setFilters,
    filteredData,
  } = useFilters(data);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div>
      <Card title="Управление данными">
        <DataFilters
          filters={filters}
          onChange={setFilters}
        />
        <DataTable
          data={filteredData}
          loading={loading}
          onEdit={(id) => {/* ... */}}
          onDelete={deleteItem}
        />
      </Card>
    </div>
  );
};

export default ComponentName;
```

### Шаг 9: Создайте главный index.ts

```typescript
// ComponentName/index.ts
export { default } from './ComponentName';
export * from './types';
```

### Шаг 10: Проверьте

1. **Подсчитайте строки в каждом файле**:
   ```bash
   wc -l ComponentName/*.{ts,tsx}
   wc -l ComponentName/**/*.{ts,tsx}
   ```

2. **Убедитесь, что все файлы ≤600 строк**

3. **Проверьте работоспособность**:
   ```bash
   npm run dev
   ```

4. **Проверьте сборку**:
   ```bash
   npm run build
   ```

5. **Запустите линтер**:
   ```bash
   npm run lint
   ```

---

## Чеклист для каждого файла

- [ ] Создана структура директорий (components/, hooks/, utils/)
- [ ] Создан types.ts с всеми интерфейсами
- [ ] Создан constants.ts с константами
- [ ] Извлечены хуки для работы с данными
- [ ] Извлечены UI-компоненты
- [ ] Извлечены утилиты (чистые функции)
- [ ] Созданы barrel exports (index.ts в каждой поддиректории)
- [ ] Обновлен главный файл компонента
- [ ] Все файлы ≤600 строк
- [ ] Код компилируется без ошибок
- [ ] Линтер не выдает ошибок
- [ ] Приложение работает корректно
- [ ] Проверена функциональность компонента

---

## Полезные команды

### Подсчет строк

```bash
# Общее количество строк в файле
wc -l path/to/file.tsx

# Строки во всех файлах директории
find src/pages/ComponentName -name "*.ts" -o -name "*.tsx" | xargs wc -l

# Самые большие файлы в проекте
find src -name "*.tsx" -o -name "*.ts" | xargs wc -l | sort -rn | head -20
```

### Поиск импортов

```bash
# Найти все файлы, которые импортируют компонент
grep -r "from.*ComponentName" src/
```

### Git

```bash
# Проверить изменения
git status
git diff

# Коммит
git add .
git commit -m "Рефакторинг ComponentName: разбит на модули ≤600 строк"

# Откат изменений (если что-то пошло не так)
git checkout -- path/to/file.tsx
```

---

## Рекомендации

### 1. Работайте поэтапно
- Рефакторьте по одному файлу за раз
- Делайте коммит после каждого успешного рефакторинга
- Тестируйте после каждого изменения

### 2. Сохраняйте функциональность
- Не меняйте логику работы компонента
- Только перемещайте код в модули
- Проверяйте работоспособность после каждого шага

### 3. Следуйте паттернам
- Используйте существующие типы из проекта
- Соблюдайте code style проекта
- Применяйте одинаковые подходы для всех файлов

### 4. Документируйте
- Добавляйте JSDoc комментарии к сложным функциям
- Обновляйте README при необходимости

---

## Критерии успеха

1. ✅ Все файлы ≤600 строк
2. ✅ Код компилируется без ошибок
3. ✅ Линтер не выдает предупреждений
4. ✅ Все тесты проходят (если есть)
5. ✅ Приложение работает корректно
6. ✅ Все функции сохранили работоспособность
7. ✅ Импорты обновлены и работают
8. ✅ Создана модульная структура для каждого файла

---

## Дополнительные ресурсы

- `REFACTORING_PLAN.md` - Детальный план рефакторинга всех 16 файлов
- `REFACTORING_EXAMPLES.md` - Примеры модулей для MarkupConstructor, Templates, FinancialIndicators
- `CLAUDE.md` - Документация проекта с правилами разработки

---

## Поддержка

При возникновении проблем:

1. Проверьте логи сборки
2. Убедитесь, что все импорты обновлены
3. Проверьте типы TypeScript
4. Запустите линтер для проверки code style

---

**Последнее обновление**: 2025-11-25
**Автор**: Claude Code
