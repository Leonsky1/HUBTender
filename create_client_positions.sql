-- =============================================
-- Таблица: client_positions
-- Описание: Позиции заказчика из ВОРа (Bill of Quantities)
-- =============================================

CREATE TABLE IF NOT EXISTS public.client_positions (
    -- Первичный ключ
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Связь с тендером
    tender_id UUID NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,

    -- Автоматическая нумерация позиций
    position_number INTEGER NOT NULL,

    -- Единица измерения
    unit_code TEXT REFERENCES public.units(code) ON DELETE RESTRICT,

    -- Данные заказчика
    volume NUMERIC(18, 6), -- Объем заказчика
    client_note TEXT, -- Примечание заказчика
    item_no TEXT, -- Номер раздела заказчика (из файла)
    work_name TEXT NOT NULL, -- Название работы

    -- Данные ГП (ручной ввод)
    manual_volume NUMERIC(18, 6), -- Количество ГП
    manual_note TEXT, -- Примечание ГП

    -- Иерархия
    hierarchy_level INTEGER DEFAULT 0, -- Уровень в иерархии (вводится вручную)
    is_additional BOOLEAN DEFAULT FALSE, -- Признак дополнительной строки
    parent_position_id UUID REFERENCES public.client_positions(id) ON DELETE SET NULL, -- Связь с родительской строкой

    -- Прямые стоимости (расчетные)
    total_material NUMERIC(18, 2) DEFAULT 0, -- Прямая стоимость материалов
    total_works NUMERIC(18, 2) DEFAULT 0, -- Прямая стоимость работ
    material_cost_per_unit NUMERIC(18, 6) DEFAULT 0, -- Стоимость материалов за единицу
    work_cost_per_unit NUMERIC(18, 6) DEFAULT 0, -- Стоимость работ за единицу

    -- Коммерческие стоимости (с наценками)
    total_commercial_material NUMERIC(18, 2) DEFAULT 0, -- Коммерческая стоимость материалов
    total_commercial_work NUMERIC(18, 2) DEFAULT 0, -- Коммерческая стоимость работ
    total_commercial_material_per_unit NUMERIC(18, 6) DEFAULT 0, -- Коммерческая стоимость материалов за единицу
    total_commercial_work_per_unit NUMERIC(18, 6) DEFAULT 0, -- Коммерческая стоимость работ за единицу

    -- Системные поля
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- Индексы
-- =============================================

-- Индекс для быстрого поиска по тендеру
CREATE INDEX IF NOT EXISTS idx_client_positions_tender_id
ON public.client_positions(tender_id);

-- Индекс для иерархической навигации
CREATE INDEX IF NOT EXISTS idx_client_positions_parent_id
ON public.client_positions(parent_position_id);

-- Индекс для сортировки по номеру позиции
CREATE INDEX IF NOT EXISTS idx_client_positions_position_number
ON public.client_positions(tender_id, position_number);

-- Индекс для быстрого поиска дополнительных строк
CREATE INDEX IF NOT EXISTS idx_client_positions_is_additional
ON public.client_positions(tender_id, is_additional);

-- =============================================
-- Триггер для автоматического обновления updated_at
-- =============================================

CREATE OR REPLACE FUNCTION update_client_positions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_client_positions_updated_at
    BEFORE UPDATE ON public.client_positions
    FOR EACH ROW
    EXECUTE FUNCTION update_client_positions_updated_at();

-- =============================================
-- Комментарии к таблице и столбцам
-- =============================================

COMMENT ON TABLE public.client_positions IS 'Позиции заказчика из ВОРа (Bill of Quantities)';

COMMENT ON COLUMN public.client_positions.id IS 'Уникальный идентификатор позиции';
COMMENT ON COLUMN public.client_positions.tender_id IS 'Связь с тендером';
COMMENT ON COLUMN public.client_positions.position_number IS 'Автоматический порядковый номер позиции';
COMMENT ON COLUMN public.client_positions.unit_code IS 'Код единицы измерения (ссылка на units.code)';
COMMENT ON COLUMN public.client_positions.volume IS 'Объем заказчика';
COMMENT ON COLUMN public.client_positions.client_note IS 'Примечание заказчика';
COMMENT ON COLUMN public.client_positions.item_no IS 'Номер раздела заказчика (из файла ВОР)';
COMMENT ON COLUMN public.client_positions.work_name IS 'Название работы/позиции';
COMMENT ON COLUMN public.client_positions.manual_volume IS 'Количество ГП (ручной ввод)';
COMMENT ON COLUMN public.client_positions.manual_note IS 'Примечание ГП (ручной ввод)';
COMMENT ON COLUMN public.client_positions.hierarchy_level IS 'Уровень в иерархии (вводится вручную)';
COMMENT ON COLUMN public.client_positions.is_additional IS 'Признак дополнительной строки';
COMMENT ON COLUMN public.client_positions.parent_position_id IS 'Связь с родительской позицией для доп. строк';
COMMENT ON COLUMN public.client_positions.total_material IS 'Прямая стоимость материалов (расчетная)';
COMMENT ON COLUMN public.client_positions.total_works IS 'Прямая стоимость работ (расчетная)';
COMMENT ON COLUMN public.client_positions.material_cost_per_unit IS 'Стоимость материалов за единицу';
COMMENT ON COLUMN public.client_positions.work_cost_per_unit IS 'Стоимость работ за единицу';
COMMENT ON COLUMN public.client_positions.total_commercial_material IS 'Коммерческая стоимость материалов с наценками';
COMMENT ON COLUMN public.client_positions.total_commercial_work IS 'Коммерческая стоимость работ с наценками';
COMMENT ON COLUMN public.client_positions.total_commercial_material_per_unit IS 'Коммерческая стоимость материалов за единицу';
COMMENT ON COLUMN public.client_positions.total_commercial_work_per_unit IS 'Коммерческая стоимость работ за единицу';
COMMENT ON COLUMN public.client_positions.created_at IS 'Дата и время создания записи';
COMMENT ON COLUMN public.client_positions.updated_at IS 'Дата и время последнего обновления записи';

-- =============================================
-- RLS (Row Level Security) - Определены, но отключены
-- =============================================

-- Включить RLS (закомментировано, так как пока не используется)
-- ALTER TABLE public.client_positions ENABLE ROW LEVEL SECURITY;

-- Политики доступа (закомментированы)
-- CREATE POLICY "Users can view client_positions from their organization"
--     ON public.client_positions FOR SELECT
--     USING (auth.uid() IN (SELECT user_id FROM user_organizations WHERE organization_id = organization_id));

-- CREATE POLICY "Users can insert client_positions"
--     ON public.client_positions FOR INSERT
--     WITH CHECK (auth.uid() IS NOT NULL);

-- CREATE POLICY "Users can update their own client_positions"
--     ON public.client_positions FOR UPDATE
--     USING (created_by = auth.uid());

-- CREATE POLICY "Users can delete their own client_positions"
--     ON public.client_positions FOR DELETE
--     USING (created_by = auth.uid());
