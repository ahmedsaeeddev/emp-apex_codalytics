"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Clock, FileText, CheckCircle } from "lucide-react"
import EmployeeLayout from "@/components/layout/employee-layout"
import { db, type Task } from "@/lib/firebase" // Import db
import { getCurrentUser } from "@/lib/auth"
import { collection, getDocs, query, where, doc, updateDoc, Timestamp } from "firebase/firestore"

export default function EmployeeDashboard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showTaskDialog, setShowTaskDialog] = useState(false)
  const [newStatus, setNewStatus] = useState("")
  const [updatingStatus, setUpdatingStatus] = useState(false)

  // Max allowed status changes (2 times after initial state)
  const MAX_STATUS_CHANGES = 2

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        setTasks([])
        setLoading(false)
        return
      }

      console.log("🔍 Fetching tasks for employee UID:", currentUser.uid)
      const tasksCol = collection(db, "tasks")
      const tasksQuery = query(
        tasksCol,
        where("assignedToUid", "==", currentUser.uid),
        where("expiresAt", ">", Timestamp.now()),
      )
      const taskSnapshot = await getDocs(tasksQuery)
      const tasksList = taskSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[]

      console.log("✅ Tasks fetched:", tasksList.length)
      setTasks(tasksList)
    } catch (error) {
      console.error("💥 Error fetching tasks:", error)
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setNewStatus(task.status)
    setShowTaskDialog(true)
  }

  const handleStatusUpdate = async () => {
    if (!selectedTask || !newStatus) return

    const currentChangeCount = selectedTask.statusChangeCount || 0
    const canUpdate = currentChangeCount < MAX_STATUS_CHANGES

    if (!canUpdate) {
      alert("Status change limit reached for this task.")
      return
    }

    setUpdatingStatus(true)
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        alert("User not logged in.")
        setUpdatingStatus(false)
        return
      }

      const taskDocRef = doc(db, "tasks", selectedTask.id!)
      const updatedChangeCount = currentChangeCount + 1

      await updateDoc(taskDocRef, {
        status: newStatus,
        statusChangeCount: updatedChangeCount,
      })

      console.log("✅ Task status updated in Firestore. New change count:", updatedChangeCount)

      setShowTaskDialog(false)
      fetchTasks() // Refresh tasks
    } catch (error: any) {
      console.error("Error updating task status:", error)
      alert(`Error updating task status: ${error.message}`)
    } finally {
      setUpdatingStatus(false)
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

  const statusOptions = [
    { value: "not_started", label: "Not Started" },
    { value: "50_done", label: "50% Done" },
    { value: "70_done", label: "70% Done" },
    { value: "completed", label: "Completed" },
    { value: "pending", label: "Pending" },
  ]

  if (loading) {
    return (
      <EmployeeLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600">Loading your tasks...</div>
        </div>
      </EmployeeLayout>
    )
  }

  return (
    <EmployeeLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">My Tasks</h1>
          <p className="text-slate-600 mt-1">Click on a task to view details and update status</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => (
            <Card
              key={task.id}
              className="border-slate-200 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleTaskClick(task)}
            >
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
                  <Clock className="mr-2 h-4 w-4" />
                  Expires: {task.expiresAt?.toDate().toLocaleDateString() || "N/A"}
                </div>

                {task.category && (
                  <div className="mt-3">
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      {task.category}
                    </span>
                  </div>
                )}

                {(task.statusChangeCount || 0) >= MAX_STATUS_CHANGES && (
                  <div className="flex items-center text-xs text-green-600 mt-2">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Status change limit reached
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {tasks.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-sm font-medium text-slate-900">No tasks assigned</h3>
            <p className="mt-1 text-sm text-slate-500">Your assigned tasks will appear here.</p>
          </div>
        )}

        {/* Task Details Dialog */}
        <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Task Details</DialogTitle>
            </DialogHeader>
            {selectedTask && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-slate-900">{selectedTask.taskName}</h3>
                  <p className="text-sm text-slate-600 mt-1">{selectedTask.description}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Category:</span>
                    <span className="text-slate-900">{selectedTask.category || "No category"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Expires:</span>
                    <span className="text-slate-900">
                      {selectedTask.expiresAt?.toDate().toLocaleDateString() || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Current Status:</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(selectedTask.status)}`}>
                      {getStatusText(selectedTask.status)}
                    </span>
                  </div>
                </div>

                {(selectedTask.statusChangeCount || 0) < MAX_STATUS_CHANGES ? (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Update Status:</label>
                      <Select value={newStatus} onValueChange={setNewStatus}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-xs text-slate-500">
                      You have {MAX_STATUS_CHANGES - (selectedTask.statusChangeCount || 0)} status changes remaining.
                    </p>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button variant="outline" onClick={() => setShowTaskDialog(false)} disabled={updatingStatus}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleStatusUpdate}
                        disabled={newStatus === selectedTask.status || updatingStatus}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {updatingStatus ? "Updating..." : "Update Status"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <CheckCircle className="mx-auto h-8 w-8 text-green-600 mb-2" />
                    <p className="text-sm text-slate-600">
                      Status change limit reached ({MAX_STATUS_CHANGES} changes). This task's status can no longer be
                      updated.
                    </p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </EmployeeLayout>
  )
}
