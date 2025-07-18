"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Edit, Save, X, Trash2, Clock, FileText } from "lucide-react" // Added Clock, FileText
import AdminLayout from "@/components/layout/admin-layout"
import { db, type Employee, type Task } from "@/lib/firebase"
import { doc, getDoc, updateDoc, deleteDoc, collection, query, where, Timestamp, getDocs } from "firebase/firestore" // Added collection, query, where, Timestamp, getDocs
import { PasswordInput } from "@/components/password-input" // Import PasswordInput
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
  const [deleting, setDeleting] = useState(false)
  const [assignedTasks, setAssignedTasks] = useState<Task[]>([]) // New state for assigned tasks
  const [previousTasks, setPreviousTasks] = useState<Task[]>([]) // New state for previous tasks
  const [tasksLoading, setTasksLoading] = useState(true) // New state for tasks loading
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    contactNumber: "",
    position: "",
    newPassword: "", // New field for password change
  })

  const employeeUid = params.id as string

  useEffect(() => {
    if (employeeUid) {
      fetchEmployee(employeeUid)
      fetchEmployeeTasks(employeeUid) // Fetch tasks when employeeUid is available
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
        newPassword: "", // Initialize new password as empty
      })
    } catch (error) {
      console.error("💥 Error fetching employee:", error)
      alert("Employee not found or error loading details.")
      router.push("/admin/employees")
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployeeTasks = async (uid: string) => {
    setTasksLoading(true)
    try {
      console.log("🔍 Fetching tasks for employee UID:", uid)
      const tasksCol = collection(db, "tasks")

      // Fetch active tasks
      const activeTasksQuery = query(
        tasksCol,
        where("assignedToUid", "==", uid),
        where("expiresAt", ">", Timestamp.now()),
      )
      const activeTaskSnapshot = await getDocs(activeTasksQuery)
      const activeTasksList = activeTaskSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[]
      setAssignedTasks(activeTasksList)

      // Fetch previous/expired tasks
      const previousTasksQuery = query(
        tasksCol,
        where("assignedToUid", "==", uid),
        where("expiresAt", "<=", Timestamp.now()),
      )
      const previousTaskSnapshot = await getDocs(previousTasksQuery)
      const previousTasksList = previousTaskSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[]
      setPreviousTasks(previousTasksList)

      console.log("✅ Tasks fetched: Active:", activeTasksList.length, "Previous:", previousTasksList.length)
    } catch (error) {
      console.error("💥 Error fetching employee tasks:", error)
      setAssignedTasks([])
      setPreviousTasks([])
    } finally {
      setTasksLoading(false)
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

      // IMPORTANT: Updating Firebase Authentication user password must be done server-side.
      // This client-side code only updates the Firestore document.
      // You would typically call a server-side function (e.g., a Next.js Route Handler or Server Action) here
      // that uses the Firebase Admin SDK to update the user's password.
      if (editForm.newPassword) {
        console.warn(
          "⚠️ Firebase Authentication user password update is required but must be done server-side using Firebase Admin SDK.",
        )
        console.warn("Please implement a server-side function to update password for user:", employee.uid)
        // Example: await fetch('/api/update-firebase-user-password', { method: 'POST', body: JSON.stringify({ uid: employee.uid, newPassword: editForm.newPassword }) });
      }

      console.log("✅ Employee updated successfully")
      setEmployee({ ...employee, ...editForm }) // Update local state
      setEditing(false)
      setEditForm((prev) => ({ ...prev, newPassword: "" })) // Clear password field after save
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
      newPassword: "", // Clear new password on cancel
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "not_started":
        return "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200"
      case "50_done":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "70_done":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "pending":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "not_started":
        return "Not Started"
      case "50_done":
        return "50% Done"
      case "70_done":
        return "70% Done"
      case "completed":
        return "Completed"
      case "pending":
        return "Pending"
      default:
        return status
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600 dark:text-slate-400">Loading employee details...</div>
        </div>
      </AdminLayout>
    )
  }

  if (!employee) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-50">Employee not found</h3>
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
            <Button
              variant="outline"
              onClick={() => router.push("/admin/employees")}
              className="text-slate-600 dark:text-slate-400"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Employees
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Employee Details</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">View and edit employee information</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {editing ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="bg-transparent dark:bg-slate-700 text-slate-700 dark:text-slate-50 hover:bg-slate-100 dark:hover:bg-slate-600"
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
                  <AlertDialogContent className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the employee{" "}
                        <span className="font-semibold text-slate-900 dark:text-slate-50">{employee.fullName}</span> and
                        remove their data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-transparent dark:bg-slate-700 text-slate-700 dark:text-slate-50 hover:bg-slate-100 dark:hover:bg-slate-600">
                        Cancel
                      </AlertDialogCancel>
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

        <Card className="w-full max-w-full md:max-w-2xl mx-auto bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-xl text-slate-900 dark:text-slate-50">
              {editing ? "Edit Employee Information" : "Employee Information"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-slate-700 dark:text-slate-300">
                  Full Name
                </Label>
                {editing ? (
                  <Input
                    id="fullName"
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="border-slate-300 dark:border-slate-600 focus:border-blue-500 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-50"
                  />
                ) : (
                  <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-md text-slate-900 dark:text-slate-50">
                    {employee.fullName}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="position" className="text-slate-700 dark:text-slate-300">
                  Position
                </Label>
                {editing ? (
                  <Input
                    id="position"
                    value={editForm.position}
                    onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                    className="border-slate-300 dark:border-slate-600 focus:border-blue-500 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-50"
                  />
                ) : (
                  <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-md text-slate-900 dark:text-slate-50">
                    {employee.position}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">
                  Email Address
                </Label>
                {editing ? (
                  <Input
                    id="email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="border-slate-300 dark:border-slate-600 focus:border-blue-500 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-50"
                  />
                ) : (
                  <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-md text-slate-900 dark:text-slate-50">
                    {employee.email}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactNumber" className="text-slate-700 dark:text-slate-300">
                  Contact Number
                </Label>
                {editing ? (
                  <Input
                    id="contactNumber"
                    value={editForm.contactNumber}
                    onChange={(e) => setEditForm({ ...editForm, contactNumber: e.target.value })}
                    className="border-slate-300 dark:border-slate-600 focus:border-blue-500 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-50"
                    placeholder="Enter contact number"
                  />
                ) : (
                  <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-md text-slate-900 dark:text-slate-50">
                    {employee.contactNumber || "No contact number"}
                  </div>
                )}
              </div>

              {editing && (
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="newPassword" className="text-slate-700 dark:text-slate-300">
                    New Password (leave blank to keep current)
                  </Label>
                  <PasswordInput // Using PasswordInput here
                    id="newPassword"
                    value={editForm.newPassword}
                    onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                    placeholder="Enter new password (min 6 characters)"
                    className="border-slate-300 dark:border-slate-600 focus:border-blue-500 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-50"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Password change requires a server-side function.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Employee ID:</span>
                  <div className="font-mono text-slate-900 dark:text-slate-50 mt-1 text-xs break-all">
                    {employee.uid}
                  </div>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Joined:</span>
                  <div className="text-slate-900 dark:text-slate-50 mt-1">
                    {employee.createdAt?.toDate().toLocaleDateString() || "N/A"}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assigned Tasks Section */}
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mt-8 mb-4">Assigned Tasks</h2>
        {tasksLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-slate-600 dark:text-slate-400">Loading tasks...</div>
          </div>
        ) : assignedTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignedTasks.map((task) => (
              <Card key={task.id} className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-slate-900 dark:text-slate-50 flex items-start justify-between">
                    <span className="flex-1">{task.taskName}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(task.status)}`}>
                      {getStatusText(task.status)}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{task.description}</p>
                  <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                    <Clock className="mr-2 h-4 w-4" />
                    Expires: {task.expiresAt?.toDate().toLocaleDateString() || "N/A"}
                  </div>
                  {task.category && (
                    <div className="mt-3">
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded dark:bg-blue-900 dark:text-blue-200">
                        {task.category}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="mx-auto h-10 w-10 text-slate-400 dark:text-slate-600" />
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              No active tasks assigned to this employee.
            </p>
          </div>
        )}

        {/* Previous Tasks Section */}
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mt-8 mb-4">Previous Tasks</h2>
        {tasksLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-slate-600 dark:text-slate-400">Loading tasks...</div>
          </div>
        ) : previousTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {previousTasks.map((task) => (
              <Card
                key={task.id}
                className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 opacity-75"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-slate-900 dark:text-slate-50 flex items-start justify-between">
                    <span className="flex-1">{task.taskName}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(task.status)}`}>
                      {getStatusText(task.status)}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{task.description}</p>
                  <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                    <Clock className="mr-2 h-4 w-4" />
                    Expired: {task.expiresAt?.toDate().toLocaleDateString() || "N/A"}
                  </div>
                  {task.category && (
                    <div className="mt-3">
                      <span className="inline-block bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded dark:bg-slate-700 dark:text-slate-200">
                        {task.category}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="mx-auto h-10 w-10 text-slate-400 dark:text-slate-600" />
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No previous tasks for this employee.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
