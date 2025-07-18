"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Mail, Phone, User } from "lucide-react"
import AdminLayout from "@/components/layout/admin-layout"
import { db, auth, type Employee } from "@/lib/firebase"
import { collection, getDocs, query, where, doc, setDoc } from "firebase/firestore"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { PasswordInput } from "@/components/password-input" // Import PasswordInput

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [addingEmployee, setAddingEmployee] = useState(false)
  const [newEmployee, setNewEmployee] = useState({
    fullName: "",
    email: "",
    password: "",
    contactNumber: "",
    position: "",
  })
  const [addError, setAddError] = useState("")

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    setLoading(true)
    try {
      console.log("🔍 Fetching employees from Firestore...")
      const employeesCol = collection(db, "employees")
      const q = query(employeesCol, where("role", "==", "employee"))
      const employeeSnapshot = await getDocs(q)
      const employeesList = employeeSnapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      })) as Employee[]

      console.log("✅ Employees fetched:", employeesList.length)
      setEmployees(employeesList)
    } catch (error) {
      console.error("💥 Error fetching employees:", error)
      setEmployees([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddingEmployee(true)
    setAddError("")

    try {
      console.log("➕ Adding new employee:", {
        ...newEmployee,
        password: "[HIDDEN]",
      })

      // 1. Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, newEmployee.email, newEmployee.password)
      const user = userCredential.user
      console.log("✅ User created in Firebase Auth:", user.email)

      // 2. Add employee details to Firestore
      const employeeData: Omit<Employee, "createdAt"> = {
        uid: user.uid,
        fullName: newEmployee.fullName,
        email: newEmployee.email,
        contactNumber: newEmployee.contactNumber || "",
        position: newEmployee.position,
        role: "employee",
      }

      await setDoc(doc(db, "employees", user.uid), {
        ...employeeData,
        createdAt: new Date(), // Use Date object for Firestore Timestamp
      })
      console.log("✅ Employee details added to Firestore for UID:", user.uid)

      // Reset form
      setNewEmployee({
        fullName: "",
        email: "",
        password: "",
        contactNumber: "",
        position: "",
      })
      setShowAddDialog(false)
      fetchEmployees() // Refresh list
    } catch (error: any) {
      console.error("💥 Error adding employee:", error)
      let errorMessage = "Error adding employee. Please try again."
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Email already in use. Please use a different email."
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password is too weak. Must be at least 6 characters."
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email format."
      }
      setAddError(errorMessage)
    } finally {
      setAddingEmployee(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600 dark:text-slate-400">Loading employees...</div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Employees</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Manage your team members</p>
          </div>

          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50">
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddEmployee} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={newEmployee.fullName}
                    onChange={(e) => setNewEmployee({ ...newEmployee, fullName: e.target.value })}
                    placeholder="Enter full name"
                    required
                    className="bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                    placeholder="Enter email address"
                    required
                    className="bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <PasswordInput // Using PasswordInput here
                    id="password"
                    value={newEmployee.password}
                    onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                    placeholder="Must be at least 6 characters"
                    required
                    className="bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactNumber">Contact Number</Label>
                  <Input
                    id="contactNumber"
                    value={newEmployee.contactNumber}
                    onChange={(e) => setNewEmployee({ ...newEmployee, contactNumber: e.target.value })}
                    placeholder="Enter contact number"
                    className="bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Position *</Label>
                  <Input
                    id="position"
                    value={newEmployee.position}
                    onChange={(e) => setNewEmployee({ ...newEmployee, position: e.target.value })}
                    placeholder="Enter job position"
                    required
                    className="bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-50"
                  />
                </div>

                {addError && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{addError}</div>}

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddDialog(false)}
                    disabled={addingEmployee}
                    className="bg-transparent dark:bg-slate-700 text-slate-700 dark:text-slate-50 hover:bg-slate-100 dark:hover:bg-slate-600"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={addingEmployee}>
                    {addingEmployee ? "Adding..." : "Add Employee"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.map((employee) => (
            <Link key={employee.uid} href={`/admin/employee/${employee.uid}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-slate-900 dark:text-slate-50 flex items-center">
                    <User className="mr-2 h-5 w-5 text-slate-600 dark:text-slate-400" />
                    {employee.fullName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                    <Mail className="mr-2 h-4 w-4" />
                    {employee.email}
                  </div>
                  <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                    <Phone className="mr-2 h-4 w-4" />
                    {employee.contactNumber || "No contact number"}
                  </div>
                  <div className="mt-3">
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full dark:bg-blue-900 dark:text-blue-200">
                      {employee.position}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {employees.length === 0 && (
          <div className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-600" />
            <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-50">No employees found</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {loading ? "Loading..." : "Get started by adding your first employee."}
            </p>
            <div className="mt-4 text-xs text-slate-400 dark:text-slate-500">
              Make sure Firebase is configured and you have added employees.
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
