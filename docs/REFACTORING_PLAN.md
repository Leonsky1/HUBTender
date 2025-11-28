# План рефакторинга файлов превышающих 600 строк

## Статус: В ПРОЦЕССЕ

**Дата создания**: 2025-11-25
**Общее количество файлов к рефакторингу**: 16
**Критерий**: Все файлы ≤ 600 строк

---

## Список файлов для рефакторинга

1. ✅ **src/pages/Admin/MarkupConstructor/MarkupConstructor.tsx** (3890 строк)
2. ⏳ **src/pages/Library/Templates.tsx** (1943 строки)
3. ⏳ **src/pages/FinancialIndicators/FinancialIndicators.tsx** (1717 строк)
4. ⏳ **src/pages/Admin/ConstructionCostNew/ConstructionCostNew.tsx** (1479 строк)
5. ⏳ **src/pages/PositionItems/PositionItems.tsx** (1476 строк)
6. ⏳ **src/pages/Admin/ConstructionCost/ConstructionCost.tsx** (1248 строк)
7. ⏳ **src/pages/ClientPositions/ClientPositions.tsx** (1142 строки)
8. ⏳ **src/pages/Admin/Nomenclatures/Nomenclatures.tsx** (983 строки)
9. ⏳ **src/services/markupTacticService.ts** (934 строки)
10. ⏳ **src/pages/Commerce/Commerce.tsx** (912 строк)
11. ⏳ **src/pages/Library/MaterialsTab.tsx** (891 строка)
12. ⏳ **src/pages/Admin/Tenders/Tenders.tsx** (773 строки)
13. ⏳ **src/pages/Library/WorksTab.tsx** (685 строк)
14. ⏳ **src/pages/Admin/Tenders/UploadBOQModal.tsx** (647 строк)
15. ⏳ **src/lib/supabase.ts** (644 строки)
16. ⏳ **src/utils/exportPositionsToExcel.ts** (610 строк)

---

## 1. MarkupConstructor.tsx (3890 строк → 7 модулей)

### Структура модулей:

```
src/pages/Admin/MarkupConstructor/
├── MarkupConstructor.tsx (главный компонент, ~500 строк)
├── types.ts (интерфейсы и типы, уже создан)
├── constants.ts (константы, уже создан)
├── components/
│   ├── TacticSelector.tsx (~200 строк)
│   ├── ParametersManager.tsx (~300 строк)
│   ├── BasePercentagesForm.tsx (~250 строк)
│   ├── MarkupSequenceBuilder.tsx (~400 строк)
│   ├── PricingDistributionForm.tsx (~200 строк)
│   └── index.ts (barrel export)
├── hooks/
│   ├── useMarkupTactics.ts (~300 строк)
│   ├── useMarkupParameters.ts (~250 строк)
│   ├── usePricingDistribution.ts (~150 строк)
│   ├── useMarkupSequences.ts (~400 строк)
│   └── index.ts
├── utils/
│   ├── calculations.ts (~300 строк)
│   ├── tacticHelpers.ts (~200 строк)
│   └── index.ts
└── index.ts
```

### Разбивка:

#### **MarkupConstructor.tsx** (~500 строк)
- Главный компонент-контейнер
- Состояние верхнего уровня
- Рендер вкладок и компонентов

#### **components/TacticSelector.tsx** (~200 строк)
- Выбор тендера
- Выбор тактики
- Поиск схем
- Редактирование названия тактики

#### **components/ParametersManager.tsx** (~300 строк)
- Список параметров наценок
- CRUD операции над параметрами
- Inline редактирование
- Модальное окно добавления параметра

#### **components/BasePercentagesForm.tsx** (~250 строк)
- Форма базовых процентов
- Сохранение/сброс значений
- Связь с markup_parameters

#### **components/MarkupSequenceBuilder.tsx** (~400 строк)
- Построение последовательности наценок для каждой вкладки
- Drag-and-drop для изменения порядка
- Добавление/удаление шагов
- Формы операций

#### **components/PricingDistributionForm.tsx** (~200 строк)
- Форма распределения затрат между КП и работами
- Сохранение в pricing_distribution

#### **hooks/useMarkupTactics.ts** (~300 строк)
- Загрузка тактик из БД
- Создание/удаление/копирование тактик
- Загрузка тактики для тендера
- Сохранение тактики

#### **hooks/useMarkupParameters.ts** (~250 строк)
- Загрузка параметров из БД
- CRUD операции
- Обновление порядка
- Базовые проценты

#### **hooks/usePricingDistribution.ts** (~150 строк)
- Загрузка распределения затрат
- Сохранение распределения

