-- Исправление внешнего ключа в таблице detail_cost_categories

-- Удаляем старое ограничение если оно существует
ALTER TABLE public.detail_cost_categories
DROP CONSTRAINT IF EXISTS detail_cost_categories_cost_category_id_fkey;

-- Добавляем правильное ограничение внешнего ключа
ALTER TABLE public.detail_cost_categories
ADD CONSTRAINT detail_cost_categories_cost_category_id_fkey
    FOREIGN KEY (cost_category_id)
    REFERENCES public.cost_categories(id)
    ON DELETE CASCADE;