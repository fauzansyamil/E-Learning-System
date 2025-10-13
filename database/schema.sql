-- ============================================
-- DATABASE CREATION
-- ============================================
CREATE DATABASE IF NOT EXISTS elearning_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE elearning_db;

-- ============================================
-- TABLE: roles
-- Menyimpan role pengguna (Admin, Dosen, Mahasiswa)
-- ============================================
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================
-- TABLE: users
-- Menyimpan data pengguna sistem
-- ============================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role_id INT NOT NULL,
    profile_picture VARCHAR(255),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_role (role_id)
) ENGINE=InnoDB;

-- ============================================
-- TABLE: classes
-- Menyimpan data mata kuliah/kelas
-- ============================================
CREATE TABLE classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    instructor_id INT NOT NULL,
    semester VARCHAR(20) NOT NULL,
    year INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_instructor (instructor_id),
    INDEX idx_semester_year (semester, year)
) ENGINE=InnoDB;

-- ============================================
-- TABLE: class_enrollments
-- Relasi many-to-many antara students dan classes
-- ============================================
CREATE TABLE class_enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    student_id INT NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'dropped', 'completed') DEFAULT 'active',
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_enrollment (class_id, student_id),
    INDEX idx_class (class_id),
    INDEX idx_student (student_id)
) ENGINE=InnoDB;

-- ============================================
-- TABLE: materials
-- Menyimpan materi pembelajaran
-- ============================================
CREATE TABLE materials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    created_by INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    type ENUM('document', 'video', 'link', 'text') NOT NULL,
    file_url VARCHAR(500),
    order_number INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_class (class_id),
    INDEX idx_order (class_id, order_number)
) ENGINE=InnoDB;

-- ============================================
-- TABLE: assignments
-- Menyimpan data tugas
-- ============================================
CREATE TABLE assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    created_by INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    deadline TIMESTAMP NOT NULL,
    max_score INT DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_class (class_id),
    INDEX idx_deadline (deadline)
) ENGINE=InnoDB;

-- ============================================
-- TABLE: submissions
-- Menyimpan pengumpulan tugas mahasiswa
-- ============================================
CREATE TABLE submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assignment_id INT NOT NULL,
    student_id INT NOT NULL,
    content TEXT,
    file_url VARCHAR(500),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('submitted', 'late', 'graded') DEFAULT 'submitted',
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_submission (assignment_id, student_id),
    INDEX idx_assignment (assignment_id),
    INDEX idx_student (student_id),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- ============================================
-- TABLE: grades
-- Menyimpan nilai tugas
-- ============================================
CREATE TABLE grades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    submission_id INT NOT NULL UNIQUE,
    graded_by INT NOT NULL,
    score DECIMAL(5,2) NOT NULL,
    feedback TEXT,
    graded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
    FOREIGN KEY (graded_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_submission (submission_id)
) ENGINE=InnoDB;

