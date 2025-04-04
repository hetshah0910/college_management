"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@/lib/supabase"
import type { Course, Department } from "@/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BookOpen, Plus, Search } from "lucide-react"
import Link from "next/link"

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  const [newCourse, setNewCourse] = useState({
    code: "",
    title: "",
    description: "",
    credits: 3,
    department_id: 0,
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
          .select("role")
          .eq("id", session.user.id)
          .single()

        if (userError) throw userError
        setUserRole(userData.role)

        // Fetch departments
        const { data: departmentsData, error: departmentsError } = await supabase
          .from("departments")
          .select("*")
          .order("name")

        if (departmentsError) throw departmentsError
        setDepartments(departmentsData as Department[])

        // Fetch courses
        const coursesQuery = supabase
          .from("courses")
          .select(`
            *,
            departments(name)
          `)
          .order("code")

        const { data: coursesData, error: coursesError } = await coursesQuery

        if (coursesError) throw coursesError
        setCourses(coursesData as any[])
      } catch (error) {
        console.error("Error fetching courses data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  const handleCreateCourse = async () => {
    try {
      setFormError(null)

      // Validate form
      if (!newCourse.code || !newCourse.title || !newCourse.department_id) {
        setFormError("Please fill in all required fields")
        return
      }

      const { data, error } = await supabase
        .from("courses")
        .insert([
          {
            code: newCourse.code,
            title: newCourse.title,
            description: newCourse.description,
            credits: newCourse.credits,
            department_id: newCourse.department_id,
          },
        ])
        .select()

      if (error) {
        setFormError(error.message)
        return
      }

      // Refresh courses list
      const { data: coursesData, error: coursesError } = await supabase
        .from("courses")
        .select(`
          *,
          departments(name)
        `)
        .order("code")

      if (coursesError) throw coursesError
      setCourses(coursesData as any[])

      // Reset form and close dialog
      setNewCourse({
        code: "",
        title: "",
        description: "",
        credits: 3,
        department_id: 0,
      })

      setFormSuccess("Course created successfully")
      setTimeout(() => {
        setFormSuccess(null)
        setIsDialogOpen(false)
      }, 2000)
    } catch (error: any) {
      console.error("Error creating course:", error)
      setFormError(error.message || "An error occurred")
    }
  }

  const filteredCourses = courses.filter(
    (course) =>
      course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (course.departments?.name || "").toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Courses</h2>
          <p className="text-muted-foreground">Browse and manage courses</p>
        </div>
        {(userRole === "admin" || userRole === "faculty") && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Course
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Course</DialogTitle>
                <DialogDescription>Create a new course in the system. Click save when you're done.</DialogDescription>
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="course-code">Course Code</Label>
                    <Input
                      id="course-code"
                      placeholder="CS101"
                      value={newCourse.code}
                      onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="credits">Credits</Label>
                    <Input
                      id="credits"
                      type="number"
                      min="1"
                      max="6"
                      value={newCourse.credits}
                      onChange={(e) => setNewCourse({ ...newCourse, credits: Number.parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Course Title</Label>
                  <Input
                    id="title"
                    placeholder="Introduction to Computer Science"
                    value={newCourse.title}
                    onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select
                    value={newCourse.department_id.toString()}
                    onValueChange={(value) => setNewCourse({ ...newCourse, department_id: Number.parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Course description..."
                    value={newCourse.description}
                    onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCourse}>Save Course</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
            <CardTitle>All Courses</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <CardDescription>
            {filteredCourses.length} course{filteredCourses.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCourses.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">{course.code}</TableCell>
                    <TableCell>{course.title}</TableCell>
                    <TableCell>{course.departments?.name}</TableCell>
                    <TableCell>{course.credits}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/courses/${course.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No courses found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? `No courses match "${searchQuery}"` : "There are no courses in the system yet."}
              </p>
              {(userRole === "admin" || userRole === "faculty") && !searchQuery && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add your first course
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

