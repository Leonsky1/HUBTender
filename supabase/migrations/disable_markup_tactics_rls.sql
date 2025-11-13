-- Временно отключаем RLS для markup_tactics до внедрения аутентификации
-- Это согласуется с общей политикой проекта: RLS отключен для всех таблиц

-- Удаляем все политики
DROP POLICY IF EXISTS "Users can view their own tactics and global tactics" ON markup_tactics;
DROP POLICY IF EXISTS "Users can create their own tactics" ON markup_tactics;
DROP POLICY IF EXISTS "Users can update their own tactics" ON markup_tactics;
DROP POLICY IF EXISTS "Users can delete their own tactics" ON markup_tactics;

-- Отключаем RLS
ALTER TABLE markup_tactics DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE markup_tactics IS 'Хранение тактик наценок для конструктора наценок (RLS отключен до внедрения аутентификации)';
