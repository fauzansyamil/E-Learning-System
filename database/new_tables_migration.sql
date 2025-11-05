-- ============================================
-- LMS MODERNIZATION - NEW TABLES MIGRATION
-- Version: 1.0
-- Date: 2025-11-04
-- Description: Additional tables for Moodle/Classroom parity
-- ============================================

USE elearning_db;

-- ============================================
-- 1. COURSE CATEGORIES
-- ============================================
CREATE TABLE IF NOT EXISTS course_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id INT NULL COMMENT 'For nested categories',
    display_order INT DEFAULT 0,
    icon VARCHAR(50) COMMENT 'Icon name or emoji',
    color VARCHAR(20) COMMENT 'Category color code',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES course_categories(id) ON DELETE SET NULL,
    INDEX idx_parent (parent_id),
    INDEX idx_active (is_active)
) ENGINE=InnoDB COMMENT='Course categories for organization';

-- Add category to classes table
ALTER TABLE classes
ADD COLUMN IF NOT EXISTS category_id INT NULL COMMENT 'Course category' AFTER instructor_id,
ADD FOREIGN KEY (category_id) REFERENCES course_categories(id) ON DELETE SET NULL;

-- ============================================
-- 2. ENROLLMENT SYSTEM ENHANCEMENTS
-- ============================================

-- Enrollment requests table
CREATE TABLE IF NOT EXISTS enrollment_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    student_id INT NOT NULL,
    enrollment_key VARCHAR(50) COMMENT 'Optional enrollment key provided',
    message TEXT COMMENT 'Student message to instructor',
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_by INT NULL,
    reviewed_at TIMESTAMP NULL,
    review_notes TEXT COMMENT 'Instructor notes',
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_pending_request (class_id, student_id, status),
    INDEX idx_status (status),
    INDEX idx_class (class_id)
) ENGINE=InnoDB COMMENT='Self-enrollment requests with approval';

-- Add enrollment settings to classes
ALTER TABLE classes
ADD COLUMN IF NOT EXISTS enrollment_key VARCHAR(50) NULL COMMENT 'Key for self-enrollment' AFTER syllabus_file,
ADD COLUMN IF NOT EXISTS self_enrollment BOOLEAN DEFAULT TRUE COMMENT 'Allow self-enrollment' AFTER enrollment_key,
ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT FALSE COMMENT 'Require instructor approval' AFTER self_enrollment,
ADD COLUMN IF NOT EXISTS max_enrollments INT NULL COMMENT 'Maximum students (NULL = unlimited)' AFTER requires_approval;

-- ============================================
-- 3. ACTIVITY LOGS (User activity tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS activity_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    class_id INT NULL,
    activity_type VARCHAR(50) NOT NULL COMMENT 'view, create, update, delete, submit, etc',
    entity_type VARCHAR(50) NOT NULL COMMENT 'material, assignment, quiz, discussion, etc',
    entity_id INT NULL COMMENT 'ID of the entity',
    description TEXT,
    metadata JSON COMMENT 'Additional data in JSON format',
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_class (class_id),
    INDEX idx_activity (activity_type),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB COMMENT='Comprehensive user activity tracking';

-- ============================================
-- 4. COURSE PROGRESS TRACKING
-- ============================================
CREATE TABLE IF NOT EXISTS course_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    student_id INT NOT NULL,
    module_id INT NULL,
    material_id INT NULL,
    assignment_id INT NULL,
    quiz_id INT NULL,
    status ENUM('not_started', 'in_progress', 'completed') DEFAULT 'not_started',
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    time_spent_minutes INT DEFAULT 0,
    last_accessed TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
    INDEX idx_student (student_id),
    INDEX idx_class (class_id),
    INDEX idx_status (status)
) ENGINE=InnoDB COMMENT='Track student progress in courses';

-- ============================================
-- 5. MESSAGING SYSTEM
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    recipient_id INT NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message_text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    is_starred BOOLEAN DEFAULT FALSE,
    parent_message_id INT NULL COMMENT 'For message threading',
    attachment_url VARCHAR(500) NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    deleted_by_sender BOOLEAN DEFAULT FALSE,
    deleted_by_recipient BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_message_id) REFERENCES messages(id) ON DELETE CASCADE,
    INDEX idx_sender (sender_id),
    INDEX idx_recipient (recipient_id),
    INDEX idx_read (recipient_id, is_read),
    INDEX idx_thread (parent_message_id)
) ENGINE=InnoDB COMMENT='Private messaging between users';

