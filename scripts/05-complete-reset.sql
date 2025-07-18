-- Complete database reset - drop everything and start fresh
DROP TABLE IF EXISTS task_status_history CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS employees CASCADE;

-- Drop any existing policies (just in case)
DROP POLICY IF EXISTS "Employees can view their own data" ON employees;
DROP POLICY IF EXISTS "Admins can manage all employees" ON employees;
DROP POLICY IF EXISTS "Employees can view their assigned tasks" ON tasks;
DROP POLICY IF EXISTS "Admins can manage all tasks" ON tasks;
DROP POLICY IF EXISTS "Employees can update their task status" ON tasks;
DROP POLICY IF EXISTS "Users can view relevant task history" ON task_status_history;
DROP POLICY IF EXISTS "Users can insert task history" ON task_status_history;

-- Create employees table with explicit RLS disabled
CREATE TABLE employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  contact_number VARCHAR(20),
  position VARCHAR(100),
  role VARCHAR(20) DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Explicitly disable RLS
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;

-- Create tasks table
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  assigned_to UUID REFERENCES employees(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'not_started' CHECK (status IN ('not_started', '50_done', '70_done', 'completed', 'pending')),
  status_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Explicitly disable RLS
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;

-- Create task status history table
CREATE TABLE task_status_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Explicitly disable RLS
ALTER TABLE task_status_history DISABLE ROW LEVEL SECURITY;

-- Grant full permissions to anon and authenticated roles
GRANT ALL ON employees TO anon;
GRANT ALL ON employees TO authenticated;
GRANT ALL ON tasks TO anon;
GRANT ALL ON tasks TO authenticated;
GRANT ALL ON task_status_history TO anon;
GRANT ALL ON task_status_history TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Insert demo data
INSERT INTO employees (full_name, email, password_hash, contact_number, position, role)
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
SELECT 'Data verification:' as info, email, role FROM employees ORDER BY role, email;
