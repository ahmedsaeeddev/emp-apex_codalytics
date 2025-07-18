"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, User, Archive } from "lucide-react"
import AdminLayout from "@/components/layout/admin-layout"
import { db, type Task, type Employee } from "@/lib/firebase" // Import db
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore"

export default function PreviousTasksPage() {
  const [expiredTasks, setExpiredTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchExpiredTasks()
  }, [])

  const fetchExpiredTasks = async () => {
    setLoading(true)
    try {
      console.log("🔍 Fetching expired tasks from Firestore...")

      // Fetch all employees first to join with tasks
      const employeesCol = collection(db, "employees")
      const employeeSnapshot = await getDocs(employeesCol)
      const employeesMap = new Map<string, Employee>()
      employeeSnapshot.docs.forEach((doc) => {
        employeesMap.set(doc.id, { uid: doc.id, ...doc.data() } as Employee)
      })

      // Fetch expired tasks
      const tasksCol = collection(db, "tasks")
      const tasksQuery = query(tasksCol, where("expiresAt", "<=", Timestamp.now()))
      const taskSnapshot = await getDocs(tasksQuery)

      const tasksList: Task[] = taskSnapshot.docs.map((doc) => {
        const taskData = doc.data() as Omit<Task, "id" | "employee">
        const assignedEmployee = employeesMap.get(taskData.assignedToUid)
        return {
          id: doc.id,
          ...taskData,
          employee: assignedEmployee
            ? { fullName: assignedEmployee.fullName, position: assignedEmployee.position }
            : undefined,
        } as Task
      })

      console.log("✅ Expired tasks fetched:", tasksList.length)
      setExpiredTasks(tasksList)
    } catch (error) {
      console.error("💥 Error fetching expired tasks:", error)
      setExpiredTasks([])
    } finally {
      setLoading(false)
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
          <div className="text-slate-600">Loading previous tasks...</div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Previous Tasks</h1>
          <p className="text-slate-600 mt-1">Tasks that have expired (24+ hours old)</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {expiredTasks.map((task) => (
            <Card key={task.id} className="border-slate-200 opacity-75">
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
                  Expired: {task.expiresAt?.toDate().toLocaleDateString() || "N/A"}
                </div>

                {task.category && (
                  <div className="mt-3">
                    <span className="inline-block bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded">
                      {task.category}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {expiredTasks.length === 0 && (
          <div className="text-center py-12">
            <Archive className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-sm font-medium text-slate-900">No previous tasks</h3>
            <p className="mt-1 text-sm text-slate-500">Expired tasks will appear here after 24 hours.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
