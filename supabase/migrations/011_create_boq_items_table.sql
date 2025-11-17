-- Migration: Create boq_items table
-- Description: Элементы позиций заказчика (Bill of Quantities Items)
-- Created: 2025-11-17

-- Table: public.boq_items
-- Description: Элементы позиций заказчика с детализацией по работам и материалам
CREATE TABLE IF NOT EXISTS public.boq_items (
    -- Идентификация
    id uuid NOT NULL DEFAULT gen_random_uuid(),

    -- Связи с другими таблицами
    tender_id uuid NOT NULL,
    client_position_id uuid NOT NULL,

    -- Сортировка
    sort_number integer NOT NULL DEFAULT 0,

    -- Типы элементов (используем существующие enum типы)
    boq_item_type public.boq_item_type NOT NULL,
    material_type public.material_type,

    -- Наименования (связи с справочниками)
    material_name_id uuid,
    work_name_id uuid,

    -- Единица измерения (связь с таблицей units)
    unit_code text,

    -- Количественные показатели
    quantity numeric(18,6),
    base_quantity numeric(18,6),
    consumption_coefficient numeric(10,4),
    conversion_coefficient numeric(10,4),

    -- Доставка
    delivery_price_type public.delivery_price_type,
    delivery_amount numeric(15,2) DEFAULT 0.00,

    -- Валюта и суммы
    currency_type public.currency_type DEFAULT 'RUB'::public.currency_type,
    total_amount numeric(18,2),

    -- Затрата на строительство
    detail_cost_category_id uuid,

    -- Примечание
    quote_link text,

    -- Коммерческие показатели
    commercial_markup numeric(10,4),
    total_commercial_material_cost numeric(18,2),
    total_commercial_work_cost numeric(18,2),

    -- Служебные поля
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),

    -- Первичный ключ
    CONSTRAINT boq_items_pkey PRIMARY KEY (id),

    -- Внешние ключи
    CONSTRAINT boq_items_tender_id_fkey
        FOREIGN KEY (tender_id)
        REFERENCES public.tenders(id)
        ON DELETE CASCADE,

    CONSTRAINT boq_items_client_position_id_fkey
        FOREIGN KEY (client_position_id)
        REFERENCES public.client_positions(id)
        ON DELETE CASCADE,

    CONSTRAINT boq_items_material_name_id_fkey
        FOREIGN KEY (material_name_id)
        REFERENCES public.material_names(id)
        ON DELETE RESTRICT,

    CONSTRAINT boq_items_work_name_id_fkey
        FOREIGN KEY (work_name_id)
        REFERENCES public.work_names(id)
        ON DELETE RESTRICT,

    CONSTRAINT boq_items_unit_code_fkey
        FOREIGN KEY (unit_code)
        REFERENCES public.units(code)
        ON DELETE RESTRICT,

    CONSTRAINT boq_items_detail_cost_category_id_fkey
        FOREIGN KEY (detail_cost_category_id)
        REFERENCES public.detail_cost_categories(id)
        ON DELETE SET NULL,

    -- Проверочные ограничения (CHECK constraints)
    -- Для материалов должен быть указан material_name_id и material_type
    CONSTRAINT boq_items_material_check
        CHECK (
            (boq_item_type IN ('мат', 'суб-мат', 'мат-комп.') AND material_name_id IS NOT NULL AND material_type IS NOT NULL AND work_name_id IS NULL)
            OR
            (boq_item_type IN ('раб', 'суб-раб', 'раб-комп.') AND work_name_id IS NOT NULL AND material_name_id IS NULL AND material_type IS NULL)
        ),

    -- Количественные показатели должны быть положительными
    CONSTRAINT boq_items_quantity_positive
        CHECK (quantity IS NULL OR quantity > 0),

    CONSTRAINT boq_items_base_quantity_positive
        CHECK (base_quantity IS NULL OR base_quantity > 0),

    CONSTRAINT boq_items_consumption_coefficient_positive
        CHECK (consumption_coefficient IS NULL OR consumption_coefficient > 0),

    CONSTRAINT boq_items_conversion_coefficient_positive
        CHECK (conversion_coefficient IS NULL OR conversion_coefficient > 0),

    -- Сумма доставки только если тип доставки 'суммой'
    CONSTRAINT boq_items_delivery_amount_check
        CHECK (
            (delivery_price_type = 'суммой' AND delivery_amount IS NOT NULL)
            OR
            (delivery_price_type IN ('в цене', 'не в цене') AND (delivery_amount IS NULL OR delivery_amount = 0))
            OR
            (delivery_price_type IS NULL)
        )
);

-- Комментарии к таблице и колонкам
COMMENT ON TABLE public.boq_items IS 'Элементы позиций заказчика (Bill of Quantities Items)';

