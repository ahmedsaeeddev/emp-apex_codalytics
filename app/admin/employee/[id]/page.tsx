"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Edit, Save, X, Trash2 } from "lucide-react"
import AdminLayout from "@/components/layout/admin-layout"
import { db, type Employee } from "@/lib/firebase" // Import db
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function EmployeeDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false) // New state for deletion
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    contactNumber: "",
    position: "",
  })

  const employeeUid = params.id as string

  useEffect(() => {
    if (employeeUid) {
      fetchEmployee(employeeUid)
    }
  }, [employeeUid])

  const fetchEmployee = async (uid: string) => {
    setLoading(true)
    try {
      console.log("🔍 Fetching employee details for UID:", uid)
      const employeeDocRef = doc(db, "employees", uid)
      const employeeDocSnap = await getDoc(employeeDocRef)

      if (!employeeDocSnap.exists()) {
        console.error("❌ Employee not found in Firestore for UID:", uid)
        throw new Error("Employee not found")
      }

      const employeeData = { uid: employeeDocSnap.id, ...employeeDocSnap.data() } as Employee
      console.log("✅ Employee details fetched:", employeeData.email)
      setEmployee(employeeData)
      setEditForm({
        fullName: employeeData.fullName,
        email: employeeData.email,
        contactNumber: employeeData.contactNumber || "",
        position: employeeData.position,
      })
    } catch (error) {
      console.error("💥 Error fetching employee:", error)
      alert("Employee not found or error loading details.")
      router.push("/admin/employees")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!employee) return

    setSaving(true)
    try {
      console.log("💾 Updating employee:", employee.uid)

      const employeeDocRef = doc(db, "employees", employee.uid)
      await updateDoc(employeeDocRef, {
        fullName: editForm.fullName,
        email: editForm.email,
        contactNumber: editForm.contactNumber || "",
        position: editForm.position,
      })

      console.log("✅ Employee updated successfully")
      setEmployee({ ...employee, ...editForm }) // Update local state
      setEditing(false)
    } catch (error: any) {
      console.error("💥 Error updating employee:", error)
      alert(`Error updating employee: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditForm({
      fullName: employee?.fullName || "",
      email: employee?.email || "",
      contactNumber: employee?.contactNumber || "",
      position: employee?.position || "",
    })
    setEditing(false)
  }

  const handleDeleteEmployee = async () => {
    if (!employee) return

    setDeleting(true)
    try {
      console.log("🗑️ Deleting employee document from Firestore:", employee.uid)
      const employeeDocRef = doc(db, "employees", employee.uid)
      await deleteDoc(employeeDocRef)
      console.log("✅ Employee document deleted from Firestore.")

      // IMPORTANT: Deleting the Firebase Authentication user must be done server-side.
      // This client-side code only deletes the Firestore document.
      // You would typically call a server-side function (e.g., a Next.js Route Handler or Server Action) here
      // that uses the Firebase Admin SDK to delete the user from Firebase Auth.
      // Example: await fetch('/api/delete-firebase-user', { method: 'POST', body: JSON.stringify({ uid: employee.uid }) });
      console.warn(
        "⚠️ Firebase Authentication user deletion is required but must be done server-side using Firebase Admin SDK.",
      )
      console.warn("Please implement a server-side function to delete user:", employee.uid, "from Firebase Auth.")

      router.push("/admin/employees") // Redirect after deletion
    } catch (error: any) {
      console.error("💥 Error deleting employee:", error)
      alert(`Error deleting employee: ${error.message}`)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600">Loading employee details...</div>
        </div>
      </AdminLayout>
    )
  }

  if (!employee) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-slate-900">Employee not found</h3>
          <Button onClick={() => router.push("/admin/employees")} className="mt-4" variant="outline">
            Back to Employees
          </Button>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => router.push("/admin/employees")} className="text-slate-600">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Employees
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Employee Details</h1>
              <p className="text-slate-600 mt-1">View and edit employee information</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {" "}
            {/* Use flex-wrap for buttons */}
            {editing ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="text-slate-600 bg-transparent"
                  disabled={saving}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white" disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => setEditing(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Employee
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={deleting}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Employee
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the employee{" "}
                        <span className="font-semibold text-slate-900">{employee.fullName}</span> and remove their data
                        from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteEmployee} disabled={deleting}>
                        {deleting ? "Deleting..." : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </div>

        <Card className="w-full max-w-full md:max-w-2xl mx-auto">
          {" "}
          {/* Adjusted max-w-full for responsiveness */}
          <CardHeader>
            <CardTitle className="text-xl text-slate-900">
              {editing ? "Edit Employee Information" : "Employee Information"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-slate-700">
                  Full Name
                </Label>
                {editing ? (
                  <Input
                    id="fullName"
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="border-slate-300 focus:border-blue-500"
                  />
                ) : (
                  <div className="p-3 bg-slate-50 rounded-md text-slate-900">{employee.fullName}</div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="position" className="text-slate-700">
                  Position
                </Label>
                {editing ? (
                  <Input
                    id="position"
                    value={editForm.position}
                    onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                    className="border-slate-300 focus:border-blue-500"
                  />
                ) : (
                  <div className="p-3 bg-slate-50 rounded-md text-slate-900">{employee.position}</div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700">
                  Email Address
                </Label>
                {editing ? (
                  <Input
                    id="email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="border-slate-300 focus:border-blue-500"
                  />
                ) : (
                  <div className="p-3 bg-slate-50 rounded-md text-slate-900">{employee.email}</div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactNumber" className="text-slate-700">
                  Contact Number
                </Label>
                {editing ? (
                  <Input
                    id="contactNumber"
                    value={editForm.contactNumber}
                    onChange={(e) => setEditForm({ ...editForm, contactNumber: e.target.value })}
                    className="border-slate-300 focus:border-blue-500"
                    placeholder="Enter contact number"
                  />
                ) : (
                  <div className="p-3 bg-slate-50 rounded-md text-slate-900">
                    {employee.contactNumber || "No contact number"}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {" "}
                {/* Adjusted to sm:grid-cols-2 */}
                <div>
                  <span className="text-slate-600">Employee ID:</span>
                  <div className="font-mono text-slate-900 mt-1 text-xs break-all">{employee.uid}</div>
                </div>
                <div>
                  <span className="text-slate-600">Joined:</span>
                  <div className="text-slate-900 mt-1">
                    {employee.createdAt?.toDate().toLocaleDateString() || "N/A"}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
