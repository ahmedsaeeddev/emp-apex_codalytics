"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { LogOut } from "lucide-react"
import { getCurrentUser, signOut } from "@/lib/auth"
import type { Employee } from "@/lib/firebase"
// Removed: import { ModeToggle } from "@/components/mode-toggle"

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3 sm:px-6 sm:py-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Employee Dashboard</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Your assigned tasks</p>
          </div>
          {/* Removed: <ModeToggle /> */}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto p-4 sm:p-6">{children}</main>

      {/* Footer (User Info Card) */}
      <footer className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-4 py-3 sm:px-6 sm:py-4 mt-auto">
        <div className="max-w-4xl mx-auto">
          <Card className="p-2 sm:p-3 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600">
            <div className="flex items-center space-x-2 sm:space-x-3 justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{currentUser.fullName}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">{currentUser.position}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>
      </footer>
    </div>
  )
}
