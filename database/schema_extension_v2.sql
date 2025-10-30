-- ============================================
-- DATABASE SCHEMA EXTENSION FOR LMS FEATURES
-- Version: 2.0
-- Date: 2025-10-30
-- Description: Add new tables for comprehensive LMS functionality
-- ============================================

USE elearning_db;

-- ============================================
-- TABLE: courses (Extended mata kuliah info)
-- ============================================
-- Note: We already have 'classes' table, but this adds more detailed course info
-- You can either extend classes table or create separate courses table
-- For now, let's add missing columns to classes table

ALTER TABLE classes
ADD COLUMN IF NOT EXISTS prerequisites VARCHAR(255) COMMENT 'Prerequisite courses (comma-separated IDs)' AFTER semester,
ADD COLUMN IF NOT EXISTS learning_outcomes TEXT COMMENT 'Course learning outcomes' AFTER prerequisites,
ADD COLUMN IF NOT EXISTS syllabus_file VARCHAR(500) COMMENT 'Syllabus PDF file path' AFTER learning_outcomes,
ADD COLUMN IF NOT EXISTS max_students INT DEFAULT 40 COMMENT 'Maximum number of students' AFTER syllabus_file,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE COMMENT 'Course active status' AFTER max_students;

-- ============================================
-- TABLE: modules (Materi Pembelajaran)
-- ============================================
-- Enhanced version of materials with better structure
CREATE TABLE IF NOT EXISTS modules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content LONGTEXT COMMENT 'HTML content of the module',
    module_order INT DEFAULT 0 COMMENT 'Display order',
    duration_minutes INT COMMENT 'Estimated time to complete',
    is_published BOOLEAN DEFAULT FALSE,
    created_by INT NOT NULL COMMENT 'Instructor user ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_class (class_id),
    INDEX idx_order (module_order)
) ENGINE=InnoDB COMMENT='Learning modules for each class';

-- ============================================
-- TABLE: module_resources (Files for modules)
-- ============================================
CREATE TABLE IF NOT EXISTS module_resources (
    id INT AUTO_INCREMENT PRIMARY KEY,
    module_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    file_type ENUM('pdf', 'video', 'doc', 'ppt', 'link', 'other') NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size BIGINT COMMENT 'File size in bytes',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
    INDEX idx_module (module_id)
) ENGINE=InnoDB COMMENT='Resources attached to modules';

-- ============================================
-- TABLE: schedules (Jadwal Perkuliahan)
-- ============================================
CREATE TABLE IF NOT EXISTS schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room VARCHAR(100),
    building VARCHAR(100),
    session_type ENUM('lecture', 'lab', 'tutorial', 'exam') DEFAULT 'lecture',
    is_recurring BOOLEAN DEFAULT TRUE COMMENT 'Weekly recurring or one-time',
    specific_date DATE COMMENT 'For non-recurring sessions',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    INDEX idx_class (class_id),
    INDEX idx_day (day_of_week)
) ENGINE=InnoDB COMMENT='Class schedules';

-- ============================================
-- TABLE: announcements (Pengumuman)
-- ============================================
CREATE TABLE IF NOT EXISTS announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    class_id INT COMMENT 'NULL means announcement for all users',
    created_by INT NOT NULL,
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    is_published BOOLEAN DEFAULT TRUE,
    published_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL COMMENT 'Optional expiry date',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_class (class_id),
    INDEX idx_priority (priority),
    INDEX idx_published (is_published, published_at)
) ENGINE=InnoDB COMMENT='Announcements for classes or entire system';

-- ============================================
-- TABLE: permissions (Enhanced Role Permissions)
-- ============================================
CREATE TABLE IF NOT EXISTS permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE COMMENT 'e.g., create_assignment, grade_students',
    description TEXT,
    category VARCHAR(50) COMMENT 'e.g., assignments, grades, users',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='Available permissions in the system';

-- ============================================
-- TABLE: role_permissions (Role-Permission mapping)
-- ============================================
CREATE TABLE IF NOT EXISTS role_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_role_permission (role_id, permission_id)
) ENGINE=InnoDB COMMENT='Maps permissions to roles';

