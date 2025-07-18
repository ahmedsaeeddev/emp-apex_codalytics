-- Clear existing data
DELETE FROM task_status_history;
DELETE FROM tasks;
DELETE FROM employees;

-- Insert admin user
INSERT INTO employees (id, full_name, email, password_hash, contact_number, position, role)
VALUES (
  gen_random_uuid(),
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
  'Mike Johnson',
  'mike.johnson@company.com',
  'employee123',
  '+1234567893',
  'Project Manager',
  'employee'
),
(
  'Sarah Wilson',
  'sarah.wilson@company.com',
  'employee123',
  '+1234567894',
  'QA Engineer',
  'employee'
);
