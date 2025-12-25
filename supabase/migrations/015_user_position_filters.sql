-- Миграция 015: Персональные фильтры позиций заказчика
-- Дата создания: 2025-12-25
-- Описание: Добавление таблицы для хранения персональных фильтров позиций для каждого пользователя

-- Таблица для хранения персональных фильтров позиций
CREATE TABLE IF NOT EXISTS public.user_position_filters (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    tender_id uuid NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
    position_id uuid NOT NULL REFERENCES public.client_positions(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),

    -- Один пользователь может выбрать одну позицию только один раз в рамках тендера
    CONSTRAINT unique_user_tender_position UNIQUE(user_id, tender_id, position_id)
);

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_user_position_filters_user_tender
    ON public.user_position_filters(user_id, tender_id);

CREATE INDEX IF NOT EXISTS idx_user_position_filters_position
    ON public.user_position_filters(position_id);

-- Комментарии для документации
COMMENT ON TABLE public.user_position_filters IS
    'Персональные фильтры позиций заказчика для каждого пользователя. Используется для сохранения выбранных позиций при фильтрации на странице /positions.';

COMMENT ON COLUMN public.user_position_filters.user_id IS
    'ID пользователя, которому принадлежит фильтр';

COMMENT ON COLUMN public.user_position_filters.tender_id IS
    'ID тендера, к которому относится фильтр';

COMMENT ON COLUMN public.user_position_filters.position_id IS
    'ID позиции заказчика, включенной в фильтр';

COMMENT ON COLUMN public.user_position_filters.created_at IS
    'Дата и время добавления позиции в фильтр';
