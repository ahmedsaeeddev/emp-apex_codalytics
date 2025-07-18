-- IMPORTANT: This script performs a complete reset of the specified tables.
-- All existing data in 'employees', 'tasks', and 'task_status_history' will be DELETED.

-- Drop all existing policies on relevant tables
DROP POLICY IF EXISTS "Employees can view their own data" ON employees;
DROP POLICY IF EXISTS "Admins can manage all employees" ON employees;
DROP POLICY IF EXISTS "Employees can view their assigned tasks" ON tasks;
DROP POLICY IF EXISTS "Admins can manage all tasks" ON tasks;
DROP POLICY IF EXISTS "Employees can update their task status" ON tasks;
DROP POLICY IF EXISTS "Users can view relevant task history" ON task_status_history;
DROP POLICY IF EXISTS "Users can insert task history" ON task_status_history;

-- Drop tables in correct order to avoid foreign key constraints
DROP TABLE IF EXISTS task_status_history CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS employees CASCADE;

-- Recreate employees table
CREATE TABLE public.employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  contact_number VARCHAR(20),
  position VARCHAR(100),
  role VARCHAR(20) DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Explicitly disable RLS for the employees table
ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;

-- Grant full permissions to the service_role for employees table
REVOKE ALL ON TABLE public.employees FROM authenticated, anon;
GRANT ALL ON TABLE public.employees TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.employees TO postgres;


-- Recreate tasks table
CREATE TABLE public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  assigned_to UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'not_started' CHECK (status IN ('not_started', '50_done', '70_done', 'completed', 'pending')),
  status_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Explicitly disable RLS for the tasks table
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;

-- Grant full permissions to the service_role for tasks table
REVOKE ALL ON TABLE public.tasks FROM authenticated, anon;
GRANT ALL ON TABLE public.tasks TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.tasks TO postgres;


-- Recreate task_status_history table
CREATE TABLE public.task_status_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Explicitly disable RLS for the task_status_history table
ALTER TABLE public.task_status_history DISABLE ROW LEVEL SECURITY;

-- Grant full permissions to the service_role for task_status_history table
REVOKE ALL ON TABLE public.task_status_history FROM authenticated, anon;
GRANT ALL ON TABLE public.task_status_history TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.task_status_history TO postgres;


-- Grant usage on sequences to service_role
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO postgres;


-- Insert demo data
INSERT INTO public.employees (full_name, email, password_hash, contact_number, position, role)
VALUES 
(
  'System Admin',
  'admin@company.com',
  'admin123',
  '+1234567890',
  'System Administrator',
  'admin'
),
(
  'John Doe',
  'john.doe@company.com',
  'employee123',
  '+1234567891',
  'Software Developer',
  'employee'
),
(
  'Jane Smith',
  'jane.smith@company.com',
  'employee123',
  '+1234567892',
  'UI/UX Designer',
  'employee'
),
(
  'Demo Employee',
  'demo@company.com',
  'employee123',
  '+1234567893',
  'Software Developer',
  'employee'
);

-- Verify the setup
SELECT 'Setup verification:' as status;
SELECT 'RLS Status for employees:' as info, relrowsecurity as rls_enabled FROM pg_class WHERE relname = 'employees';
SELECT 'RLS Status for tasks:' as info, relrowsecurity as rls_enabled FROM pg_class WHERE relname = 'tasks';
SELECT 'RLS Status for task_status_history:' as info, relrowsecurity as rls_enabled FROM pg_class WHERE relname = 'task_status_history';
SELECT 'Data verification:' as info, email, role FROM public.employees ORDER BY role, email;
