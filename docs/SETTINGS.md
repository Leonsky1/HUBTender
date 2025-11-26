# Документация страницы настроек

## Обзор

Страница настроек (`/settings`) предоставляет настраиваемые пользователем предпочтения приложения, в первую очередь сосредоточенные на настройке шрифтов и отображения. Настройки сохраняются в localStorage и применяются глобально во всём приложении.

**Маршрут**: `/settings`
**Компонент**: `src/pages/Settings/Settings.tsx`
**Уровень доступа**: Все авторизованные пользователи

## Назначение

**Настройка пользовательского опыта**:
- Регулировка семейства шрифтов для удобочитаемости
- Управление размером шрифта для доступности
- Тонкая настройка высоты строки и межбуквенного интервала
- Включение компактного режима для плотных дисплеев
- Сохранение предпочтений между сеансами

## Возможности

### 1. Выбор семейства шрифтов
**Восемь вариантов шрифтов**:
1. **Системный** (по умолчанию)
   - `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto`
   - Родные шрифты ОС для лучшей производительности
2. **Inter**
   - Современный, чистый, отличная читаемость
   - Хорош для длительного чтения
3. **Roboto**
   - Фирменный шрифт Google
   - Геометричный, дружелюбный вид
4. **Open Sans**
   - Гуманистический без засечек
   - Оптимизирован для UI и печати
5. **Montserrat**
   - Геометричный без засечек
   - Отлично для заголовков
6. **PT Sans**
   - Разработан для русского текста
   - Отличная поддержка кириллицы
7. **Source Sans Pro**
   - UI-шрифт Adobe
   - Чистый, профессиональный
8. **Noto Sans**
   - Универсальный шрифт Google
   - Отличная поддержка языков
9. **Моноширинный**
   - Моноширинный шрифт
   - Для отображения кода

### 2. Управление размером шрифта
- **Диапазон**: 10px - 20px
- **По умолчанию**: 14px
- **Элементы управления**: Слайдер + Числовой ввод
- **Метки**: 10, 12, 14, 16, 18, 20
- **Шаг**: 1px

**Производные размеры**:
- Малый: базовый - 2px
- Большой: базовый + 2px
- XL: базовый + 4px
- XXL: базовый + 6px

### 3. Регулировка высоты строки
- **Диапазон**: 1.2 - 2.0
- **По умолчанию**: 1.5715
- **Элементы управления**: Слайдер + Числовой ввод
- **Метки**: 1.2, 1.5, 1.75, 2.0
- **Шаг**: 0.05

**Эффект**: Управляет интервалом между строками текста

### 4. Межбуквенный интервал
- **Диапазон**: -0.5px - 2.0px
- **По умолчанию**: 0px
- **Элементы управления**: Слайдер + Числовой ввод
- **Метки**: -0.5, 0, 0.5, 1, 2
- **Шаг**: 0.1px

**Эффект**: Регулирует интервал между символами

### 5. Компактный режим
- **Переключатель**: Вкл/Выкл
- **По умолчанию**: Выкл
- **Эффект**: Глобально уменьшает отступы и поля

### 6. Панель предпросмотра
- **Предпросмотр в реальном времени**: Показывает применённые текущие настройки
- **Примерное содержимое**:
  - Заголовки (H3, H4)
  - Параграфы
  - Жирный и вторичный текст
  - Текст кода
  - Списки

### 7. Отображение текущих настроек
- **Сводка в карточке**: Показывает все активные настройки
- **Быстрый справочник**: Размер шрифта, семейство, высота строки и т.д.

### 8. Сохранение
- **Хранилище**: localStorage
- **Ключ**: `tenderHub_fontSettings`
- **Автозагрузка**: Настройки восстанавливаются при запуске приложения
- **Автоприменение**: Изменения применяются немедленно

## UI-компоненты

### Контейнер настроек
**Макет**:
```tsx
<Row gutter={[24, 24]}>
  <Col xs={24} lg={16}>
    <Card title="Настройки шрифта">
      {/* Элементы управления настройками */}
    </Card>
  </Col>
  <Col xs={24} lg={8}>
    <Card title="Предпросмотр">
      {/* Содержимое предпросмотра */}
    </Card>
    <Card title="Текущие настройки">
      {/* Сводка настроек */}
    </Card>
  </Col>
</Row>
```

### Компонент элемента настройки
**Паттерн**:
```tsx
<div className="setting-item">
  <div className="setting-label">
    <Text strong>Метка</Text>
    <Text type="secondary">Описание</Text>
  </div>
  <Control />
</div>
```

### Селектор семейства шрифтов
**Компонент**: Выпадающий список Select