#### **hooks/useMarkupSequences.ts** (~400 строк)
- Управление последовательностями для всех вкладок
- Добавление/удаление шагов
- Изменение порядка
- Расчеты

#### **utils/calculations.ts** (~300 строк)
- Расчет итоговых стоимостей
- Применение наценок
- Формулы расчета для каждого типа операции

#### **utils/tacticHelpers.ts** (~200 строк)
- Преобразование между русским и английским форматом
- Валидация данных
- Вспомогательные функции

---

## 2. Templates.tsx (1943 строки → 4 модуля)

### Структура модулей:

```
src/pages/Library/Templates/
├── Templates.tsx (главный компонент, ~400 строк)
├── types.ts (~100 строк)
├── constants.ts (~50 строк)
├── components/
│   ├── TemplateList.tsx (~300 строк)
│   ├── TemplateForm.tsx (~350 строк)
│   ├── TemplateItemsTable.tsx (~400 строк)
│   ├── InsertTemplateModal.tsx (~200 строк)
│   └── index.ts
├── hooks/
│   ├── useTemplates.ts (~300 строк)
│   ├── useTemplateItems.ts (~400 строк)
│   └── index.ts
└── index.ts
```

### Разбивка:

#### **Templates.tsx** (~400 строк)
- Главный компонент
- Управление вкладками
- Состояние верхнего уровня

#### **types.ts** (~100 строк)
- TemplateItemWithDetails
- CostCategoryOption
- TemplateWithDetails

#### **components/TemplateList.tsx** (~300 строк)
- Список шаблонов с Collapse
- Фильтры (поиск, категория, детализация)
- Кнопки действий (редактировать, удалить, вставить)

#### **components/TemplateForm.tsx** (~350 строк)
- Форма создания нового шаблона
- Выбор затраты на строительство
- Добавление работ/материалов

#### **components/TemplateItemsTable.tsx** (~400 строк)
- Таблица элементов шаблона (работы + материалы)
- Редактирование привязок
- Коэффициенты перевода
- Затраты на строительство

#### **components/InsertTemplateModal.tsx** (~200 строк)
- Модальное окно вставки шаблона в позицию заказчика
- Уже существует, просто переместить

#### **hooks/useTemplates.ts** (~300 строк)
- Загрузка шаблонов
- CRUD операции
- Фильтрация

#### **hooks/useTemplateItems.ts** (~400 строк)
- Загрузка элементов шаблона
- Добавление/удаление работ/материалов
- Обновление привязок и коэффициентов

---

## 3. FinancialIndicators.tsx (1717 строк → 4 модуля)

### Структура модулей:

```
src/pages/FinancialIndicators/
├── FinancialIndicators.tsx (главный компонент, ~300 строк)
├── types.ts (~50 строк)
├── components/
│   ├── TenderSelector.tsx (~200 строк)
│   ├── StatisticsCards.tsx (~300 строк)
│   ├── FinancialTable.tsx (~250 строк)
│   ├── ChartsView.tsx (~400 строк)
│   └── index.ts
├── hooks/
│   ├── useFinancialData.ts (~500 строк)
│   └── index.ts
└── utils/
    ├── chartHelpers.ts (~200 строк)
    └── index.ts
```

### Разбивка:

#### **FinancialIndicators.tsx** (~300 строк)
- Главный компонент
- Вкладки (таблица/графики)
- Управление состоянием

#### **types.ts** (~50 строк)
- IndicatorRow interface

#### **components/TenderSelector.tsx** (~200 строк)
- Выбор тендера и версии
- Быстрый выбор через карточки

#### **components/StatisticsCards.tsx** (~300 строк)
- Карточки с суммами (прямые затраты, наценки, прибыль, итого)
- Карточки с площадями

#### **components/FinancialTable.tsx** (~250 строк)
- Таблица с финансовыми показателями
- Колонки, форматирование

#### **components/ChartsView.tsx** (~400 строк)
- Круговая диаграмма (структура затрат)
- Горизонтальная столбчатая (детализация)
- Настройки графиков

#### **hooks/useFinancialData.ts** (~500 строк)
- Загрузка данных тендера
- Расчет финансовых показателей
- Формирование данных для таблицы

#### **utils/chartHelpers.ts** (~200 строк)
- Подготовка данных для графиков
- Настройки Chart.js

---

## 4. ConstructionCostNew.tsx (1479 строк → 4 модуля)

### Структура модулей:

