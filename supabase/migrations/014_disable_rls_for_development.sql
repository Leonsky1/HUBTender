-- Migration: Disable RLS for development
-- Description: Временно отключаем RLS для упрощения разработки
-- Created: 2025-11-17

-- Отключаем RLS для boq_items
ALTER TABLE public.boq_items DISABLE ROW LEVEL SECURITY;
