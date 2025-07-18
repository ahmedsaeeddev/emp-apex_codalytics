"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabaseAdmin } from "@/lib/supabase" // Use supabaseAdmin here

export default function DebugInfo() {
  const [dbStatus, setDbStatus] = useState<string>("Checking...")
  const [employees, setEmployees] = useState<any[]>([])
  const [connectionDetails, setConnectionDetails] = useState<string>("")

  const checkDatabase = async () => {
    try {
      console.log("🔍 Testing database connection using supabaseAdmin...")

      // Test basic connection and fetch employees using supabaseAdmin
      const { data, error } = await supabaseAdmin.from("employees").select("*").limit(10)

      if (error) {
        console.error("❌ Database operation failed with supabaseAdmin:", error)
        setDbStatus(`Connection/Query Error: ${error.message}`)
        setConnectionDetails(`Error Code: ${error.code || "Unknown"}`)
        setEmployees([])
      } else {
        console.log("✅ Database operation successful with supabaseAdmin:", data?.length, "users found")
        setDbStatus("✅ Connected successfully (via Admin Client)")
        setConnectionDetails(`Found ${data?.length || 0} users in database`)
        setEmployees(data || [])
      }
    } catch (err) {
      console.error("💥 Unexpected error during debug check:", err)
      setDbStatus(`Unexpected Error: ${err}`)
      setConnectionDetails("Check browser console for details")
      setEmployees([])
    }
  }

  useEffect(() => {
    checkDatabase()
  }, [])

  return (
    <Card className="mt-4 border-slate-200">
      <CardHeader>
        <CardTitle className="text-sm text-slate-700">🔧 Database Debug Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-xs">
          <strong>Status:</strong> {dbStatus}
        </div>
        <div className="text-xs">
          <strong>Details:</strong> {connectionDetails}
        </div>
        <div className="text-xs">
          <strong>Users found:</strong> {employees.length}
        </div>
        {employees.length > 0 && (
          <div className="text-xs">
            <strong>Available logins:</strong>
            <div className="mt-1 space-y-1 bg-slate-50 p-2 rounded">
              {employees.map((emp) => (
                <div key={emp.id} className="font-mono text-xs">
                  📧 {emp.email} | 🔑 {emp.password_hash} | 👤 {emp.role}
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="flex space-x-2">
          <Button onClick={checkDatabase} size="sm" variant="outline" className="text-xs bg-transparent">
            🔄 Refresh
          </Button>
        </div>

        <div className="text-xs bg-blue-50 p-2 rounded border-l-2 border-blue-200">
          <strong>💡 Fallback Mode:</strong> If database fails, demo credentials will work:
          <br />• admin@company.com / admin123
          <br />• demo@company.com / employee123
        </div>
      </CardContent>
    </Card>
  )
}
