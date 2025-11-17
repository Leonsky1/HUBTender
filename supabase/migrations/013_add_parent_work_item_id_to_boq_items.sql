-- Migration: Add parent_work_item_id to boq_items
-- Description: Добавление связи материалов с работами в элементах позиций заказчика
-- Created: 2025-11-17

-- Добавляем поле parent_work_item_id для привязки материалов к работам
ALTER TABLE public.boq_items
ADD COLUMN IF NOT EXISTS parent_work_item_id uuid;

-- Добавляем комментарий к полю
COMMENT ON COLUMN public.boq_items.parent_work_item_id IS 'Привязка материала к работе (FK к boq_items.id, NULL если материал независимый)';

-- Добавляем внешний ключ с ON DELETE SET NULL (только если не существует)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'boq_items_parent_work_item_id_fkey'
    ) THEN
        ALTER TABLE public.boq_items
        ADD CONSTRAINT boq_items_parent_work_item_id_fkey
            FOREIGN KEY (parent_work_item_id)
            REFERENCES public.boq_items(id)
            ON DELETE SET NULL;
    END IF;
END $$;

-- Создаем индекс для оптимизации запросов по привязке
CREATE INDEX IF NOT EXISTS idx_boq_items_parent_work_item_id
ON public.boq_items USING btree (parent_work_item_id);

-- Добавляем CHECK constraint: только материалы могут иметь parent_work_item_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'boq_items_parent_work_check'
    ) THEN
        ALTER TABLE public.boq_items
        ADD CONSTRAINT boq_items_parent_work_check
            CHECK (
                (boq_item_type IN ('мат', 'суб-мат', 'мат-комп.'))
                OR
                (boq_item_type IN ('раб', 'суб-раб', 'раб-комп.') AND parent_work_item_id IS NULL)
            );
    END IF;
END $$;