```
src/pages/Admin/ConstructionCostNew/
├── ConstructionCostNew.tsx (главный компонент, ~300 строк)
├── types.ts (~100 строк)
├── components/
│   ├── TenderVersionSelector.tsx (~200 строк)
│   ├── CostTypeToggle.tsx (~100 строк)
│   ├── ConstructionCostTable.tsx (~500 строк)
│   ├── ExportButton.tsx (~150 строк)
│   └── index.ts
├── hooks/
│   ├── useConstructionCosts.ts (~600 строк)
│   └── index.ts
└── utils/
    ├── costCalculations.ts (~200 строк)
    └── excelExport.ts (~300 строк)
    └── index.ts
```

### Разбивка:

#### **ConstructionCostNew.tsx** (~300 строк)
- Главный компонент
- Состояние
- Рендер

#### **types.ts** (~100 строк)
- DetailCostCategoryExpanded
- CostVolumeMap
- Другие интерфейсы

#### **components/TenderVersionSelector.tsx** (~200 строк)
- Выбор тендера и версии

#### **components/CostTypeToggle.tsx** (~100 строк)
- Переключатель прямые/коммерческие затраты

#### **components/ConstructionCostTable.tsx** (~500 строк)
- Таблица затрат
- Инлайн редактирование объемов
- Expand/collapse

#### **components/ExportButton.tsx** (~150 строк)
- Экспорт в Excel

#### **hooks/useConstructionCosts.ts** (~600 строк)
- Загрузка затрат
- Расчеты
- Сохранение объемов

#### **utils/costCalculations.ts** (~200 строк)
- Формулы расчета

#### **utils/excelExport.ts** (~300 строк)
- Экспорт в Excel

---

## 5. PositionItems.tsx (1476 строк → 4 модуля)

### Структура модулей:

```
src/pages/PositionItems/
├── PositionItems.tsx (главный компонент, ~300 строк)
├── types.ts (~100 строк)
├── components/
│   ├── PositionHeader.tsx (~200 строк)
│   ├── InstantAddForm.tsx (~250 строк)
│   ├── BOQItemsTable.tsx (~500 строк)
│   └── index.ts
├── hooks/
│   ├── useBOQItems.ts (~600 строк)
│   └── index.ts
└── utils/
    ├── priceCalculations.ts (~200 строк)
    └── index.ts
```

---

## 6. ConstructionCost.tsx (1248 строк → 3 модуля)

### Структура модулей:

```
src/pages/Admin/ConstructionCost/
├── ConstructionCost.tsx (главный компонент, ~400 строк)
├── types.ts (~100 строк)
├── components/
│   ├── CostCategoryTree.tsx (~400 строк)
│   ├── ExcelImport.tsx (~300 строк)
│   └── index.ts
├── hooks/
│   ├── useCostCategories.ts (~400 строк)
│   └── index.ts
└── index.ts
```

---

## 7-16. Остальные файлы

Аналогичная структура модулей для каждого файла:
- Главный компонент (~300-400 строк)
- types.ts
- components/ (2-4 компонента по ~200-400 строк)
- hooks/ (1-3 хука по ~200-500 строк)
- utils/ (если нужно)

---

## Общие принципы рефакторинга

### 1. **Разделение ответственности**
- **Главный компонент**: только композиция, состояние верхнего уровня
- **Components**: переиспользуемые UI компоненты
- **Hooks**: бизнес-логика, работа с API
- **Utils**: чистые функции, расчеты

### 2. **Barrel exports**
```typescript
// components/index.ts
export { TacticSelector } from './TacticSelector';
export { ParametersManager } from './ParametersManager';
// ...
```

### 3. **Типизация**
- Все интерфейсы в types.ts
- Использование TypeScript strict mode

### 4. **Именование**
- Components: PascalCase
- Hooks: useCamelCase
- Utils: camelCase
- Files: PascalCase для компонентов, camelCase для утилит

### 5. **Размер файлов**
- Целевой размер: 300-500 строк
- Максимальный размер: 600 строк
- Минимальный размер: 100 строк (чтобы не дробить слишком мелко)

---

## Следующие шаги

1. Создать структуру директорий для каждого модуля
2. Извлечь типы в types.ts
3. Извлечь константы в constants.ts
4. Создать компоненты
5. Создать хуки
6. Создать утилиты
7. Обновить главный файл
8. Создать barrel exports
9. Проверить импорты
10. Тестирование

---

## Прогресс

- [x] Создан план рефакторинга
- [x] Создана структура для MarkupConstructor
- [ ] Реализация модулей MarkupConstructor
- [ ] Templates.tsx
- [ ] FinancialIndicators.tsx
- [ ] ConstructionCostNew.tsx
- [ ] PositionItems.tsx
- [ ] Остальные файлы

**Статус**: Готов к реализации
