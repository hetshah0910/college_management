"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, MessageSquare } from "lucide-react"
import Link from "next/link"

export default function FacultyDashboard({ userId, department }: { userId: string; department: string | null }) {
  const [courses, setCourses] = useState<any[]>([])
  const [students, setStudents] = useState<number>(0)
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!department) {
          setLoading(false)
          return
        }

        // Get department ID
        const { data: departmentData, error: departmentError } = await supabase
          .from("departments")
          .select("id")
          .eq("name", department)
          .single()

        if (departmentError) throw departmentError

        // Fetch department courses
        const { data: coursesData, error: coursesError } = await supabase
          .from("courses")
          .select(`
            *,
            departments:department_id (name),
            enrollments:id (
              count
            )
          `)
          .eq("department_id", departmentData.id)
          .order("code")

        if (coursesError) throw coursesError
        setCourses(coursesData as any[])

        // Count students in department courses
        const { count, error: studentsError } = await supabase
          .from("enrollments")
          .select("student_id", { count: "exact", head: true })
          .eq("status", "active")
          .in(
            "course_id",
            coursesData.map((c) => c.id),
          )

        if (studentsError) throw studentsError
        setStudents(count || 0)

        // Fetch faculty's announcements
        const { data: announcementsData, error: announcementsError } = await supabase
          .from("announcements")
          .select("*")
          .eq("author_id", userId)
          .order("created_at", { ascending: false })
          .limit(5)

        if (announcementsError) throw announcementsError
        setAnnouncements(announcementsData as any[])
      } catch (error) {
        console.error("Error fetching faculty dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase, userId, department])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!department) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Department Not Assigned</h3>
          <p className="text-muted-foreground mb-4">
            You are not assigned to any department yet. Please contact an administrator.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Department Courses</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/courses">View All Courses</Link>
            </Button>
          </div>
          <CardDescription>Courses in the {department} department</CardDescription>
        </CardHeader>
        <CardContent>
          {courses.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <Card key={course.id} className="overflow-hidden">
                  <div className="bg-primary h-2"></div>
                  <CardHeader className="p-4">
                    <CardTitle className="text-base">
                      {course.code}: {course.title}
                    </CardTitle>
                    <CardDescription>
                      {course.credits} credit{course.credits !== 1 ? "s" : ""}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        {course.enrollments?.length > 0 ? `${course.enrollments[0].count} students` : "0 students"}
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/courses/${course.id}`}>View</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No courses found</h3>
              <p className="text-muted-foreground mb-4">There are no courses in your department yet.</p>
              <Button asChild>
                <Link href="/dashboard/courses">View All Courses</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>My Announcements</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/announcements">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {announcements.length > 0 ? (
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{announcement.title}</h3>
                      <span className="text-xs text-muted-foreground">
                        {new Date(announcement.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{announcement.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">You haven't created any announcements yet.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Department Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center justify-center p-4 bg-primary/5 rounded-lg">
                <div className="text-3xl font-bold">{courses.length}</div>
                <div className="text-sm text-muted-foreground">Courses</div>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-primary/5 rounded-lg">
                <div className="text-3xl font-bold">{students}</div>
                <div className="text-sm text-muted-foreground">Students</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