-- Идентификация
COMMENT ON COLUMN public.boq_items.id IS 'Уникальный идентификатор элемента позиции (UUID)';
COMMENT ON COLUMN public.boq_items.tender_id IS 'Привязка к таблице tenders';
COMMENT ON COLUMN public.boq_items.client_position_id IS 'Привязка к таблице client_positions';

-- Сортировка
COMMENT ON COLUMN public.boq_items.sort_number IS 'Сортировка элементов позиций заказчика';

-- Типы
COMMENT ON COLUMN public.boq_items.boq_item_type IS 'Тип строки в виде enum (мат, суб-мат, мат-комп., раб, суб-раб, раб-комп.)';
COMMENT ON COLUMN public.boq_items.material_type IS 'Тип материала (основной/вспомогательный)';

-- Наименования
COMMENT ON COLUMN public.boq_items.material_name_id IS 'Наименование материала, связан с таблицей material_names';
COMMENT ON COLUMN public.boq_items.work_name_id IS 'Наименование работы, связан с таблицей work_names';

-- Единица измерения
COMMENT ON COLUMN public.boq_items.unit_code IS 'Единица измерения, связана с таблицей units';

-- Количественные показатели
COMMENT ON COLUMN public.boq_items.quantity IS 'Количество';
COMMENT ON COLUMN public.boq_items.base_quantity IS 'Базовое количество для непривязанного материала к работе';
COMMENT ON COLUMN public.boq_items.consumption_coefficient IS 'Коэффициент расхода материала';
COMMENT ON COLUMN public.boq_items.conversion_coefficient IS 'Коэффициент перевода материала';

-- Доставка
COMMENT ON COLUMN public.boq_items.delivery_price_type IS 'Тип доставки (в цене, не в цене, суммой)';
COMMENT ON COLUMN public.boq_items.delivery_amount IS 'Стоимость доставки';

-- Валюта и суммы
COMMENT ON COLUMN public.boq_items.currency_type IS 'Тип валюты (RUB, USD, EUR, CNY)';
COMMENT ON COLUMN public.boq_items.total_amount IS 'Итоговая сумма';

-- Затрата на строительство
COMMENT ON COLUMN public.boq_items.detail_cost_category_id IS 'Затрата на строительство, связь с таблицей detail_cost_categories';

-- Примечание
COMMENT ON COLUMN public.boq_items.quote_link IS 'Примечание';

-- Коммерческие показатели
COMMENT ON COLUMN public.boq_items.commercial_markup IS 'Коэффициент наценки';
COMMENT ON COLUMN public.boq_items.total_commercial_material_cost IS 'Итоговая стоимость материала в коммерческой стоимости';
COMMENT ON COLUMN public.boq_items.total_commercial_work_cost IS 'Итоговая стоимость работы в коммерческой стоимости';

-- Служебные поля
COMMENT ON COLUMN public.boq_items.created_at IS 'Дата и время создания записи';
COMMENT ON COLUMN public.boq_items.updated_at IS 'Дата и время последнего обновления';

-- Создаем индексы для оптимизации запросов
CREATE INDEX idx_boq_items_tender_id ON public.boq_items USING btree (tender_id);
CREATE INDEX idx_boq_items_client_position_id ON public.boq_items USING btree (client_position_id);
CREATE INDEX idx_boq_items_material_name_id ON public.boq_items USING btree (material_name_id);
CREATE INDEX idx_boq_items_work_name_id ON public.boq_items USING btree (work_name_id);
CREATE INDEX idx_boq_items_boq_item_type ON public.boq_items USING btree (boq_item_type);
CREATE INDEX idx_boq_items_detail_cost_category_id ON public.boq_items USING btree (detail_cost_category_id);
CREATE INDEX idx_boq_items_sort_number ON public.boq_items USING btree (client_position_id, sort_number);

-- Создаем триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION public.update_boq_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER boq_items_updated_at_trigger
    BEFORE UPDATE ON public.boq_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_boq_items_updated_at();

-- Включаем Row Level Security (RLS)
ALTER TABLE public.boq_items ENABLE ROW LEVEL SECURITY;

-- Создаем политики RLS (базовые, можно расширить позже)
-- Политика на чтение: все авторизованные пользователи могут читать
CREATE POLICY "Пользователи могут просматривать элементы позиций"
    ON public.boq_items
    FOR SELECT
    TO authenticated
    USING (true);

-- Политика на вставку: все авторизованные пользователи могут создавать
CREATE POLICY "Пользователи могут создавать элементы позиций"
    ON public.boq_items
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Политика на обновление: все авторизованные пользователи могут обновлять
CREATE POLICY "Пользователи могут обновлять элементы позиций"
    ON public.boq_items
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Политика на удаление: все авторизованные пользователи могут удалять
CREATE POLICY "Пользователи могут удалять элементы позиций"
    ON public.boq_items
    FOR DELETE
    TO authenticated
    USING (true);
