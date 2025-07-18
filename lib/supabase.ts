import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Main Supabase client for general use (might be subject to RLS if serviceRoleKey is not used)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  db: {
    schema: "public",
  },
  global: {
    headers: {
      "X-Client-Info": "employee-management-system-general",
    },
  },
})

// Supabase client specifically for admin operations that require bypassing RLS
// This client MUST use the SUPABASE_SERVICE_ROLE_KEY
if (!serviceRoleKey) {
  console.warn(
    "SUPABASE_SERVICE_ROLE_KEY is not set. supabaseAdmin client will use anon key and might be affected by RLS.",
  )
}
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey || supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  db: {
    schema: "public",
  },
  global: {
    headers: {
      "X-Client-Info": "employee-management-system-admin",
      apikey: serviceRoleKey || supabaseAnonKey, // Ensure service role key is used here
      Authorization: `Bearer ${serviceRoleKey || supabaseAnonKey}`,
    },
  },
})

export type Employee = {
  id: string
  full_name: string
  email: string
  contact_number: string
  position: string
  role: "admin" | "employee"
  created_at: string
}

export type Task = {
  id: string
  task_name: string
  description: string
  category: string
  assigned_to: string
  status: "not_started" | "50_done" | "70_done" | "completed" | "pending"
  status_locked: boolean
  created_at: string
  expires_at: string
  employee?: Employee
}
