-- ============================================
-- MIGRATION SCRIPT: Add Missing Columns
-- ============================================
-- This script adds the new columns that were missing in the old schema
-- Run this if you already have elearning_db database with old schema
-- ============================================

USE elearning_db;

-- Add missing columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS address TEXT AFTER phone,
ADD COLUMN IF NOT EXISTS date_of_birth DATE AFTER address,
ADD COLUMN IF NOT EXISTS gender ENUM('male', 'female', 'other') AFTER date_of_birth,
ADD COLUMN IF NOT EXISTS student_id VARCHAR(20) AFTER gender,
ADD COLUMN IF NOT EXISTS employee_id VARCHAR(20) AFTER student_id;

-- Add missing columns to classes table
ALTER TABLE classes
ADD COLUMN IF NOT EXISTS credits INT DEFAULT 3 AFTER description,
ADD COLUMN IF NOT EXISTS schedule VARCHAR(100) AFTER semester,
ADD COLUMN IF NOT EXISTS room VARCHAR(50) AFTER schedule;

-- Add missing column to assignments table
ALTER TABLE assignments
ADD COLUMN IF NOT EXISTS file_url VARCHAR(500) AFTER deadline;

-- Verify changes
SELECT 'Migration completed successfully!' as status;

-- Show updated table structures
DESCRIBE users;
DESCRIBE classes;
DESCRIBE assignments;