-- ============================================
-- 6. BADGES & GAMIFICATION
-- ============================================
CREATE TABLE IF NOT EXISTS badges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon_url VARCHAR(255) COMMENT 'Badge icon image',
    criteria TEXT NOT NULL COMMENT 'How to earn this badge',
    badge_type ENUM('course', 'system', 'achievement') DEFAULT 'achievement',
    points INT DEFAULT 0,
    class_id INT NULL COMMENT 'NULL means system-wide badge',
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_class (class_id),
    INDEX idx_type (badge_type)
) ENGINE=InnoDB COMMENT='Badges for gamification';

CREATE TABLE IF NOT EXISTS user_badges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    badge_id INT NOT NULL,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    awarded_by INT NULL COMMENT 'Manual awards',
    reason TEXT COMMENT 'Why badge was awarded',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
    FOREIGN KEY (awarded_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_user_badge (user_id, badge_id),
    INDEX idx_user (user_id),
    INDEX idx_earned (earned_at)
) ENGINE=InnoDB COMMENT='Badges earned by users';

-- ============================================
-- 7. CERTIFICATES
-- ============================================
CREATE TABLE IF NOT EXISTS certificates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    student_id INT NOT NULL,
    certificate_number VARCHAR(50) UNIQUE NOT NULL,
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    final_grade DECIMAL(5,2),
    letter_grade CHAR(2),
    certificate_file VARCHAR(255) COMMENT 'Generated PDF path',
    template_used VARCHAR(100),
    is_valid BOOLEAN DEFAULT TRUE,
    revoked_at TIMESTAMP NULL,
    revoked_by INT NULL,
    revoke_reason TEXT,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (revoked_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_certificate (class_id, student_id),
    INDEX idx_student (student_id),
    INDEX idx_number (certificate_number)
) ENGINE=InnoDB COMMENT='Course completion certificates';

-- ============================================
-- 8. RUBRICS (Grading rubrics)
-- ============================================
CREATE TABLE IF NOT EXISTS rubrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    class_id INT NOT NULL,
    total_points DECIMAL(5,2) DEFAULT 100,
    created_by INT NOT NULL,
    is_template BOOLEAN DEFAULT FALSE COMMENT 'Reusable template',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_class (class_id)
) ENGINE=InnoDB COMMENT='Grading rubrics for assessments';

CREATE TABLE IF NOT EXISTS rubric_criteria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rubric_id INT NOT NULL,
    criterion_name VARCHAR(255) NOT NULL,
    description TEXT,
    max_points DECIMAL(5,2) NOT NULL,
    display_order INT DEFAULT 0,
    FOREIGN KEY (rubric_id) REFERENCES rubrics(id) ON DELETE CASCADE,
    INDEX idx_rubric (rubric_id)
) ENGINE=InnoDB COMMENT='Individual criteria in rubrics';

-- Add rubric support to assignments and submissions
ALTER TABLE assignments
ADD COLUMN IF NOT EXISTS rubric_id INT NULL COMMENT 'Associated grading rubric' AFTER max_score,
ADD FOREIGN KEY (rubric_id) REFERENCES rubrics(id) ON DELETE SET NULL;

ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS feedback TEXT COMMENT 'Instructor feedback' AFTER file_url,
ADD COLUMN IF NOT EXISTS graded_at TIMESTAMP NULL COMMENT 'When grading was completed' AFTER feedback,
ADD COLUMN IF NOT EXISTS score DECIMAL(5,2) NULL COMMENT 'Score received' AFTER graded_at;