-- ============================================
-- TABLE: discussions
-- Menyimpan topik diskusi di forum kelas
-- ============================================
CREATE TABLE discussions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    created_by INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_class (class_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- ============================================
-- TABLE: discussion_replies
-- Menyimpan balasan/reply pada diskusi
-- ============================================
CREATE TABLE discussion_replies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    discussion_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (discussion_id) REFERENCES discussions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_discussion (discussion_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- ============================================
-- TABLE: notifications
-- Menyimpan notifikasi untuk pengguna
-- ============================================
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('assignment', 'grade', 'announcement', 'discussion', 'material') NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    link VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_read (user_id, is_read),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- ============================================
-- SAMPLE DATA / DUMMY DATA
-- ============================================

-- Insert Roles
INSERT INTO roles (name, description) VALUES
('admin', 'Administrator dengan akses penuh ke sistem'),
('dosen', 'Pengajar yang dapat mengelola kelas dan materi'),
('mahasiswa', 'Peserta yang mengikuti pembelajaran');

-- Insert Users (password: "password123" - hashed dengan bcrypt)
INSERT INTO users (username, email, password_hash, full_name, role_id, phone) VALUES
('admin', 'admin@elearning.com', '$2b$10$YourHashedPasswordHere', 'Administrator System', 1, '081234567890'),
('dosen1', 'dosen1@elearning.com', '$2b$10$YourHashedPasswordHere', 'Dr. Budi Santoso', 2, '081234567891'),
('dosen2', 'dosen2@elearning.com', '$2b$10$YourHashedPasswordHere', 'Prof. Siti Nurhaliza', 2, '081234567892'),
('mhs001', 'mahasiswa1@elearning.com', '$2b$10$YourHashedPasswordHere', 'Ahmad Rizki', 3, '081234567893'),
('mhs002', 'mahasiswa2@elearning.com', '$2b$10$YourHashedPasswordHere', 'Dewi Lestari', 3, '081234567894'),
('mhs003', 'mahasiswa3@elearning.com', '$2b$10$YourHashedPasswordHere', 'Eko Prasetyo', 3, '081234567895');

-- Insert Classes
INSERT INTO classes (code, name, description, instructor_id, semester, year) VALUES
('IF101', 'Sistem Manajemen Basis Data', 'Mata kuliah tentang perancangan dan implementasi database', 2, 'Ganjil', 2024),
('IF102', 'Pemrograman Web', 'Pembelajaran pengembangan aplikasi web modern', 2, 'Ganjil', 2024),
('IF201', 'Algoritma dan Struktur Data', 'Fundamental algoritma dan struktur data', 3, 'Genap', 2024);

-- Insert Enrollments
INSERT INTO class_enrollments (class_id, student_id, status) VALUES
(1, 4, 'active'),
(1, 5, 'active'),
(1, 6, 'active'),
(2, 4, 'active'),
(2, 5, 'active'),
(3, 6, 'active');

-- Insert Materials
INSERT INTO materials (class_id, created_by, title, description, type, file_url, order_number) VALUES
(1, 2, 'Pengenalan Database', 'Materi perkenalan konsep database relasional', 'document', '/uploads/materials/db_intro.pdf', 1),
(1, 2, 'Video Tutorial SQL', 'Tutorial lengkap SQL untuk pemula', 'video', 'https://youtube.com/watch?v=example', 2),
(2, 2, 'HTML & CSS Basics', 'Fundamental HTML dan CSS', 'document', '/uploads/materials/html_css.pdf', 1);

-- Insert Assignments
INSERT INTO assignments (class_id, created_by, title, description, deadline, max_score) VALUES
(1, 2, 'Tugas 1: Perancangan ERD', 'Buatlah ERD untuk sistem perpustakaan', '2024-12-31 23:59:59', 100),
(1, 2, 'Tugas 2: Implementasi SQL', 'Implementasikan ERD ke dalam SQL', '2025-01-15 23:59:59', 100),
(2, 2, 'Project Website Portofolio', 'Buat website portofolio pribadi', '2025-01-20 23:59:59', 100);

-- Insert Submissions
INSERT INTO submissions (assignment_id, student_id, content, file_url, status) VALUES
(1, 4, 'ERD perpustakaan dengan 5 entitas utama', '/uploads/submissions/erd_ahmad.pdf', 'graded'),
(1, 5, 'ERD sistem perpustakaan lengkap', '/uploads/submissions/erd_dewi.pdf', 'submitted');

-- Insert Grades
INSERT INTO grades (submission_id, graded_by, score, feedback) VALUES
(1, 2, 85.00, 'Bagus, namun relasi antara anggota dan buku perlu diperbaiki');

-- Insert Discussions
INSERT INTO discussions (class_id, created_by, title, content) VALUES
(1, 4, 'Perbedaan SQL dan NoSQL', 'Apa perbedaan mendasar antara SQL dan NoSQL database?'),
(1, 5, 'Normalisasi Database', 'Bisakah dijelaskan tentang 1NF, 2NF, dan 3NF?');

-- Insert Discussion Replies
INSERT INTO discussion_replies (discussion_id, user_id, content) VALUES
(1, 2, 'SQL menggunakan skema terstruktur, sedangkan NoSQL lebih fleksibel...'),
(1, 6, 'Terima kasih atas penjelasannya Pak!'),
(2, 2, 'Normalisasi adalah proses...');

-- Insert Notifications
INSERT INTO notifications (user_id, type, title, message, link) VALUES
(4, 'assignment', 'Tugas Baru', 'Tugas baru telah ditambahkan di kelas Sistem Manajemen Basis Data', '/assignments/1'),
(4, 'grade', 'Nilai Tersedia', 'Nilai tugas ERD Anda sudah tersedia', '/grades/1'),
(5, 'assignment', 'Tugas Baru', 'Tugas baru telah ditambahkan di kelas Sistem Manajemen Basis Data', '/assignments/1');