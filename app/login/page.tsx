"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { signIn } from "@/lib/auth"
import { PasswordInput } from "@/components/password-input" // Import PasswordInput

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    console.log("Login attempt:", email, password)

    const { employee, error: authError } = await signIn(email, password)

    if (authError) {
      console.error("Auth error:", authError)
      setError(authError)
      setLoading(false)
      return
    }

    if (employee) {
      console.log("Login successful, storing user:", employee)
      // localStorage.setItem("currentUser", JSON.stringify(employee)) // Handled inside signIn

      if (employee.role === "admin") {
        router.push("/admin/employees")
      } else {
        router.push("/employee/dashboard")
      }
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            Employee Management System
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">
            Sign in to access your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="border-slate-300 dark:border-slate-600 focus:border-blue-500 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 dark:text-slate-300">
                Password
              </Label>
              <PasswordInput // Using PasswordInput here
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="border-slate-300 dark:border-slate-600 focus:border-blue-500 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-50"
              />
            </div>

            {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}

            <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