-- ============================================
-- TABLE: grade_components (Grade calculation components)
-- ============================================
CREATE TABLE IF NOT EXISTS grade_components (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    name VARCHAR(100) NOT NULL COMMENT 'e.g., Quiz, Midterm, Final, Assignment',
    weight DECIMAL(5,2) NOT NULL COMMENT 'Weight in percentage (0-100)',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    INDEX idx_class (class_id)
) ENGINE=InnoDB COMMENT='Components that make up final grade';

-- ============================================
-- TABLE: component_grades (Individual component scores)
-- ============================================
CREATE TABLE IF NOT EXISTS component_grades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    component_id INT NOT NULL,
    student_id INT NOT NULL,
    score DECIMAL(5,2) NOT NULL COMMENT 'Score out of 100',
    max_score DECIMAL(5,2) DEFAULT 100,
    notes TEXT COMMENT 'Grader notes',
    graded_by INT COMMENT 'Instructor who gave the grade',
    graded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (component_id) REFERENCES grade_components(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (graded_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_student_component (student_id, component_id),
    INDEX idx_student (student_id),
    INDEX idx_component (component_id)
) ENGINE=InnoDB COMMENT='Scores for each grade component';

-- ============================================
-- TABLE: final_grades (Calculated final grades)
-- ============================================
CREATE TABLE IF NOT EXISTS final_grades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    student_id INT NOT NULL,
    numeric_grade DECIMAL(5,2) COMMENT 'Calculated grade 0-100',
    letter_grade CHAR(2) COMMENT 'A, A-, B+, B, etc.',
    grade_points DECIMAL(3,2) COMMENT 'GPA points (0.00-4.00)',
    is_published BOOLEAN DEFAULT FALSE COMMENT 'Visible to student',
    published_at TIMESTAMP NULL,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_class (student_id, class_id),
    INDEX idx_student (student_id),
    INDEX idx_class (class_id)
) ENGINE=InnoDB COMMENT='Final calculated grades for students';

-- ============================================
-- TABLE: attendance (Track class attendance)
-- ============================================
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    student_id INT NOT NULL,
    schedule_id INT COMMENT 'Reference to specific schedule session',
    attendance_date DATE NOT NULL,
    status ENUM('present', 'absent', 'late', 'excused') NOT NULL,
    notes TEXT,
    recorded_by INT NOT NULL COMMENT 'Who recorded attendance',
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE SET NULL,
    FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_class_date (class_id, attendance_date),
    INDEX idx_student (student_id)
) ENGINE=InnoDB COMMENT='Student attendance records';

-- ============================================
-- TABLE: quiz (Quizzes/Tests)
-- ============================================
CREATE TABLE IF NOT EXISTS quizzes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INT COMMENT 'Time limit for quiz',
    passing_score DECIMAL(5,2) DEFAULT 60 COMMENT 'Minimum score to pass',
    max_attempts INT DEFAULT 1 COMMENT 'Number of attempts allowed',
    is_published BOOLEAN DEFAULT FALSE,
    available_from TIMESTAMP NULL,
    available_until TIMESTAMP NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_class (class_id),
    INDEX idx_published (is_published)
) ENGINE=InnoDB COMMENT='Quizzes for classes';

-- ============================================
-- TABLE: quiz_questions
-- ============================================
CREATE TABLE IF NOT EXISTS quiz_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    question_text TEXT NOT NULL,
    question_type ENUM('multiple_choice', 'true_false', 'short_answer', 'essay') NOT NULL,
    points DECIMAL(5,2) DEFAULT 1,
    correct_answer TEXT COMMENT 'Correct answer (for auto-grading)',
    question_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    INDEX idx_quiz (quiz_id)
) ENGINE=InnoDB COMMENT='Questions in quizzes';

-- ============================================
-- TABLE: quiz_options (For multiple choice)
-- ============================================
CREATE TABLE IF NOT EXISTS quiz_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    option_order INT DEFAULT 0,
    FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE,
    INDEX idx_question (question_id)
) ENGINE=InnoDB COMMENT='Answer options for multiple choice questions';

-- ============================================
-- TABLE: quiz_attempts
-- ============================================
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    student_id INT NOT NULL,
    attempt_number INT NOT NULL,
    score DECIMAL(5,2),
    max_score DECIMAL(5,2),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP NULL,
    time_taken_minutes INT,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_quiz_student (quiz_id, student_id)
) ENGINE=InnoDB COMMENT='Student quiz attempts';

