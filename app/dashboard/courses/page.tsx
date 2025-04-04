"use client"

import { useEffect, useState } from "react"
import { PlusCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { supabase } from "@/lib/supabase-client"
import type { Course } from "@/lib/types"

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    async function fetchCourses() {
      setLoading(true)

      const { data, error } = await supabase.from("courses").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching courses:", error)
      } else {
        setCourses(data || [])
      }

      setLoading(false)
    }

    fetchCourses()
  }, [])

  const filteredCourses = courses.filter(
    (course) =>
      course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.code?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Courses</h1>
          <p className="text-muted-foreground">Manage course offerings and curriculum</p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Course
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Course Catalog</CardTitle>
          <CardDescription>View and manage all courses offered by your institution</CardDescription>
          <div className="mt-4">
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course Code</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchQuery
                        ? "No courses found matching your search"
                        : "No courses found. Add one to get started."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCourses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell className="font-medium">{course.code}</TableCell>
                      <TableCell>{course.title}</TableCell>
                      <TableCell>{course.credits}</TableCell>
                      <TableCell>{course.department}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

