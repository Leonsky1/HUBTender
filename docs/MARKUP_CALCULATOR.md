# Механизм расчета коммерческих стоимостей

## Обзор

Реализован полноценный механизм расчета коммерческих стоимостей на основе тактик наценок. Система позволяет применять гибкие последовательности операций к базовым стоимостям элементов BOQ, используя единую тактику для каждого типа элементов.

## Архитектура решения

### Основные компоненты

1. **Калькулятор наценок** (`src/utils/markupCalculator.ts`)
   - Ядро системы расчета
   - Применяет последовательности операций к базовым стоимостям
   - Поддерживает до 5 операций на шаг
   - Валидация последовательностей

2. **Сервис тактик** (`src/services/markupTacticService.ts`)
   - Интеграция с базой данных
   - Применение тактик на разных уровнях (элемент, позиция, тендер)
   - Загрузка параметров наценок
   - Обновление итоговых сумм

3. **Тесты** (`src/utils/markupCalculator.test.ts`)
   - Покрытие основных сценариев
   - Проверка edge cases
   - Валидация ошибок

## Схема работы

```
Тендер (markup_tactic_id)
    ↓
Тактика наценок
    ├── sequences['раб'] → применяется ко всем элементам типа 'раб'
    ├── sequences['мат'] → применяется ко всем элементам типа 'мат'
    └── ... (для всех 6 типов)

BOQ элемент
    ├── total_amount (базовая стоимость)
    ├── boq_item_type (тип элемента)
    └── → commercial_cost (результат)
```

## Использование

### Применение тактики к одному элементу

```typescript
import { applyTacticToBoqItem } from './services/markupTacticService';

// Применить тактику к элементу
const result = await applyTacticToBoqItem(
  'item-id-123',    // ID элемента BOQ
  'tactic-id-456'   // ID тактики наценок
);

if (result.success) {
  console.log(`Обновлено элементов: ${result.updatedCount}`);
  console.log(`Коммерческая стоимость: ${result.details[0].commercialCost}`);
} else {
  console.error('Ошибки:', result.errors);
}
```

### Применение тактики к позиции заказчика

```typescript
import { applyTacticToPosition } from './services/markupTacticService';

// Применить тактику ко всем элементам позиции
const result = await applyTacticToPosition(
  'position-id-789',  // ID позиции заказчика
  'tactic-id-456'     // ID тактики наценок
);

console.log(`Обновлено ${result.updatedCount} элементов`);
```

### Применение тактики ко всему тендеру

```typescript
import { applyTacticToTender } from './services/markupTacticService';

// Применить тактику ко всем элементам тендера
const result = await applyTacticToTender(
  'tender-id-abc'  // ID тендера (тактика берется из тендера)
);
```

### Пересчет при изменении параметров

```typescript
import { recalculateAfterParameterChange } from './services/markupTacticService';

// После изменения параметра наценки
const result = await recalculateAfterParameterChange(
  'tender-id-abc',    // ID тендера
  'overhead_markup'   // Ключ измененного параметра (опционально)
);
```

## Структура последовательности операций

Каждый шаг в последовательности может содержать до 5 операций:

```typescript
interface MarkupStep {
  name?: string;           // Название шага
  baseIndex: number;       // -1 для базовой стоимости, >= 0 для результата шага

  // Операция 1 (обязательная)
  action1: 'multiply' | 'divide' | 'add' | 'subtract';
  operand1Type: 'markup' | 'step' | 'number';
  operand1Key?: string | number;
  operand1Index?: number;
  operand1MultiplyFormat?: 'addOne' | 'direct';

  // Операции 2-5 (опциональные)
  action2?: ...
  // ... и так далее
}
```

### Пример последовательности

```typescript
const sequence: MarkupStep[] = [
  {
    name: 'Накладные расходы',
    baseIndex: -1,  // Используем базовую стоимость
    action1: 'multiply',
    operand1Type: 'markup',
    operand1Key: 'overhead',
    operand1MultiplyFormat: 'addOne'  // (1 + overhead/100)
  },
  {
    name: 'Прибыль',
    baseIndex: 0,  // Результат первого шага
    action1: 'multiply',
    operand1Type: 'markup',
    operand1Key: 'profit',
    operand1MultiplyFormat: 'addOne'
  },
  {
    name: 'НДС',
    baseIndex: 1,  // Результат второго шага
    action1: 'multiply',
    operand1Type: 'number',
    operand1Key: 1.2  // Фиксированный НДС 20%
  }
];
```

## Типы операндов

1. **`markup`** - значение из параметров наценок
   - Загружается из таблицы `tender_markup_percentage`
   - Может использовать формат `addOne` (1 + %) или `direct` (%)

2. **`step`** - результат предыдущего шага
   - Ссылается на индекс в массиве результатов
   - Должен ссылаться только на уже выполненные шаги

3. **`number`** - фиксированное число
   - Прямое числовое значение для операции

## Обработка ошибок

Система обрабатывает следующие типы ошибок:

- Отсутствующие параметры наценок
- Деление на ноль
- Недопустимые индексы шагов
- Отсутствующие последовательности для типов
- Ошибки базы данных

При ошибке в одном шаге, расчет продолжается с предыдущим значением, все ошибки сохраняются в результате.

## База данных

### Таблицы

- `boq_items` - элементы BOQ с полями коммерческих стоимостей
- `markup_tactics` - тактики с последовательностями для каждого типа
- `markup_parameters` - справочник параметров наценок
- `tender_markup_percentage` - значения параметров для тендера
- `client_positions` - агрегированные суммы по позициям

### Поля в boq_items

```sql
total_amount                     -- Базовая стоимость
boq_item_type                    -- Тип элемента (мат, раб, ...)
commercial_markup                -- Коэффициент наценки
total_commercial_material_cost   -- Коммерческая стоимость (материалы)
total_commercial_work_cost       -- Коммерческая стоимость (работы)
```

## Производительность

- Массовые операции выполняются пакетно
- Параметры загружаются один раз для всех элементов
- Автоматическое обновление итогов в позициях
- Валидация последовательностей перед применением

## Интеграция в UI

Хотя отображение коммерческих стоимостей в UI будет реализовано позже, сервис готов к использованию:

1. При сохранении элемента BOQ можно вызвать `applyTacticToBoqItem`
2. При изменении тактики тендера - `applyTacticToTender`
3. При изменении параметров наценок - `recalculateAfterParameterChange`

## Тестирование

Для запуска тестов (после установки vitest):

```bash
npm install -D vitest
npm run test
```

## Следующие шаги

1. **Интеграция в PositionItems.tsx**
   - Добавить вызов расчета при сохранении элементов
   - Показать индикатор пересчета

2. **API endpoints**
   - Создать endpoint для массового пересчета
   - Webhook для автоматического пересчета при изменении тактики

3. **UI для отображения**
   - Страница коммерческих расчетов
   - Сравнение базовых и коммерческих стоимостей
   - Экспорт коммерческих стоимостей