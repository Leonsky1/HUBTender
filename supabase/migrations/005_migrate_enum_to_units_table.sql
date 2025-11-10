-- =====================================================================
-- Миграция с ENUM unit_type на таблицу units
-- Это позволит динамически добавлять новые единицы измерения
-- =====================================================================

-- Шаг 1: Создаем таблицу единиц измерения
CREATE TABLE IF NOT EXISTS public.units (
    code TEXT PRIMARY KEY,  -- Используем code как PK для простоты миграции
    name TEXT NOT NULL,
    name_short TEXT,
    description TEXT,
    category TEXT, -- Категория: длина, площадь, объем, масса, количество
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Комментарии к таблице
COMMENT ON TABLE public.units IS 'Справочник единиц измерения';
COMMENT ON COLUMN public.units.code IS 'Код единицы измерения (первичный ключ)';
COMMENT ON COLUMN public.units.name IS 'Полное наименование';
COMMENT ON COLUMN public.units.name_short IS 'Краткое наименование';
COMMENT ON COLUMN public.units.description IS 'Описание единицы измерения';
COMMENT ON COLUMN public.units.category IS 'Категория измерения';
COMMENT ON COLUMN public.units.sort_order IS 'Порядок сортировки';
COMMENT ON COLUMN public.units.is_active IS 'Признак активности';

-- Шаг 2: Заполняем таблицу существующими и новыми единицами
INSERT INTO public.units (code, name, name_short, category, sort_order, description) VALUES
    -- Существующие единицы
    ('шт',    'Штуки',            'шт',    'количество', 10, 'Поштучный учет'),
    ('м',     'Метры',            'м',     'длина',      20, 'Линейные метры'),
    ('м2',    'Квадратные метры', 'м²',    'площадь',    30, 'Площадь поверхности'),
    ('м3',    'Кубические метры', 'м³',    'объем',      40, 'Объем'),
    ('кг',    'Килограммы',       'кг',    'масса',      50, 'Масса в килограммах'),
    ('т',     'Тонны',            'т',     'масса',      60, 'Масса в тоннах (1000 кг)'),
    ('л',     'Литры',            'л',     'объем',      70, 'Объем жидкости'),
    ('компл', 'Комплект',         'компл', 'количество', 80, 'Набор элементов'),
    ('м.п.',  'Метры погонные',   'м.п.',  'длина',      90, 'Погонный метр'),

    -- Новые единицы
    ('точка',  'Точка',            'точка',  'количество', 100, 'Точечный элемент (розетки, светильники)'),
    ('км',     'Километры',        'км',     'длина',      110, 'Расстояние в километрах (1000 м)'),
    ('прибор', 'Прибор',           'прибор', 'количество', 120, 'Единица оборудования'),
    ('пог.м',  'Погонные метры',   'пог.м',  'длина',      130, 'Погонный метр (альтернативное)'),
    ('упак',   'Упаковка',         'упак',   'количество', 140, 'Упакованный товар'),

    -- Дополнительные полезные единицы
    ('мм',     'Миллиметры',       'мм',     'длина',      15, 'Миллиметры'),
    ('см',     'Сантиметры',       'см',     'длина',      18, 'Сантиметры'),
    ('дм2',    'Квадратные дециметры', 'дм²', 'площадь',   32, 'Квадратные дециметры'),
    ('га',     'Гектары',          'га',     'площадь',    35, 'Гектары (10000 м²)'),
    ('мл',     'Миллилитры',       'мл',     'объем',      65, 'Миллилитры'),
    ('г',      'Граммы',           'г',      'масса',      45, 'Граммы'),
    ('ц',      'Центнеры',         'ц',      'масса',      55, 'Центнеры (100 кг)'),
    ('чел',    'Человек',          'чел',    'количество', 150, 'Человеко-единицы'),
    ('чел.ч',  'Человеко-часы',    'чел.ч',  'трудозатраты', 160, 'Трудозатраты в человеко-часах'),
    ('маш.ч',  'Машино-часы',      'маш.ч',  'трудозатраты', 170, 'Машинное время'),
    ('смена',  'Смена',            'смена',  'время',      180, 'Рабочая смена'),
    ('сутки',  'Сутки',            'сутки',  'время',      190, 'Календарные сутки'),
    ('месяц',  'Месяц',            'месяц',  'время',      200, 'Календарный месяц'),
    ('квартал','Квартал',          'кварт',  'время',      210, 'Календарный квартал'),
    ('год',    'Год',              'год',    'время',      220, 'Календарный год')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    name_short = EXCLUDED.name_short,
    category = EXCLUDED.category,
    sort_order = EXCLUDED.sort_order,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Шаг 3: Создаем индексы для производительности
CREATE INDEX IF NOT EXISTS idx_units_category ON public.units(category);
CREATE INDEX IF NOT EXISTS idx_units_is_active ON public.units(is_active);
CREATE INDEX IF NOT EXISTS idx_units_sort_order ON public.units(sort_order);

-- Шаг 4: Добавляем триггер для автообновления updated_at
CREATE TRIGGER update_units_updated_at
    BEFORE UPDATE ON public.units
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Шаг 5: Переименовываем старые колонки для сохранения данных
ALTER TABLE public.cost_categories
    ALTER COLUMN unit TYPE TEXT;

ALTER TABLE public.detail_cost_categories
    ALTER COLUMN unit TYPE TEXT;

ALTER TABLE public.material_names
    ALTER COLUMN unit TYPE TEXT;

ALTER TABLE public.work_names
    ALTER COLUMN unit TYPE TEXT;

-- Шаг 6: Добавляем внешние ключи к таблице units
ALTER TABLE public.cost_categories
    ADD CONSTRAINT cost_categories_unit_fkey
    FOREIGN KEY (unit) REFERENCES public.units(code)
    ON UPDATE CASCADE
    ON DELETE RESTRICT;

ALTER TABLE public.detail_cost_categories
    ADD CONSTRAINT detail_cost_categories_unit_fkey
    FOREIGN KEY (unit) REFERENCES public.units(code)
    ON UPDATE CASCADE
    ON DELETE RESTRICT;

ALTER TABLE public.material_names
    ADD CONSTRAINT material_names_unit_fkey
    FOREIGN KEY (unit) REFERENCES public.units(code)
    ON UPDATE CASCADE
    ON DELETE RESTRICT;

ALTER TABLE public.work_names
    ADD CONSTRAINT work_names_unit_fkey
    FOREIGN KEY (unit) REFERENCES public.units(code)
    ON UPDATE CASCADE
    ON DELETE RESTRICT;

-- Шаг 7: Удаляем старый ENUM тип (если он больше не используется)
-- ВНИМАНИЕ: Закомментировано для безопасности
-- DROP TYPE IF EXISTS public.unit_type;

-- Шаг 8: Создаем представление для совместимости
CREATE OR REPLACE VIEW public.v_unit_types AS
    SELECT code, name, name_short, category
    FROM public.units
    WHERE is_active = true
    ORDER BY sort_order;

-- Шаг 9: Предоставляем права доступа
GRANT SELECT ON public.units TO anon, authenticated;
GRANT ALL ON public.units TO service_role;
GRANT SELECT ON public.v_unit_types TO anon, authenticated;

-- Шаг 10: Добавляем RLS политики (если нужно)
-- ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Units are viewable by everyone"
--     ON public.units FOR SELECT
--     USING (true);

-- CREATE POLICY "Units are editable by admins only"
--     ON public.units FOR ALL
--     USING (auth.jwt() ->> 'role' = 'admin');

-- =====================================================================
-- Проверка результатов
-- =====================================================================
-- SELECT * FROM public.units ORDER BY sort_order;
-- SELECT * FROM public.v_unit_types;