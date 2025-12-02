-- Seed 002: Create initial administrator account
-- Purpose: Create first admin user who can approve other registrations
--
-- IMPORTANT: Before running this script:
-- 1. Go to Supabase Dashboard -> Authentication -> Users
-- 2. Click "Invite User" and create user with email: admin@su10.ru
-- 3. Copy the UUID from the created user
-- 4. Replace 'REPLACE_WITH_ADMIN_UUID' below with the actual UUID
-- 5. Run this script in Supabase SQL Editor

-- Insert initial administrator
INSERT INTO public.users (
  id,
  full_name,
  email,
  role,
  access_status,
  allowed_pages,
  approved_by,
  approved_at,
  registration_date
)
VALUES (
  'REPLACE_WITH_ADMIN_UUID'::uuid,  -- Replace with actual UUID from auth.users
  'Системный Администратор',
  'admin@su10.ru',
  'Администратор',
  'approved',
  '[]'::jsonb,  -- Empty array = full access
  'REPLACE_WITH_ADMIN_UUID'::uuid,  -- Self-approved
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;  -- Prevent duplicate if already exists

-- Verify the insert
SELECT
  id,
  full_name,
  email,
  role,
  access_status,
  registration_date
FROM public.users
WHERE email = 'admin@su10.ru';
