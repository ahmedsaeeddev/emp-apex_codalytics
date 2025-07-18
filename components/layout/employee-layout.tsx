"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { LogOut } from "lucide-react"
import { getCurrentUser, signOut } from "@/lib/auth"
import type { Employee } from "@/lib/firebase" // Import Employee type from firebase

interface EmployeeLayoutProps {
  children: React.ReactNode
}

export default function EmployeeLayout({ children }: EmployeeLayoutProps) {
  const [currentUser, setCurrentUser] = useState<Employee | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const user = await getCurrentUser()
      if (!user || user.role !== "employee") {
        router.push("/login")
        return
      }
      setCurrentUser(user)
    }
    checkAuth()
  }, [router])

  const handleSignOut = async () => {
    await signOut()
    router.push("/login")
  }

  if (!currentUser) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Employee Dashboard</h1>
              <p className="text-sm text-slate-600 mt-1">Your assigned tasks</p>
            </div>
            <Card className="p-2 sm:p-3">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{currentUser.fullName}</p>
                  <p className="text-xs text-slate-600">{currentUser.position}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-slate-600 hover:text-slate-900"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}
