"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClientComponentClient } from "@/lib/supabase"
import type { Course, User, Enrollment } from "@/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ArrowLeft, MoreHorizontal, Plus, Trash, UserPlus, Users } from "lucide-react"
import Link from "next/link"

export default function CourseDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string

  const [course, setCourse] = useState<Course | null>(null)
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [availableStudents, setAvailableStudents] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false)
  const [isUnenrollDialogOpen, setIsUnenrollDialogOpen] = useState(false)
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  const [newEnrollment, setNewEnrollment] = useState({
    student_id: "",
    status: "active",
  })

  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get user session and role
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session) return

        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id, role")
          .eq("id", session.user.id)
          .single()

        if (userError) throw userError
        setUserRole(userData.role)
        setUserId(userData.id)

        // Fetch course details
        const { data: courseData, error: courseError } = await supabase
          .from("courses")
          .select(`
            *,
            departments(name)
          `)
          .eq("id", courseId)
          .single()

        if (courseError) {
          console.error("Error fetching course:", courseError)
          router.push("/dashboard/courses")
          return
        }

        setCourse(courseData as any)

        // Fetch enrollments
        const { data: enrollmentsData, error: enrollmentsError } = await supabase
          .from("enrollments")
          .select(`
            *,
            users:student_id (id, full_name, email)
          `)
          .eq("course_id", courseId)
          .order("enrollment_date", { ascending: false })

        if (enrollmentsError) throw enrollmentsError
        setEnrollments(enrollmentsData as any[])

        // If admin or faculty, fetch available students (not enrolled in this course)
        if (userData.role === "admin" || userData.role === "faculty") {
          // Get all students
          const { data: studentsData, error: studentsError } = await supabase
            .from("users")
            .select("*")
            .eq("role", "student")
            .order("full_name")

          if (studentsError) throw studentsError

          // Filter out already enrolled students
          const enrolledStudentIds = enrollmentsData.map((e) => e.student_id)
          const availableStudents = studentsData.filter((s) => !enrolledStudentIds.includes(s.id))

          setAvailableStudents(availableStudents as User[])
        }
      } catch (error) {
        console.error("Error fetching course data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase, courseId, router])

  const handleEnrollStudent = async () => {
    try {
      setFormError(null)

      // Validate form
      if (!newEnrollment.student_id) {
        setFormError("Please select a student")
        return
      }

      // Add enrollment
      const { error: insertError } = await supabase.from("enrollments").insert({
        student_id: newEnrollment.student_id,
        course_id: Number.parseInt(courseId),
        status: newEnrollment.status,
      })

      if (insertError) {
        setFormError(insertError.message)
        return
      }

      // Refresh enrollments list
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from("enrollments")
        .select(`
          *,
          users:student_id (id, full_name, email)
        `)
        .eq("course_id", courseId)
        .order("enrollment_date", { ascending: false })

      if (enrollmentsError) throw enrollmentsError
      setEnrollments(enrollmentsData as any[])

      // Update available students
      setAvailableStudents((prev) => prev.filter((s) => s.id !== newEnrollment.student_id))

      // Reset form and close dialog
      setNewEnrollment({
        student_id: "",
        status: "active",
      })

      setFormSuccess("Student enrolled successfully")
      setTimeout(() => {
        setFormSuccess(null)
        setIsEnrollDialogOpen(false)
      }, 2000)
    } catch (error: any) {
      console.error("Error enrolling student:", error)
      setFormError(error.message || "An error occurred")
    }
  }

  const handleUnenrollStudent = async () => {
    try {
      if (!selectedEnrollment) return

      // Delete enrollment
      const { error: deleteError } = await supabase.from("enrollments").delete().eq("id", selectedEnrollment.id)

      if (deleteError) {
        console.error("Error unenrolling student:", deleteError)
        return
      }

      // Refresh enrollments list
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from("enrollments")
        .select(`
          *,
          users:student_id (id, full_name, email)
        `)
        .eq("course_id", courseId)
        .order("enrollment_date", { ascending: false })

      if (enrollmentsError) throw enrollmentsError
      setEnrollments(enrollmentsData as any[])

      // Update available students
      if (selectedEnrollment.users) {
        setAvailableStudents((prev) => [...prev, selectedEnrollment.users])
      }

      setIsUnenrollDialogOpen(false)
    } catch (error) {
      console.error("Error unenrolling student:", error)
    }
  }

  const handleSelfEnroll = async () => {
    try {
      if (!userId) return

      // Add enrollment
      const { error: insertError } = await supabase.from("enrollments").insert({
        student_id: userId,
        course_id: Number.parseInt(courseId),
        status: "active",
      })

      if (insertError) {
        console.error("Error self-enrolling:", insertError)
        return
      }

      // Refresh page
      window.location.reload()
    } catch (error) {
      console.error("Error self-enrolling:", error)
    }
  }

  const isEnrolled = userId && enrollments.some((e) => e.student_id === userId)
  const canManageEnrollments = userRole === "admin" || userRole === "faculty"

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-2xl font-bold mb-2">Course Not Found</div>
        <p className="text-muted-foreground mb-4">
          The course you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <Button asChild>
          <Link href="/dashboard/courses">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Courses
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/courses">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              {course.code}: {course.title}
            </h2>
            <p className="text-muted-foreground">
              {course.departments?.name} • {course.credits} credit{course.credits !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        {userRole === "student" && !isEnrolled && (
          <Button onClick={handleSelfEnroll}>
            <UserPlus className="mr-2 h-4 w-4" />
            Enroll in Course
          </Button>
        )}
        {canManageEnrollments && (
          <Dialog open={isEnrollDialogOpen} onOpenChange={setIsEnrollDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Enroll Student
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Enroll Student</DialogTitle>
                <DialogDescription>Add a student to this course.</DialogDescription>
              </DialogHeader>
              {formError && (
                <Alert variant="destructive">
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}
              {formSuccess && (
                <Alert className="bg-green-50 text-green-800 border-green-200">
                  <AlertDescription>{formSuccess}</AlertDescription>
                </Alert>
              )}
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="student">Student</Label>
                  <Select
                    value={newEnrollment.student_id}
                    onValueChange={(value) => setNewEnrollment({ ...newEnrollment, student_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a student" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStudents.length > 0 ? (
                        availableStudents.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.full_name || student.email}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          No available students
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={newEnrollment.status}
                    onValueChange={(value) => setNewEnrollment({ ...newEnrollment, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="dropped">Dropped</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEnrollDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEnrollStudent}>Enroll Student</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Course Details</CardTitle>
          <CardDescription>Information about this course</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
              <p className="mt-1">{course.description || "No description available."}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Course Code</h3>
                <p className="mt-1">{course.code}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Department</h3>
                <p className="mt-1">{course.departments?.name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Credits</h3>
                <p className="mt-1">{course.credits}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Enrollments</CardTitle>
          <CardDescription>Students enrolled in this course</CardDescription>
        </CardHeader>
        <CardContent>
          {enrollments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Enrollment Date</TableHead>
                  <TableHead>Grade</TableHead>
                  {canManageEnrollments && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell className="font-medium">{enrollment.users?.full_name || "N/A"}</TableCell>
                    <TableCell>{enrollment.users?.email}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          enrollment.status === "active"
                            ? "bg-green-100 text-green-800"
                            : enrollment.status === "completed"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {enrollment.status.charAt(0).toUpperCase() + enrollment.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell>{new Date(enrollment.enrollment_date).toLocaleDateString()}</TableCell>
                    <TableCell>{enrollment.grade || "N/A"}</TableCell>
                    {canManageEnrollments && (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedEnrollment(enrollment)
                                setIsUnenrollDialogOpen(true)
                              }}
                              className="text-red-600"
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Unenroll
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No students enrolled</h3>
              <p className="text-muted-foreground mb-4">There are no students enrolled in this course yet.</p>
              {canManageEnrollments && (
                <Button onClick={() => setIsEnrollDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Enroll Student
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unenroll Student Confirmation */}
      <AlertDialog open={isUnenrollDialogOpen} onOpenChange={setIsUnenrollDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the student from this course and delete their enrollment record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnenrollStudent} className="bg-red-600 hover:bg-red-700">
              Unenroll
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

