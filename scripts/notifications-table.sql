-- Создание таблицы notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    type text NOT NULL CHECK (type IN ('success', 'info', 'warning', 'pending')),
    title text NOT NULL,
    message text NOT NULL,
    related_entity_type text,
    related_entity_id uuid,
    is_read boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT notifications_pkey PRIMARY KEY (id)
);

-- Комментарии к таблице и столбцам
COMMENT ON TABLE public.notifications IS 'Системные уведомления для пользователей';
COMMENT ON COLUMN public.notifications.id IS 'Уникальный идентификатор уведомления';
COMMENT ON COLUMN public.notifications.type IS 'Тип уведомления (success, info, warning, pending)';
COMMENT ON COLUMN public.notifications.title IS 'Заголовок уведомления';
COMMENT ON COLUMN public.notifications.message IS 'Текст уведомления';
COMMENT ON COLUMN public.notifications.related_entity_type IS 'Тип связанной сущности (tender, position, cost, etc.)';
COMMENT ON COLUMN public.notifications.related_entity_id IS 'ID связанной сущности';
COMMENT ON COLUMN public.notifications.is_read IS 'Признак прочтения уведомления';
COMMENT ON COLUMN public.notifications.created_at IS 'Дата и время создания';

-- Включаем Realtime для таблицы
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Добавляем тестовые уведомления
INSERT INTO public.notifications (type, title, message, related_entity_type, is_read) VALUES
('success', 'Тендер успешно создан', 'Новый тендер "Строительство офисного здания" добавлен в систему', 'tender', false),
('info', 'Обновление данных', 'Обновлены курсы валют', NULL, false),
('warning', 'Требуется внимание', 'У тендера "Реконструкция склада" истекает срок подачи', 'tender', false),
('pending', 'Ожидание проверки', 'Расчет затрат по тендеру "Монтаж оборудования" готов к проверке', 'tender', true),
('success', 'Позиции обновлены', 'Успешно обновлено 25 позиций заказчика в тендере "Ремонт помещений"', 'position', false);
