export type User = {
  id: string
  email: string
  full_name: string | null
  role: "admin" | "faculty" | "student"
  department: string | null
  created_at: string
  updated_at: string
}

export type Department = {
  id: number
  name: string
  description: string | null
  created_at: string
}

export type Course = {
  id: number
  code: string
  title: string
  description: string | null
  credits: number
  department_id: number
  created_at: string
}

export type Enrollment = {
  id: number
  student_id: string
  course_id: number
  enrollment_date: string
  status: "active" | "completed" | "dropped"
  grade: string | null
}

export type Announcement = {
  id: number
  title: string
  content: string
  author_id: string | null
  department_id: number | null
  created_at: string
  updated_at: string
}

