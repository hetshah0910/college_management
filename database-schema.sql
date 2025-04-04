-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT UNIQUE,
  avatar_url TEXT,
  role TEXT DEFAULT 'student',
  student_id TEXT,
  department TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create courses table
CREATE TABLE courses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  credits INTEGER NOT NULL,
  department TEXT,
  faculty_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create enrollments table
CREATE TABLE enrollments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  status TEXT DEFAULT 'active',
  grade TEXT,
  UNIQUE(student_id, course_id)
);

-- Create faculty_assignments table
CREATE TABLE faculty_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  faculty_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  assignment_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  status TEXT DEFAULT 'active',
  UNIQUE(faculty_id, course_id)
);

-- Create schedule table
CREATE TABLE schedule (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room TEXT,
  semester TEXT,
  year INTEGER
);

-- Set up Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Profiles: Users can read all profiles but only update their own
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Courses: Everyone can view courses, only admins can modify
CREATE POLICY "Courses are viewable by everyone" ON courses
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert courses" ON courses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can update courses" ON courses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Enrollments: Students can see their own enrollments, faculty can see enrollments for their courses
CREATE POLICY "Students can view their own enrollments" ON enrollments
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Faculty can view enrollments for their courses" ON enrollments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM faculty_assignments
      WHERE faculty_assignments.faculty_id = auth.uid()
      AND faculty_assignments.course_id = enrollments.course_id
    )
  );

-- Create functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_courses_updated_at
BEFORE UPDATE ON courses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

