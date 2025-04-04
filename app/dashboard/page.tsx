"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@/lib/supabase"
import type { User } from "@/types"
import StudentDashboard from "@/components/dashboard/student-dashboard"
import FacultyDashboard from "@/components/dashboard/faculty-dashboard"
import AdminDashboard from "@/components/dashboard/admin-dashboard"

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) return

        // Fetch user data
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single()

        if (userError) throw userError
        setUser(userData as User)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Welcome back, {user?.full_name || "User"}</h2>
      </div>

      {user?.role === "student" && <StudentDashboard userId={user.id} />}
      {user?.role === "faculty" && <FacultyDashboard userId={user.id} department={user.department} />}
      {user?.role === "admin" && <AdminDashboard />}
    </div>
  )
}

