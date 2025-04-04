"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen } from "lucide-react"
import Link from "next/link"

export default function StudentDashboard({ userId }: { userId: string }) {
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch student's enrollments with course details
        const { data: enrollmentsData, error: enrollmentsError } = await supabase
          .from("enrollments")
          .select(`
            *,
            courses:course_id (
              id,
              code,
              title,
              credits,
              departments:department_id (name)
            )
          `)
          .eq("student_id", userId)
          .eq("status", "active")
          .order("enrollment_date", { ascending: false })

        if (enrollmentsError) throw enrollmentsError
        setEnrollments(enrollmentsData as any[])
      } catch (error) {
        console.error("Error fetching student dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase, userId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>My Courses</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/courses">Browse All Courses</Link>
            </Button>
          </div>
          <CardDescription>Courses you are currently enrolled in</CardDescription>
        </CardHeader>
        <CardContent>
          {enrollments.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {enrollments.map((enrollment) => (
                <Card key={enrollment.id} className="overflow-hidden">
                  <div className="bg-primary h-2"></div>
                  <CardHeader className="p-4">
                    <CardTitle className="text-base">
                      {enrollment.courses.code}: {enrollment.courses.title}
                    </CardTitle>
                    <CardDescription>
                      {enrollment.courses.departments?.name} • {enrollment.courses.credits} credit
                      {enrollment.courses.credits !== 1 ? "s" : ""}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        Enrolled: {new Date(enrollment.enrollment_date).toLocaleDateString()}
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/courses/${enrollment.course_id}`}>View</Link>
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
              <p className="text-muted-foreground mb-4">You are not enrolled in any courses yet.</p>
              <Button asChild>
                <Link href="/dashboard/courses">Browse Courses</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Academic Progress</CardTitle>
          <CardDescription>Your academic journey at a glance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col items-center justify-center p-4 bg-primary/5 rounded-lg">
              <div className="text-3xl font-bold">{enrollments.length}</div>
              <div className="text-sm text-muted-foreground">Active Courses</div>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-primary/5 rounded-lg">
              <div className="text-3xl font-bold">
                {enrollments.reduce((total, enrollment) => total + (enrollment.courses?.credits || 0), 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Credits</div>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-primary/5 rounded-lg">
              <div className="text-3xl font-bold">-</div>
              <div className="text-sm text-muted-foreground">GPA</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

