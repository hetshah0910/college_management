"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { BookOpen, Calendar, GraduationCap, Home, LogOut, Settings, User, Users } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { supabase } from "@/lib/supabase-client"
import type { UserProfile } from "@/lib/types"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function getUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push("/login")
        return
      }

      const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

      setUser(profile)
      setLoading(false)
    }

    getUser()
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <div className="flex w-full min-h-screen">
        <Sidebar>
          <SidebarHeader className="flex h-14 items-center border-b px-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6" />
              <span className="font-bold">EduManage</span>
            </div>
            <SidebarTrigger className="ml-auto md:hidden" />
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="/dashboard">
                    <Home className="h-4 w-4" />
                    <span>Dashboard</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="/dashboard/students">
                    <Users className="h-4 w-4" />
                    <span>Students</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="/dashboard/courses">
                    <BookOpen className="h-4 w-4" />
                    <span>Courses</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="/dashboard/faculty">
                    <User className="h-4 w-4" />
                    <span>Faculty</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="/dashboard/schedule">
                    <Calendar className="h-4 w-4" />
                    <span>Schedule</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="/dashboard/settings">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="border-t p-4">
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarFallback>
                  {user?.full_name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{user?.full_name}</span>
                <span className="text-xs text-muted-foreground capitalize">{user?.role}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={handleSignOut} className="ml-auto">
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Sign out</span>
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-4 md:p-6">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  )
}

