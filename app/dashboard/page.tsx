"use client"

import { useEffect, useState } from "react"
import { BookOpen, GraduationCap, Users } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase-client"

export default function DashboardPage() {
  const [stats, setStats] = useState({
    students: 0,
    courses: 0,
    faculty: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      setLoading(true)

      // Get student count
      const { count: studentCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "student")

      // Get course count
      const { count: courseCount } = await supabase.from("courses").select("*", { count: "exact", head: true })

      // Get faculty count
      const { count: facultyCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "faculty")

      setStats({
        students: studentCount || 0,
        courses: courseCount || 0,
        faculty: facultyCount || 0,
      })

      setLoading(false)
    }

    fetchStats()
  }, [])

  return (
    <div className="space-y-6 ">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your college management system</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <div className="h-8 w-16 animate-pulse rounded bg-muted"></div> : stats.students}
            </div>
            <p className="text-xs text-muted-foreground">Enrolled students</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <div className="h-8 w-16 animate-pulse rounded bg-muted"></div> : stats.courses}
            </div>
            <p className="text-xs text-muted-foreground">Available courses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faculty Members</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <div className="h-8 w-16 animate-pulse rounded bg-muted"></div> : stats.faculty}
            </div>
            <p className="text-xs text-muted-foreground">Teaching staff</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest activities in your college</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-muted"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-[250px] rounded bg-muted"></div>
                      <div className="h-4 w-[200px] rounded bg-muted"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border p-4">
                <div className="flex justify-center items-center h-40 text-muted-foreground">
                  No recent activities to display
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Schedule for the next few days</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-[200px] rounded bg-muted"></div>
                    <div className="h-4 w-[150px] rounded bg-muted"></div>
                    <div className="h-px w-full bg-muted my-2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border p-4">
                <div className="flex justify-center items-center h-40 text-muted-foreground">No upcoming events</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