**Варианты**:
```typescript
const FONT_FAMILIES = [
  {
    label: 'Системный (по умолчанию)',
    value: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto',
  },
  // ... другие шрифты
];
```

### Управление размером шрифта
**Компоненты**: Slider + InputNumber

**Slider**:
- Мин: 10, Макс: 20
- Метки на ключевых размерах
- Шаг: 1

**InputNumber**:
- Ширина: 80px
- Форматтер: Добавляет "px"
- Парсер: Удаляет "px"

### Управление высотой строки
**Компоненты**: Slider + InputNumber

**Slider**:
- Мин: 1.2, Макс: 2.0
- Метки: 1.2, 1.5, 1.75, 2.0
- Шаг: 0.05

### Управление межбуквенным интервалом
**Компоненты**: Slider + InputNumber

**Slider**:
- Мин: -0.5, Макс: 2.0
- Метки: -0.5, 0, 0.5, 1, 2
- Шаг: 0.1

### Переключатель компактного режима
**Компонент**: Switch

**Состояния**:
- Выкл (по умолчанию): Обычные интервалы
- Вкл: Уменьшенные интервалы

### Кнопки действий
**Кнопки**:
1. **Сохранить изменения**
   - Основная кнопка
   - Сохраняет в localStorage
   - Отключена, если нет изменений

2. **Сбросить к настройкам по умолчанию**
   - Стандартная кнопка
   - Сбрасывает к жёстко заданным значениям по умолчанию
   - Удаляет из localStorage

## Модель данных

### Интерфейс FontSettings
```typescript
interface FontSettings {
  fontSize: number;          // 10-20
  fontFamily: string;        // Значение CSS font-family
  lineHeight: number;        // 1.2-2.0
  letterSpacing: number;     // -0.5 до 2.0
  compactMode: boolean;      // true/false
}
```

### Настройки по умолчанию
```typescript
const DEFAULT_FONT_SETTINGS: FontSettings = {
  fontSize: 14,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  lineHeight: 1.5715,
  letterSpacing: 0,
  compactMode: false,
};
```

### Схема localStorage
```json
{
  "fontSize": 14,
  "fontFamily": "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto",
  "lineHeight": 1.5715,
  "letterSpacing": 0,
  "compactMode": false
}
```

## Применение настроек

### CSS пользовательские свойства
Настройки применяются через CSS-переменные на `:root`:

```typescript
function applyFontSettings(settings: FontSettings) {
  const root = document.documentElement;

  // Базовый размер
  root.style.setProperty('--font-size-base', `${settings.fontSize}px`);

  // Производные размеры
  root.style.setProperty('--font-size-sm', `${settings.fontSize - 2}px`);
  root.style.setProperty('--font-size-lg', `${settings.fontSize + 2}px`);
  root.style.setProperty('--font-size-xl', `${settings.fontSize + 4}px`);
  root.style.setProperty('--font-size-xxl', `${settings.fontSize + 6}px`);

  // Семейство шрифтов
  root.style.setProperty('--font-family', settings.fontFamily);

  // Высота строки
  root.style.setProperty('--line-height-base', `${settings.lineHeight}`);

  // Межбуквенный интервал
  root.style.setProperty('--letter-spacing', `${settings.letterSpacing}px`);

  // Компактный режим
  if (settings.compactMode) {
    root.classList.add('compact-mode');
  } else {
    root.classList.remove('compact-mode');
  }
}
```

### Применение глобального CSS
```css
/* В глобальном CSS */
body {
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  line-height: var(--line-height-base);
  letter-spacing: var(--letter-spacing);
}

/* Стили компактного режима */
.compact-mode {
  --spacing-sm: 8px;
  --spacing-md: 12px;
  --spacing-lg: 16px;
}

.compact-mode .ant-card {
  padding: var(--spacing-sm);
}

.compact-mode .ant-table-cell {
  padding: 4px 8px !important;
}
```

## Рабочие процессы пользователя

### Изменение семейства шрифтов
1. Перейдите на страницу настроек
2. Найдите настройку "Семейство шрифта"
3. Нажмите на выпадающий список
4. Выберите желаемый шрифт (например, "Inter")
5. Предпросмотр обновляется немедленно
6. Нажмите "Сохранить изменения"
7. Настройка сохранена

### Регулировка размера шрифта
1. Найдите настройку "Размер шрифта"
2. **Вариант A**: Используйте слайдер
   - Перетащите на желаемый размер
   - Смотрите предпросмотр в реальном времени
3. **Вариант B**: Используйте числовой ввод
   - Введите точный размер (например, 16)
   - Нажмите Enter
4. Предпросмотр обновляется немедленно
5. Нажмите "Сохранить изменения"