-- ============================================
-- 9. FILE STORAGE (Enhanced file tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS file_storage (
    id INT AUTO_INCREMENT PRIMARY KEY,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL COMMENT 'Size in bytes',
    mime_type VARCHAR(100),
    file_extension VARCHAR(10),
    uploaded_by INT NOT NULL,
    entity_type VARCHAR(50) COMMENT 'assignment, material, submission, profile, etc',
    entity_id INT,
    checksum VARCHAR(64) COMMENT 'SHA256 hash for integrity',
    is_public BOOLEAN DEFAULT FALSE,
    download_count INT DEFAULT 0,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_uploader (uploaded_by),
    INDEX idx_checksum (checksum)
) ENGINE=InnoDB COMMENT='Centralized file storage tracking';

-- ============================================
-- 10. LEARNING PATHS (Course sequences)
-- ============================================
CREATE TABLE IF NOT EXISTS learning_paths (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by INT NOT NULL,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Structured learning paths';

CREATE TABLE IF NOT EXISTS learning_path_courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    path_id INT NOT NULL,
    class_id INT NOT NULL,
    sequence_order INT NOT NULL,
    is_required BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (path_id) REFERENCES learning_paths(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    UNIQUE KEY unique_path_course (path_id, class_id),
    INDEX idx_path (path_id),
    INDEX idx_order (path_id, sequence_order)
) ENGINE=InnoDB COMMENT='Courses in learning paths';

-- ============================================
-- 11. SYSTEM SETTINGS
-- ============================================
CREATE TABLE IF NOT EXISTS system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE COMMENT 'Visible to non-admin',
    updated_by INT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='System-wide settings';

-- Insert default settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('site_name', 'E-Learning LMS', 'string', 'Name of the LMS platform', TRUE),
('site_description', 'Modern Learning Management System', 'string', 'Site description', TRUE),
('default_language', 'en', 'string', 'Default system language', TRUE),
('allow_self_registration', 'true', 'boolean', 'Allow users to register', FALSE),
('default_role', 'mahasiswa', 'string', 'Default role for new users', FALSE),
('max_file_upload_size', '52428800', 'number', 'Max upload size in bytes (50MB)', FALSE),
('session_timeout', '3600', 'number', 'Session timeout in seconds', FALSE),
('enable_gamification', 'true', 'boolean', 'Enable badges and points', FALSE),
('grade_scale', 'A,B,C,D,F', 'string', 'Grade letter scale', FALSE)
ON DUPLICATE KEY UPDATE setting_key = setting_key;

-- ============================================
-- 12. ENHANCE EXISTING TABLES
-- ============================================

-- Add more fields to class_enrollments
ALTER TABLE class_enrollments
ADD COLUMN IF NOT EXISTS attendance_percentage DECIMAL(5,2) DEFAULT 0 AFTER status,
ADD COLUMN IF NOT EXISTS last_accessed TIMESTAMP NULL AFTER attendance_percentage,
ADD COLUMN IF NOT EXISTS completion_percentage DECIMAL(5,2) DEFAULT 0 AFTER last_accessed;

-- Add more fields to discussions
ALTER TABLE discussions
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE AFTER content,
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE AFTER is_pinned,
ADD COLUMN IF NOT EXISTS views_count INT DEFAULT 0 AFTER is_locked;

-- Add indexes for better performance
CREATE INDEX idx_created ON discussions(created_at DESC);
CREATE INDEX idx_pinned ON discussions(is_pinned, created_at DESC);

-- ============================================
-- SAMPLE DATA FOR TESTING
-- ============================================

-- Sample categories
INSERT INTO course_categories (name, description, display_order, color) VALUES
('Computer Science', 'Courses related to computer science and programming', 1, '#3B82F6'),
('Mathematics', 'Mathematics and statistics courses', 2, '#10B981'),
('Engineering', 'Engineering courses', 3, '#F59E0B'),
('Business', 'Business and management courses', 4, '#8B5CF6'),
('Design', 'Design and creative courses', 5, '#EC4899')
ON DUPLICATE KEY UPDATE name = name;

-- Sample badges
INSERT INTO badges (name, description, criteria, badge_type, points, created_by) VALUES
('First Login', 'Awarded for logging in for the first time', 'Login to the system', 'system', 10, 1),
('Assignment Master', 'Complete 10 assignments', 'Submit 10 assignments', 'achievement', 100, 1),
('Discussion Participant', 'Participate in 5 discussions', 'Post in 5 discussions', 'achievement', 50, 1),
('Perfect Score', 'Get 100% on an assignment', 'Score 100% on any assignment', 'achievement', 200, 1),
('Early Bird', 'Submit assignment before deadline', 'Submit 5 days before deadline', 'achievement', 50, 1)
ON DUPLICATE KEY UPDATE name = name;

-- Sample system messages for new users
INSERT INTO messages (sender_id, recipient_id, subject, message_text)
SELECT 1, u.id,
       'Welcome to E-Learning LMS!',
       'Welcome to our Learning Management System! We are excited to have you here. Please explore the courses and features available.'
FROM users u
WHERE u.id > 1
AND NOT EXISTS (
    SELECT 1 FROM messages m
    WHERE m.sender_id = 1
    AND m.recipient_id = u.id
    AND m.subject = 'Welcome to E-Learning LMS!'
)
LIMIT 10;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Uncomment to verify tables were created:
-- SELECT TABLE_NAME, TABLE_COMMENT
-- FROM INFORMATION_SCHEMA.TABLES
-- WHERE TABLE_SCHEMA = 'elearning_db'
-- AND TABLE_NAME IN (
--     'course_categories', 'enrollment_requests', 'activity_logs',
--     'course_progress', 'messages', 'badges', 'user_badges',
--     'certificates', 'rubrics', 'file_storage', 'learning_paths'
-- );

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Tables created: 12 new tables
-- Tables enhanced: 4 existing tables
-- Status: Ready for use
