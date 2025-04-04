export interface UserProfile {
  id: string
  full_name?: string
  email?: string
  avatar_url?: string
  role?: "admin" | "faculty" | "student"
  student_id?: string
  department?: string
  created_at?: string
  updated_at?: string
}

export interface Course {
  id: string
  code: string
  title: string
  description?: string
  credits: number
  department?: string
  faculty_id?: string
  status?: "active" | "inactive"
  created_at?: string
  updated_at?: string
}

