"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@/lib/supabase"
import type { Announcement, Department, User } from "@/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { MessageSquare, Plus, Search } from "lucide-react"

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [user, setUser] = useState<User | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    content: "",
    department_id: null as number | null,
  })

  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get user session
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

        // Fetch departments
        const { data: departmentsData, error: departmentsError } = await supabase
          .from("departments")
          .select("*")
          .order("name")

        if (departmentsError) throw departmentsError
        setDepartments(departmentsData as Department[])

        // Fetch announcements with author and department info
        const { data: announcementsData, error: announcementsError } = await supabase
          .from("announcements")
          .select(`
            *,
            users:author_id (full_name),
            departments:department_id (name)
          `)
          .order("created_at", { ascending: false })

        if (announcementsError) throw announcementsError
        setAnnouncements(announcementsData as any[])
      } catch (error) {
        console.error("Error fetching announcements data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  const handleCreateAnnouncement = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) return

      const { data, error } = await supabase
        .from("announcements")
        .insert([
          {
            title: newAnnouncement.title,
            content: newAnnouncement.content,
            author_id: session.user.id,
            department_id: newAnnouncement.department_id,
          },
        ])
        .select()

      if (error) throw error

      // Refresh announcements list
      const { data: announcementsData, error: announcementsError } = await supabase
        .from("announcements")
        .select(`
          *,
          users:author_id (full_name),
          departments:department_id (name)
        `)
        .order("created_at", { ascending: false })

      if (announcementsError) throw announcementsError
      setAnnouncements(announcementsData as any[])

      // Reset form and close dialog
      setNewAnnouncement({
        title: "",
        content: "",
        department_id: null,
      })
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error creating announcement:", error)
    }
  }

  const filteredAnnouncements = announcements.filter(
    (announcement) =>
      announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      announcement.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (announcement.departments?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (announcement.users?.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const canCreateAnnouncement = user?.role === "admin" || user?.role === "faculty"

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
          <h2 className="text-3xl font-bold tracking-tight">Announcements</h2>
          <p className="text-muted-foreground">View important announcements from your institution</p>
        </div>
        {canCreateAnnouncement && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Announcement
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Announcement</DialogTitle>
                <DialogDescription>Create a new announcement for students and faculty.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Announcement title"
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department (Optional)</Label>
                  <Select
                    value={newAnnouncement.department_id?.toString() || ""}
                    onValueChange={(value) =>
                      setNewAnnouncement({
                        ...newAnnouncement,
                        department_id: value ? Number.parseInt(value) : null,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All departments</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    placeholder="Announcement content..."
                    className="min-h-[150px]"
                    value={newAnnouncement.content}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateAnnouncement}>Publish</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
            <CardTitle>All Announcements</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search announcements..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <CardDescription>
            {filteredAnnouncements.length} announcement{filteredAnnouncements.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAnnouncements.length > 0 ? (
            <div className="space-y-6">
              {filteredAnnouncements.map((announcement) => (
                <div key={announcement.id} className="border rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">{announcement.title}</h3>
                    <div className="text-sm text-muted-foreground">
                      {new Date(announcement.created_at).toLocaleDateString()} by{" "}
                      {announcement.users?.full_name || "Unknown"}
                    </div>
                  </div>
                  {announcement.departments && (
                    <div className="mb-2">
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                        {announcement.departments.name}
                      </span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-line">{announcement.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No announcements found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? `No announcements match "${searchQuery}"`
                  : "There are no announcements in the system yet."}
              </p>
              {canCreateAnnouncement && !searchQuery && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create your first announcement
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