-- ============================================
-- INSERT DEFAULT PERMISSIONS
-- ============================================
INSERT IGNORE INTO permissions (name, description, category) VALUES
-- User management
('create_users', 'Create new users', 'users'),
('edit_users', 'Edit user information', 'users'),
('delete_users', 'Delete users', 'users'),
('view_all_users', 'View all users in system', 'users'),

-- Class management
('create_classes', 'Create new classes', 'classes'),
('edit_classes', 'Edit class information', 'classes'),
('delete_classes', 'Delete classes', 'classes'),
('view_all_classes', 'View all classes', 'classes'),
('enroll_students', 'Enroll students in classes', 'classes'),

-- Assignment management
('create_assignments', 'Create assignments', 'assignments'),
('edit_assignments', 'Edit assignments', 'assignments'),
('delete_assignments', 'Delete assignments', 'assignments'),
('grade_assignments', 'Grade student assignments', 'assignments'),
('submit_assignments', 'Submit assignments', 'assignments'),

-- Grade management
('create_grades', 'Create grade components', 'grades'),
('edit_grades', 'Edit grades', 'grades'),
('view_all_grades', 'View all student grades', 'grades'),
('publish_grades', 'Publish grades to students', 'grades'),

-- Content management
('create_modules', 'Create learning modules', 'content'),
('edit_modules', 'Edit modules', 'content'),
('delete_modules', 'Delete modules', 'content'),
('publish_modules', 'Publish modules to students', 'content'),

-- Announcements
('create_announcements', 'Create announcements', 'announcements'),
('edit_announcements', 'Edit announcements', 'announcements'),
('delete_announcements', 'Delete announcements', 'announcements'),

-- Discussions
('create_discussions', 'Create discussion topics', 'discussions'),
('moderate_discussions', 'Moderate discussions', 'discussions'),
('delete_discussions', 'Delete discussions', 'discussions');

-- ============================================
-- ASSIGN PERMISSIONS TO ROLES
-- ============================================
-- Admin gets all permissions
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin';

-- Dosen permissions
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'dosen'
AND p.name IN (
    'view_all_users', 'edit_classes', 'create_assignments', 'edit_assignments',
    'delete_assignments', 'grade_assignments', 'create_grades', 'edit_grades',
    'view_all_grades', 'publish_grades', 'create_modules', 'edit_modules',
    'delete_modules', 'publish_modules', 'create_announcements', 'edit_announcements',
    'create_discussions', 'moderate_discussions'
);

-- Mahasiswa permissions
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'mahasiswa'
AND p.name IN (
    'submit_assignments', 'create_discussions'
);

-- ============================================
-- ADD SAMPLE DATA (Optional - for testing)
-- ============================================

-- Sample grade components for a class (adjust class_id as needed)
-- INSERT INTO grade_components (class_id, name, weight, description) VALUES
-- (1, 'Assignments', 30.00, 'All homework assignments'),
-- (1, 'Quizzes', 20.00, 'Weekly quizzes'),
-- (1, 'Midterm Exam', 20.00, 'Midterm examination'),
-- (1, 'Final Exam', 30.00, 'Final examination');

-- Sample announcement
-- INSERT INTO announcements (title, content, class_id, created_by, priority) VALUES
-- ('Welcome to the Course', 'Welcome to our E-Learning platform! Please check the syllabus and schedule.', 1, 3, 'high');

-- Sample schedule
-- INSERT INTO schedules (class_id, day_of_week, start_time, end_time, room, session_type) VALUES
-- (1, 'Monday', '09:00:00', '11:00:00', 'Lab 201', 'lab'),
-- (1, 'Wednesday', '13:00:00', '15:00:00', 'Room 301', 'lecture');

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify the schema extension:
-- SELECT COUNT(*) as total_modules FROM modules;
-- SELECT COUNT(*) as total_schedules FROM schedules;
-- SELECT COUNT(*) as total_announcements FROM announcements;
-- SELECT COUNT(*) as total_permissions FROM permissions;
-- SELECT COUNT(*) as total_grade_components FROM grade_components;
-- SELECT r.name as role, COUNT(rp.id) as permission_count
-- FROM roles r
-- LEFT JOIN role_permissions rp ON r.id = rp.role_id
-- GROUP BY r.name;

-- ============================================
-- SCHEMA EXTENSION COMPLETE
-- ============================================
