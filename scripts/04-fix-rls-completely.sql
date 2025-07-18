-- Drop all existing policies and disable RLS completely
DROP POLICY IF EXISTS "Employees can view their own data" ON employees;
DROP POLICY IF EXISTS "Admins can manage all employees" ON employees;
DROP POLICY IF EXISTS "Employees can view their assigned tasks" ON tasks;
DROP POLICY IF EXISTS "Admins can manage all tasks" ON tasks;
DROP POLICY IF EXISTS "Employees can update their task status" ON tasks;
DROP POLICY IF EXISTS "Users can view relevant task history" ON task_status_history;
DROP POLICY IF EXISTS "Users can insert task history" ON task_status_history;

-- Completely disable RLS on all tables
ALTER TABLE IF EXISTS employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS task_status_history DISABLE ROW LEVEL SECURITY;

-- Drop and recreate tables to ensure clean state
DROP TABLE IF EXISTS task_status_history CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS employees CASCADE;

-- Recreate employees table
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

-- Recreate tasks table
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

-- Recreate task status history table
CREATE TABLE task_status_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure RLS is disabled (double check)
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_status_history DISABLE ROW LEVEL SECURITY;

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

-- Verify data insertion
SELECT 'Data verification:' as status;
SELECT email, role, password_hash FROM employees ORDER BY role, email;