### Включение компактного режима
1. Найдите настройку "Компактный режим"
2. Переключите на ВКЛ
3. UI немедленно становится более плотным
4. Все отступы/поля уменьшены
5. Нажмите "Сохранить изменения"

### Сброс к значениям по умолчанию
1. Нажмите "Сбросить к настройкам по умолчанию"
2. Все настройки возвращаются к значениям по умолчанию
3. localStorage очищен
4. Показано информационное сообщение
5. Предпросмотр обновляется немедленно

## Управление состоянием

### Состояние компонента
```typescript
interface SettingsState {
  fontSettings: FontSettings;
  hasChanges: boolean;
}
```

### Хуки состояния
```typescript
const [fontSettings, setFontSettings] = useState<FontSettings>(DEFAULT_FONT_SETTINGS);
const [hasChanges, setHasChanges] = useState(false);
```

### Загрузка при монтировании
```typescript
useEffect(() => {
  const savedSettings = localStorage.getItem('tenderHub_fontSettings');
  if (savedSettings) {
    try {
      const parsed = JSON.parse(savedSettings);
      setFontSettings(parsed);
      applyFontSettings(parsed);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }
}, []);
```

### Обнаружение изменений
```typescript
useEffect(() => {
  const savedSettings = localStorage.getItem('tenderHub_fontSettings');
  if (savedSettings) {
    try {
      const parsed = JSON.parse(savedSettings);
      setHasChanges(JSON.stringify(parsed) !== JSON.stringify(fontSettings));
    } catch {
      setHasChanges(true);
    }
  } else {
    setHasChanges(JSON.stringify(DEFAULT_FONT_SETTINGS) !== JSON.stringify(fontSettings));
  }
}, [fontSettings]);
```

## Логика сохранения

### Сохранение настроек
```typescript
function saveSettings() {
  localStorage.setItem('tenderHub_fontSettings', JSON.stringify(fontSettings));
  message.success('Настройки сохранены');
  setHasChanges(false);
}
```

### Сброс настроек
```typescript
function resetToDefaults() {
  setFontSettings(DEFAULT_FONT_SETTINGS);
  applyFontSettings(DEFAULT_FONT_SETTINGS);
  localStorage.removeItem('tenderHub_fontSettings');
  message.info('Настройки сброшены к значениям по умолчанию');
  setHasChanges(false);
}
```

### Обновление настройки
```typescript
function updateFontSettings(key: keyof FontSettings, value: any) {
  const newSettings = { ...fontSettings, [key]: value };
  setFontSettings(newSettings);
  applyFontSettings(newSettings);
}
```

## Загрузка шрифтов

### Ссылка на Google Fonts
```typescript
useEffect(() => {
  const link = document.createElement('link');
  link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Roboto:wght@300;400;500;700&family=Open+Sans:wght@300;400;500;600;700&family=Montserrat:wght@300;400;500;600;700&family=PT+Sans:wght@400;700&family=Source+Sans+Pro:wght@300;400;600;700&family=Noto+Sans:wght@300;400;500;600;700&display=swap';
  link.rel = 'stylesheet';
  document.head.appendChild(link);

  return () => {
    document.head.removeChild(link);
  };
}, []);
```

## Реализация предпросмотра

### Примерное содержимое
```tsx
<Card title="Предпросмотр">
  <Title level={3}>Заголовок третьего уровня</Title>
  <Title level={4}>Заголовок четвертого уровня</Title>
  <Paragraph>
    Это пример обычного текста с текущими настройками шрифта.
    Здесь вы можете увидеть, как будет выглядеть текст в приложении
    с выбранными параметрами.
  </Paragraph>
  <Paragraph>
    <Text strong>Жирный текст</Text> и{' '}
    <Text type="secondary">вторичный текст</Text>{' '}
    также адаптируются под ваши настройки.
    <Text code>Моноширинный текст</Text> остается неизменным.
  </Paragraph>
  <ul>
    <li>Первый пункт списка</li>
    <li>Второй пункт списка</li>
    <li>Третий пункт списка</li>
  </ul>
</Card>
```

## Реализация компактного режима

### Переключение CSS-класса
```typescript
if (settings.compactMode) {
  document.documentElement.classList.add('compact-mode');
} else {
  document.documentElement.classList.remove('compact-mode');
}
```

### Стили компактного режима
```css
.compact-mode {
  /* Уменьшить глобальные интервалы */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 12px;
  --spacing-lg: 16px;
  --spacing-xl: 20px;
}

.compact-mode .ant-card-body {
  padding: 12px !important;
}

.compact-mode .ant-table-thead > tr > th,
.compact-mode .ant-table-tbody > tr > td {
  padding: 4px 8px !important;
}

.compact-mode .ant-form-item {
  margin-bottom: 12px !important;
}

.compact-mode .ant-btn {
  padding: 2px 12px !important;
  font-size: 13px !important;
}
```

