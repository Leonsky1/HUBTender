-- Migration 015: Add housing_class and construction_scope fields to tenders table
-- Created: 2025-12-02
-- Description: Adds two new ENUM types and corresponding columns to tenders table

-- Create ENUM type for housing class
CREATE TYPE public.housing_class_type AS ENUM (
  'комфорт',
  'бизнес',
  'премиум',
  'делюкс'
);

-- Create ENUM type for construction scope
CREATE TYPE public.construction_scope_type AS ENUM (
  'генподряд',
  'коробка',
  'монолит'
);

-- Add new columns to tenders table
ALTER TABLE public.tenders
  ADD COLUMN housing_class public.housing_class_type,
  ADD COLUMN construction_scope public.construction_scope_type;

-- Add comments for documentation
COMMENT ON COLUMN public.tenders.housing_class IS 'Класс жилья (комфорт, бизнес, премиум, делюкс)';
COMMENT ON COLUMN public.tenders.construction_scope IS 'Объем строительства (генподряд, коробка, монолит)';
