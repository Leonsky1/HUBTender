-- Добавление поля default_value в таблицу markup_parameters
-- Это поле будет хранить базовые (глобальные) значения процентов наценок

-- Добавляем поле default_value
ALTER TABLE public.markup_parameters
ADD COLUMN default_value numeric(5,2) NOT NULL DEFAULT 0;

-- Добавляем комментарий к полю
COMMENT ON COLUMN public.markup_parameters.default_value IS
'Базовое (глобальное) значение процента по умолчанию. Используется при создании новых тендеров и как значение по умолчанию в интерфейсе.';

-- Добавляем ограничение: значение должно быть от 0 до 999.99
ALTER TABLE public.markup_parameters
ADD CONSTRAINT markup_parameters_default_value_range
CHECK (default_value >= 0 AND default_value <= 999.99);
