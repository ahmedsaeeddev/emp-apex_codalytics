"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Users, ClipboardList, Archive, LogOut, Menu } from "lucide-react"
import { getCurrentUser, signOut } from "@/lib/auth"
import type { Employee } from "@/lib/firebase"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ModeToggle } from "@/components/mode-toggle" // Import ModeToggle

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [currentUser, setCurrentUser] = useState<Employee | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const user = await getCurrentUser()
      if (!user || user.role !== "admin") {
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

  const navigation = [
    { name: "Employees", href: "/admin/employees", icon: Users },
    { name: "Assign Work", href: "/admin/assign-work", icon: ClipboardList },
    { name: "Previous Tasks", href: "/admin/previous-tasks", icon: Archive },
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col lg:flex-row">
      {/* Mobile Header (visible on small screens) */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between lg:hidden">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Admin Panel</h1>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-white dark:bg-slate-800 p-0">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Admin Panel</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Employee Management</p>
              </div>
              <nav className="px-4 py-2 space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link key={item.name} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        className={`w-full justify-start ${
                          isActive
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                        }`}
                      >
                        <Icon className="mr-3 h-4 w-4" />
                        {item.name}
                      </Button>
                    </Link>
                  )
                })}
              </nav>
              <div className="absolute bottom-4 left-4 right-4">
                <Card className="p-4 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600">
                  <div className="flex items-center justify-between">
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
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Sidebar (visible on large screens) */}
      <div className="hidden lg:block w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 min-h-screen flex-shrink-0">
        <div className="p-6">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Admin Panel</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Employee Management</p>
        </div>

        <nav className="px-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={`w-full justify-start ${
                    isActive
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
                  <Icon className="mr-3 h-4 w-4" />
                  {item.name}
                </Button>
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <Card className="p-4 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600">
            <div className="flex items-center justify-between">
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
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <main>{children}</main>
      </div>
    </div>
  )
}
