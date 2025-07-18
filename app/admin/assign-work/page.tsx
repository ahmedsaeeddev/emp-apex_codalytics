"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Clock, User, Trash2 } from "lucide-react" // Added Trash2 icon
import AdminLayout from "@/components/layout/admin-layout"
import { db, type Employee, type Task } from "@/lib/firebase" // Import db
import { collection, getDocs, addDoc, query, where, Timestamp, doc, deleteDoc } from "firebase/firestore" // Added doc, deleteDoc
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
} from "@/components/ui/alert-dialog" // Added AlertDialog components

export default function AssignWorkPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [assigningTask, setAssigningTask] = useState(false)
  const [deletingTask, setDeletingTask] = useState(false) // New state for deletion
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null) // State to hold task being deleted
  const [newTask, setNewTask] = useState({
    taskName: "",
    description: "",
    category: "",
    assignedToUid: "",
  })
  const [assignError, setAssignError] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      console.log("🔍 Fetching data for assign work page from Firestore...")

      // Fetch employees
      const employeesCol = collection(db, "employees")
      const employeesQuery = query(employeesCol, where("role", "==", "employee"))
      const employeeSnapshot = await getDocs(employeesQuery)
      const employeesList = employeeSnapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      })) as Employee[]
      setEmployees(employeesList)

      // Fetch active tasks and join with employee data
      const tasksCol = collection(db, "tasks")
      const tasksQuery = query(tasksCol, where("expiresAt", ">", Timestamp.now()))
      const taskSnapshot = await getDocs(tasksQuery)
      const tasksList: Task[] = await Promise.all(
        taskSnapshot.docs.map(async (doc) => {
          const taskData = doc.data() as Omit<Task, "id" | "employee">
          const assignedEmployee = employeesList.find((emp) => emp.uid === taskData.assignedToUid)
          return {
            id: doc.id,
            ...taskData,
            employee: assignedEmployee
              ? { fullName: assignedEmployee.fullName, position: assignedEmployee.position }
              : undefined,
          } as Task
        }),
      )
      setTasks(tasksList)

      console.log("✅ Data fetched: Employees:", employeesList.length, "Tasks:", tasksList.length)
    } catch (error) {
      console.error("💥 Error fetching data:", error)
      setEmployees([])
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault()
    setAssigningTask(true)
    setAssignError("")

    try {
      console.log("➕ Assigning new task:", newTask.taskName)

      const taskData: Omit<Task, "id" | "createdAt" | "expiresAt" | "statusChangeCount"> = {
        taskName: newTask.taskName,
        description: newTask.description || "",
        category: newTask.category || "",
        assignedToUid: newTask.assignedToUid,
        status: "not_started",
      }

      const now = Timestamp.now()
      const expiresAt = Timestamp.fromMillis(now.toMillis() + 24 * 60 * 60 * 1000) // 24 hours from now

      await addDoc(collection(db, "tasks"), {
        ...taskData,
        createdAt: now,
        expiresAt: expiresAt,
        statusChangeCount: 0, // Initialize status change count to 0
      })

      console.log("✅ Task assigned successfully to Firestore")

      // Reset form
      setNewTask({
        taskName: "",
        description: "",
        category: "",
        assignedToUid: "",
      })
      setShowAssignDialog(false)
      fetchData() // Refresh list
    } catch (error: any) {
      console.error("💥 Error assigning task:", error)
      setAssignError(`Error assigning task: ${error.message}`)
    } finally {
      setAssigningTask(false)
    }
  }

  const handleDeleteTask = async () => {
    if (!taskToDelete || !taskToDelete.id) return

    setDeletingTask(true)
    try {
      console.log("🗑️ Deleting task from Firestore:", taskToDelete.id)
      const taskDocRef = doc(db, "tasks", taskToDelete.id)
      await deleteDoc(taskDocRef)
      console.log("✅ Task deleted from Firestore.")

      setTaskToDelete(null) // Clear the task to delete
      fetchData() // Refresh the task list
    } catch (error: any) {
      console.error("💥 Error deleting task:", error)
      alert(`Error deleting task: ${error.message}`)
    } finally {
      setDeletingTask(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "not_started":
        return "bg-slate-100 text-slate-800"
      case "50_done":
        return "bg-yellow-100 text-yellow-800"
      case "70_done":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-red-100 text-red-800"
      default:
        return "bg-slate-100 text-slate-800"
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
          <div className="text-slate-600">Loading...</div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Assign Work</h1>
            <p className="text-slate-600 mt-1">Create and assign tasks to employees</p>
          </div>

          <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Assign New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Assign New Task</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAssignTask} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="taskName">Task Name *</Label>
                  <Input
                    id="taskName"
                    value={newTask.taskName}
                    onChange={(e) => setNewTask({ ...newTask, taskName: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Task Description</Label>
                  <Textarea
                    id="description"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    rows={3}
                    placeholder="Provide a detailed description of the task"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={newTask.category}
                    onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                    placeholder="e.g., Development, Design, Testing"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignedToUid">Assign to Employee *</Label>
                  <Select
                    value={newTask.assignedToUid}
                    onValueChange={(value) => setNewTask({ ...newTask, assignedToUid: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.uid} value={employee.uid}>
                          {employee.fullName} - {employee.position}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {assignError && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{assignError}</div>}

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAssignDialog(false)}
                    disabled={assigningTask}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={assigningTask}>
                    {assigningTask ? "Assigning..." : "Assign Task"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => (
            <Card key={task.id} className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-slate-900 flex items-start justify-between">
                  <span className="flex-1">{task.taskName}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(task.status)}`}>
                    {getStatusText(task.status)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-slate-600 line-clamp-2">{task.description}</p>

                <div className="flex items-center text-sm text-slate-600">
                  <User className="mr-2 h-4 w-4" />
                  {task.employee?.fullName || "N/A"}
                </div>

                <div className="flex items-center text-sm text-slate-600">
                  <Clock className="mr-2 h-4 w-4" />
                  Expires: {task.expiresAt?.toDate().toLocaleDateString() || "N/A"}
                </div>

                {task.category && (
                  <div className="mt-3">
                    <span className="inline-block bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded">
                      {task.category}
                    </span>
                  </div>
                )}
                <div className="pt-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full"
                        onClick={() => setTaskToDelete(task)} // Set task to delete
                        disabled={deletingTask}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Task
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the task{" "}
                          <span className="font-semibold text-slate-900">{taskToDelete?.taskName}</span> and remove it
                          from the system.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setTaskToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteTask} disabled={deletingTask}>
                          {deletingTask ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {tasks.length === 0 && (
          <div className="text-center py-12">
            <Clock className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-sm font-medium text-slate-900">No active tasks</h3>
            <p className="mt-1 text-sm text-slate-500">Get started by assigning your first task.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
