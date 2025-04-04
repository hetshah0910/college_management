"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { User } from "@/types"
import {
  BookOpen,
  Calendar,
  ChevronDown,
  GraduationCap,
  Home,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClientComponentClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface DashboardSidebarProps {
  user: User | null
}

export default function DashboardSidebar({ user }: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const isAdmin = user?.role === "admin"
  const isFaculty = user?.role === "faculty"

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      current: pathname === "/dashboard",
    },
    {
      name: "Courses",
      href: "/dashboard/courses",
      icon: BookOpen,
      current: pathname === "/dashboard/courses",
    },
    {
      name: "Schedule",
      href: "/dashboard/schedule",
      icon: Calendar,
      current: pathname === "/dashboard/schedule",
    },
    {
      name: "Announcements",
      href: "/dashboard/announcements",
      icon: MessageSquare,
      current: pathname === "/dashboard/announcements",
    },
  ]

  // Admin and faculty specific navigation
  const adminNavigation = [
    {
      name: "Users",
      href: "/dashboard/users",
      icon: Users,
      current: pathname === "/dashboard/users",
    },
    {
      name: "Departments",
      href: "/dashboard/departments",
      icon: Home,
      current: pathname === "/dashboard/departments",
    },
  ]

  return (
    <div className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 bg-white border-r">
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex items-center h-16 flex-shrink-0 px-4 border-b">
          <Link href="/" className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">EduManage</span>
          </Link>
        </div>
        <div className="flex-1 flex flex-col overflow-y-auto pt-5 pb-4">
          <nav className="flex-1 px-2 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  item.current ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                  "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                )}
              >
                <item.icon
                  className={cn(
                    item.current ? "text-white" : "text-gray-400 group-hover:text-gray-500",
                    "mr-3 flex-shrink-0 h-5 w-5",
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            ))}

            {(isAdmin || isFaculty) && (
              <>
                <div className="pt-2 pb-1">
                  <div className="px-2 flex items-center">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Administration</span>
                    <ChevronDown className="ml-auto h-4 w-4 text-gray-400" />
                  </div>
                </div>
                {adminNavigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      item.current ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                      "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                    )}
                  >
                    <item.icon
                      className={cn(
                        item.current ? "text-white" : "text-gray-400 group-hover:text-gray-500",
                        "mr-3 flex-shrink-0 h-5 w-5",
                      )}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                ))}
              </>
            )}
          </nav>
        </div>
        <div className="flex-shrink-0 flex border-t p-4">
          <div className="flex-shrink-0 w-full group block">
            <div className="flex items-center">
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                  {user?.full_name || "User"}
                </p>
                <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700">
                  {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || "Role"}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 flex border-t p-4">
          <Button variant="outline" className="w-full justify-start" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>
    </div>
  )
}

