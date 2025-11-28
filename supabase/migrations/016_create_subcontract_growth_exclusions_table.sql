-- Migration 016: Create subcontract_growth_exclusions table
-- Description: Creates table and RPC functions for managing subcontract growth exclusions

-- Удаляем таблицу если существует (на случай повторного применения)
DROP TABLE IF EXISTS public.subcontract_growth_exclusions CASCADE;

-- Создаем таблицу
CREATE TABLE public.subcontract_growth_exclusions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tender_id uuid NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
  detail_cost_category_id uuid NOT NULL REFERENCES public.detail_cost_categories(id) ON DELETE CASCADE,
  exclusion_type text NOT NULL DEFAULT 'works' CHECK (exclusion_type IN ('works', 'materials')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT subcontract_growth_exclusions_unique UNIQUE (tender_id, detail_cost_category_id, exclusion_type)
);

-- Комментарии
COMMENT ON TABLE public.subcontract_growth_exclusions IS 'Исключения роста субподряда для категорий затрат';
COMMENT ON COLUMN public.subcontract_growth_exclusions.exclusion_type IS 'Тип исключения: works (суб-раб) или materials (суб-мат)';

-- Создаем триггер для updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.subcontract_growth_exclusions;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.subcontract_growth_exclusions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Выдаем права доступа
GRANT ALL ON public.subcontract_growth_exclusions TO anon;
GRANT ALL ON public.subcontract_growth_exclusions TO authenticated;
GRANT ALL ON public.subcontract_growth_exclusions TO service_role;

-- Включаем RLS (но политики отключены для разработки)
ALTER TABLE public.subcontract_growth_exclusions ENABLE ROW LEVEL SECURITY;

-- Создаем политику "все могут все" для разработки
DROP POLICY IF EXISTS "Allow all for development" ON public.subcontract_growth_exclusions;
CREATE POLICY "Allow all for development"
  ON public.subcontract_growth_exclusions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =========================================
-- RPC Функции для работы с исключениями
-- =========================================

-- Функция 1: Получение исключений для тендера
CREATE OR REPLACE FUNCTION get_subcontract_growth_exclusions(p_tender_id uuid)
RETURNS TABLE (
  detail_cost_category_id uuid,
  exclusion_type text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.detail_cost_category_id,
    e.exclusion_type
  FROM public.subcontract_growth_exclusions e
  WHERE e.tender_id = p_tender_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_subcontract_growth_exclusions(uuid) TO anon, authenticated, service_role;

COMMENT ON FUNCTION get_subcontract_growth_exclusions IS 'Получает список исключений роста субподряда для указанного тендера';

-- Функция 2: Добавление исключения
CREATE OR REPLACE FUNCTION add_subcontract_growth_exclusion(
  p_tender_id uuid,
  p_detail_cost_category_id uuid,
  p_exclusion_type text DEFAULT 'works'
)
RETURNS uuid AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_exclusion_type NOT IN ('works', 'materials') THEN
    RAISE EXCEPTION 'Invalid exclusion_type: must be ''works'' or ''materials''';
  END IF;

  INSERT INTO public.subcontract_growth_exclusions (
    tender_id,
    detail_cost_category_id,
    exclusion_type
  )
  VALUES (
    p_tender_id,
    p_detail_cost_category_id,
    p_exclusion_type
  )
  ON CONFLICT (tender_id, detail_cost_category_id, exclusion_type)
  DO UPDATE SET updated_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION add_subcontract_growth_exclusion(uuid, uuid, text) TO anon, authenticated, service_role;

COMMENT ON FUNCTION add_subcontract_growth_exclusion IS 'Добавляет исключение роста субподряда (или обновляет существующее)';

-- Функция 3: Удаление исключения
CREATE OR REPLACE FUNCTION remove_subcontract_growth_exclusion(
  p_tender_id uuid,
  p_detail_cost_category_id uuid,
  p_exclusion_type text DEFAULT 'works'
)
RETURNS boolean AS $$
DECLARE
  v_deleted boolean;
BEGIN
  DELETE FROM public.subcontract_growth_exclusions
  WHERE tender_id = p_tender_id
    AND detail_cost_category_id = p_detail_cost_category_id
    AND exclusion_type = p_exclusion_type;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION remove_subcontract_growth_exclusion(uuid, uuid, text) TO anon, authenticated, service_role;

COMMENT ON FUNCTION remove_subcontract_growth_exclusion IS 'Удаляет исключение роста субподряда';

-- Функция 4: Переключение исключения (toggle)
CREATE OR REPLACE FUNCTION toggle_subcontract_growth_exclusion(
  p_tender_id uuid,
  p_detail_cost_category_id uuid,
  p_exclusion_type text DEFAULT 'works'
)
RETURNS boolean AS $$
DECLARE
  v_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.subcontract_growth_exclusions
    WHERE tender_id = p_tender_id
      AND detail_cost_category_id = p_detail_cost_category_id
      AND exclusion_type = p_exclusion_type
  ) INTO v_exists;

  IF v_exists THEN
    PERFORM remove_subcontract_growth_exclusion(p_tender_id, p_detail_cost_category_id, p_exclusion_type);
    RETURN false;
  ELSE
    PERFORM add_subcontract_growth_exclusion(p_tender_id, p_detail_cost_category_id, p_exclusion_type);
    RETURN true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION toggle_subcontract_growth_exclusion(uuid, uuid, text) TO anon, authenticated, service_role;

COMMENT ON FUNCTION toggle_subcontract_growth_exclusion IS 'Переключает состояние исключения роста субподряда (вкл/выкл)';

-- Перезагружаем схему PostgREST
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
