"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@/lib/supabase"
import type { Department } from "@/types"
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
import { Textarea } from "@/components/ui/textarea"
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
import { Edit, GraduationCap, MoreHorizontal, Plus, Search, Trash } from "lucide-react"

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)

  const [newDepartment, setNewDepartment] = useState({
    name: "",
    description: "",
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

        // Only admins should access this page
        if (userData.role !== "admin") {
          window.location.href = "/dashboard"
          return
        }

        // Fetch departments
        const { data: departmentsData, error: departmentsError } = await supabase
          .from("departments")
          .select("*")
          .order("name")

        if (departmentsError) throw departmentsError
        setDepartments(departmentsData as Department[])
      } catch (error) {
        console.error("Error fetching departments data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  const handleAddDepartment = async () => {
    try {
      setFormError(null)

      // Validate form
      if (!newDepartment.name) {
        setFormError("Department name is required")
        return
      }

      // Add department
      const { error: insertError } = await supabase.from("departments").insert({
        name: newDepartment.name,
        description: newDepartment.description,
      })

      if (insertError) {
        setFormError(insertError.message)
        return
      }

      // Refresh departments list
      const { data: departmentsData, error: departmentsError } = await supabase
        .from("departments")
        .select("*")
        .order("name")

      if (departmentsError) throw departmentsError
      setDepartments(departmentsData as Department[])

      // Reset form and close dialog
      setNewDepartment({
        name: "",
        description: "",
      })

      setFormSuccess("Department created successfully")
      setTimeout(() => {
        setFormSuccess(null)
        setIsAddDialogOpen(false)
      }, 2000)
    } catch (error: any) {
      console.error("Error creating department:", error)
      setFormError(error.message || "An error occurred")
    }
  }

  const handleEditDepartment = async () => {
    try {
      setFormError(null)

      if (!selectedDepartment) return

      // Update department
      const { error: updateError } = await supabase
        .from("departments")
        .update({
          name: selectedDepartment.name,
          description: selectedDepartment.description,
        })
        .eq("id", selectedDepartment.id)

      if (updateError) {
        setFormError(updateError.message)
        return
      }

      // Refresh departments list
      const { data: departmentsData, error: departmentsError } = await supabase
        .from("departments")
        .select("*")
        .order("name")

      if (departmentsError) throw departmentsError
      setDepartments(departmentsData as Department[])

      setFormSuccess("Department updated successfully")
      setTimeout(() => {
        setFormSuccess(null)
        setIsEditDialogOpen(false)
      }, 2000)
    } catch (error: any) {
      console.error("Error updating department:", error)
      setFormError(error.message || "An error occurred")
    }
  }

  const handleDeleteDepartment = async () => {
    try {
      if (!selectedDepartment) return

      // Delete department
      const { error: deleteError } = await supabase.from("departments").delete().eq("id", selectedDepartment.id)

      if (deleteError) {
        console.error("Error deleting department:", deleteError)
        return
      }

      // Refresh departments list
      const { data: departmentsData, error: departmentsError } = await supabase
        .from("departments")
        .select("*")
        .order("name")

      if (departmentsError) throw departmentsError
      setDepartments(departmentsData as Department[])

      setIsDeleteDialogOpen(false)
    } catch (error) {
      console.error("Error deleting department:", error)
    }
  }

  const filteredDepartments = departments.filter(
    (department) =>
      department.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (department.description || "").toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  // If not admin, don't show the page
  if (userRole !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-2xl font-bold mb-2">Access Denied</div>
        <p className="text-muted-foreground">You don't have permission to view this page.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Departments</h2>
          <p className="text-muted-foreground">Manage academic departments in your institution</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Department
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Department</DialogTitle>
              <DialogDescription>Create a new academic department for your institution.</DialogDescription>
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
                <Label htmlFor="name">Department Name</Label>
                <Input
                  id="name"
                  placeholder="Computer Science"
                  value={newDepartment.name}
                  onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Department of Computer Science and Engineering..."
                  value={newDepartment.description}
                  onChange={(e) => setNewDepartment({ ...newDepartment, description: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddDepartment}>Create Department</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
            <CardTitle>All Departments</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search departments..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <CardDescription>
            {filteredDepartments.length} department{filteredDepartments.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredDepartments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDepartments.map((department) => (
                  <TableRow key={department.id}>
                    <TableCell className="font-medium">{department.name}</TableCell>
                    <TableCell>{department.description || "N/A"}</TableCell>
                    <TableCell>{new Date(department.created_at).toLocaleDateString()}</TableCell>
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
                              setSelectedDepartment(department)
                              setIsEditDialogOpen(true)
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedDepartment(department)
                              setIsDeleteDialogOpen(true)
                            }}
                            className="text-red-600"
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No departments found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? `No departments match "${searchQuery}"` : "There are no departments in the system yet."}
              </p>
              {!searchQuery && (
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add your first department
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Department Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
            <DialogDescription>Update department information.</DialogDescription>
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
          {selectedDepartment && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Department Name</Label>
                <Input
                  id="edit-name"
                  value={selectedDepartment.name}
                  onChange={(e) => setSelectedDepartment({ ...selectedDepartment, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={selectedDepartment.description || ""}
                  onChange={(e) => setSelectedDepartment({ ...selectedDepartment, description: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditDepartment}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Department Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the department and all associated courses and
              enrollments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDepartment} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