## Валидация

### Валидация диапазона чисел
```typescript
function validateFontSize(size: number): boolean {
  if (size < 10 || size > 20) {
    message.error('Размер шрифта должен быть от 10 до 20 пикселей');
    return false;
  }
  return true;
}

function validateLineHeight(height: number): boolean {
  if (height < 1.2 || height > 2.0) {
    message.error('Высота строки должна быть от 1.2 до 2.0');
    return false;
  }
  return true;
}
```

## Обработка ошибок

### Ошибки localStorage
```typescript
try {
  localStorage.setItem('tenderHub_fontSettings', JSON.stringify(fontSettings));
  message.success('Настройки сохранены');
} catch (error) {
  if (error.name === 'QuotaExceededError') {
    message.error('Недостаточно места в хранилище браузера');
  } else {
    message.error('Ошибка сохранения настроек');
  }
  console.error('Error saving settings:', error);
}
```

### Ошибки парсинга JSON
```typescript
try {
  const parsed = JSON.parse(savedSettings);
  setFontSettings(parsed);
} catch (error) {
  console.error('Error parsing settings:', error);
  // Вернуться к значениям по умолчанию
  setFontSettings(DEFAULT_FONT_SETTINGS);
}
```

## Оптимизации производительности

### Применение с задержкой
```typescript
const debouncedApply = useMemo(
  () => debounce((settings: FontSettings) => {
    applyFontSettings(settings);
  }, 100),
  []
);
```

### Мемоизированный список шрифтов
```typescript
const fontOptions = useMemo(() => FONT_FAMILIES.map(f => ({
  label: f.label,
  value: f.value,
})), []);
```

## Доступность

### Навигация с клавиатуры
- Все элементы управления фокусируемы
- Логичный порядок Tab
- Enter для сохранения
- Escape для отмены (в модальных окнах)

### Поддержка программ чтения с экрана
- Правильные метки для всех элементов управления
- Aria-метки где необходимо
- Описательный текст помощи

### Высокий контраст
- Настройки работают с режимом высокого контраста
- Чёткие визуальные индикаторы
- Достаточный цветовой контраст

## Совместимость с браузерами

### Поддерживаемые браузеры
- Chrome/Edge: Полная поддержка
- Firefox: Полная поддержка
- Safari: Полная поддержка (хорошо использует системные шрифты)
- Мобильные браузеры: Базовая поддержка

### Запасные варианты
```typescript
// Цепочка запасных вариантов семейства шрифтов
fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'

// Системные шрифты предпочтительны для производительности
```

## Связанные страницы

Все страницы, на которые влияют эти настройки:
- Изменения шрифтов применяются глобально
- Компактный режим влияет на все таблицы и формы
- Согласованный опыт во всём приложении

## Скриншоты

_Здесь будут размещены скриншоты, показывающие:_
1. Обзор страницы настроек
2. Выбор семейства шрифтов
3. Слайдер размера шрифта
4. Регулировка высоты строки
5. Сравнение компактного режима
6. Панель предпросмотра
7. Сводка текущих настроек

## Технические заметки

### Почему CSS пользовательские свойства?

**Преимущества**:
- Обновления в реальном времени без перезагрузки
- Область видимости на :root
- Легко переопределить
- Хорошая поддержка браузерами
- Производительность (без повторного рендеринга)

### Почему localStorage?

**Преимущества**:
- Сохраняется между сеансами
- Нет обмена данными с сервером
- Мгновенная загрузка при запуске
- Простой API
- ~5МБ лимит хранилища (достаточно)

**Недостатки**:
- Не синхронизируется между устройствами
- Может быть очищен пользователем
- Нет шифрования

### Стратегия загрузки шрифтов

**Шрифты загружаются по требованию**:
1. Системные шрифты: Мгновенно (уже установлены)
2. Веб-шрифты: Асинхронная загрузка через CDN Google Fonts
3. Цепочка запасных вариантов гарантирует, что текст всегда отрисовывается

## Будущие улучшения

- [ ] Настройка цветов темы
- [ ] Настройки плотности таблицы
- [ ] Управление скоростью анимации
- [ ] Языковые предпочтения
- [ ] Настройки часового пояса
- [ ] Предпочтения формата даты
- [ ] Предпочтения формата чисел
- [ ] Экспорт/импорт настроек
- [ ] Предустановки настроек
- [ ] Облачная синхронизация настроек
- [ ] Предпочтения макета для каждой страницы
- [ ] Настройка горячих клавиш
