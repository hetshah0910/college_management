"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, GraduationCap, MessageSquare, Users } from "lucide-react"
import Link from "next/link"

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    students: 0,
    faculty: 0,
    courses: 0,
    departments: 0,
    announcements: 0,
  })
  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Count users by role
        const { count: totalUsers, error: usersError } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true })

        if (usersError) throw usersError

        const { count: studentCount, error: studentsError } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .eq("role", "student")

        if (studentsError) throw studentsError

        const { count: facultyCount, error: facultyError } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .eq("role", "faculty")

        if (facultyError) throw facultyError

        // Count courses
        const { count: coursesCount, error: coursesError } = await supabase
          .from("courses")
          .select("*", { count: "exact", head: true })

        if (coursesError) throw coursesError

        // Count departments
        const { count: departmentsCount, error: departmentsError } = await supabase
          .from("departments")
          .select("*", { count: "exact", head: true })

        if (departmentsError) throw departmentsError

        // Count announcements
        const { count: announcementsCount, error: announcementsError } = await supabase
          .from("announcements")
          .select("*", { count: "exact", head: true })

        if (announcementsError) throw announcementsError

        setStats({
          users: totalUsers || 0,
          students: studentCount || 0,
          faculty: facultyCount || 0,
          courses: coursesCount || 0,
          departments: departmentsCount || 0,
          announcements: announcementsCount || 0,
        })

        // Get recent users
        const { data: recentUsersData, error: recentUsersError } = await supabase
          .from("users")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5)

        if (recentUsersError) throw recentUsersError
        setRecentUsers(recentUsersData)
      } catch (error) {
        console.error("Error fetching admin dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users}</div>
            <p className="text-xs text-muted-foreground">
              {stats.students} students, {stats.faculty} faculty
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.courses}</div>
            <p className="text-xs text-muted-foreground">Across {stats.departments} departments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.departments}</div>
            <p className="text-xs text-muted-foreground">Academic departments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Announcements</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.announcements}</div>
            <p className="text-xs text-muted-foreground">Published announcements</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Users</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/users">View All</Link>
              </Button>
            </div>
            <CardDescription>Recently registered users</CardDescription>
          </CardHeader>
          <CardContent>
            {recentUsers.length > 0 ? (
              <div className="space-y-4">
                {recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{user.full_name || "Unnamed User"}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-primary/10 text-primary">
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Users className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No users found</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Quick Actions</CardTitle>
            </div>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <Button asChild className="h-auto py-4 justify-start">
                <Link href="/dashboard/users">
                  <Users className="mr-2 h-5 w-5" />
                  <div className="flex flex-col items-start">
                    <span>Manage Users</span>
                    <span className="text-xs font-normal text-muted-foreground">Add, edit, or remove users</span>
                  </div>
                </Link>
              </Button>
              <Button asChild className="h-auto py-4 justify-start">
                <Link href="/dashboard/courses">
                  <BookOpen className="mr-2 h-5 w-5" />
                  <div className="flex flex-col items-start">
                    <span>Manage Courses</span>
                    <span className="text-xs font-normal text-muted-foreground">Create or edit courses</span>
                  </div>
                </Link>
              </Button>
              <Button asChild className="h-auto py-4 justify-start">
                <Link href="/dashboard/departments">
                  <GraduationCap className="mr-2 h-5 w-5" />
                  <div className="flex flex-col items-start">
                    <span>Manage Departments</span>
                    <span className="text-xs font-normal text-muted-foreground">Add or edit departments</span>
                  </div>
                </Link>
              </Button>
              <Button asChild className="h-auto py-4 justify-start">
                <Link href="/dashboard/announcements">
                  <MessageSquare className="mr-2 h-5 w-5" />
                  <div className="flex flex-col items-start">
                    <span>Announcements</span>
                    <span className="text-xs font-normal text-muted-foreground">Create new announcements</span>
                  </div>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

