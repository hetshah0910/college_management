import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    // Create a Supabase client with the service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Create tables
    await supabase.query(`
      -- Create users table with extended profile information
      CREATE TABLE IF NOT EXISTS users (
        id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        full_name TEXT,
        role TEXT CHECK (role IN ('admin', 'faculty', 'student')) NOT NULL DEFAULT 'student',
        department TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      -- Create departments table
      CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      -- Create courses table
      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        description TEXT,
        credits INTEGER NOT NULL,
        department_id INTEGER REFERENCES departments(id) ON DELETE CASCADE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      -- Create enrollments table to track student course enrollments
      CREATE TABLE IF NOT EXISTS enrollments (
        id SERIAL PRIMARY KEY,
        student_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
        enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        status TEXT CHECK (status IN ('active', 'completed', 'dropped')) DEFAULT 'active',
        grade TEXT,
        UNIQUE(student_id, course_id)
      );

      -- Create announcements table
      CREATE TABLE IF NOT EXISTS announcements (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        author_id UUID REFERENCES users(id) ON DELETE SET NULL,
        department_id INTEGER REFERENCES departments(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `)

    // Enable RLS
    await supabase.query(`
      -- Enable RLS
      ALTER TABLE users ENABLE ROW LEVEL SECURITY;
      ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
      ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
      ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
      ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
    `)

    // Create policies
    await supabase.query(`
      -- Users policies
      CREATE POLICY IF NOT EXISTS "Users can view their own profile" 
      ON users FOR SELECT 
      USING (auth.uid() = id);

      CREATE POLICY IF NOT EXISTS "Admin can view all user profiles" 
      ON users FOR SELECT 
      USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

      CREATE POLICY IF NOT EXISTS "Admin can update all user profiles" 
      ON users FOR UPDATE 
      USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

      -- Departments policies
      CREATE POLICY IF NOT EXISTS "Anyone can view departments" 
      ON departments FOR SELECT 
      USING (true);

      CREATE POLICY IF NOT EXISTS "Admin can manage departments" 
      ON departments FOR ALL 
      USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

      -- Courses policies
      CREATE POLICY IF NOT EXISTS "Anyone can view courses" 
      ON courses FOR SELECT 
      USING (true);

      CREATE POLICY IF NOT EXISTS "Admin can manage courses" 
      ON courses FOR ALL 
      USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

      -- Enrollments policies
      CREATE POLICY IF NOT EXISTS "Students can view their own enrollments" 
      ON enrollments FOR SELECT 
      USING (auth.uid() = student_id);

      CREATE POLICY IF NOT EXISTS "Faculty can view enrollments for their department" 
      ON enrollments FOR SELECT 
      USING (EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'faculty' 
        AND department IN (
          SELECT d.name FROM departments d 
          JOIN courses c ON d.id = c.department_id 
          WHERE c.id = enrollments.course_id
        )
      ));

      CREATE POLICY IF NOT EXISTS "Admin can manage all enrollments" 
      ON enrollments FOR ALL 
      USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

      -- Announcements policies
      CREATE POLICY IF NOT EXISTS "Anyone can view announcements" 
      ON announcements FOR SELECT 
      USING (true);

      CREATE POLICY IF NOT EXISTS "Faculty and admin can create announcements" 
      ON announcements FOR INSERT 
      WITH CHECK (EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'faculty')
      ));

      CREATE POLICY IF NOT EXISTS "Authors can update their announcements" 
      ON announcements FOR UPDATE 
      USING (auth.uid() = author_id);

      CREATE POLICY IF NOT EXISTS "Admin can manage all announcements" 
      ON announcements FOR ALL 
      USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
    `)

    // Insert sample data
    await supabase.query(`
      -- Insert sample departments
      INSERT INTO departments (name, description)
      VALUES 
        ('Computer Science', 'Department of Computer Science and Engineering'),
        ('Mathematics', 'Department of Mathematics and Statistics'),
        ('Physics', 'Department of Physics and Astronomy'),
        ('Business', 'School of Business and Management')
      ON CONFLICT (name) DO NOTHING;
    `)

    return NextResponse.json({
      success: true,
      message: "Database setup completed successfully",
    })
  } catch (error: any) {
    console.error("Error setting up database:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}

