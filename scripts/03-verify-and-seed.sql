-- First, let's check if tables exist and create them if they don't
DO $$
BEGIN
    -- Check if employees table exists, if not create it
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'employees') THEN
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
    END IF;

    -- Check if tasks table exists, if not create it
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tasks') THEN
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
    END IF;

    -- Check if task_status_history table exists, if not create it
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'task_status_history') THEN
        CREATE TABLE task_status_history (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
            employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
            status VARCHAR(20) NOT NULL,
            changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END
$$;

-- Disable RLS to avoid policy issues
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_status_history DISABLE ROW LEVEL SECURITY;

-- Clear existing data and insert fresh demo data
DELETE FROM task_status_history;
DELETE FROM tasks;
DELETE FROM employees;

-- Insert admin user
INSERT INTO employees (full_name, email, password_hash, contact_number, position, role)
VALUES (
    'System Admin',
    'admin@company.com',
    'admin123',
    '+1234567890',
    'System Administrator',
    'admin'
);

-- Insert sample employees
INSERT INTO employees (full_name, email, password_hash, contact_number, position, role)
VALUES 
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

-- Verify the data was inserted
SELECT 'Admin users:' as info, count(*) as count FROM employees WHERE role = 'admin';
SELECT 'Employee users:' as info, count(*) as count FROM employees WHERE role = 'employee';
SELECT 'All users:' as info, email, role FROM employees ORDER BY role, email;
