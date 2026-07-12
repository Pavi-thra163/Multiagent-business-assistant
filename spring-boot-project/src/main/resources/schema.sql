-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS agent_business_db;
USE agent_business_db;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    prompt TEXT NOT NULL,
    status VARCHAR(30) NOT NULL, -- 'pending', 'completed', 'failed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Research Results Table
CREATE TABLE IF NOT EXISTS research_results (
    id VARCHAR(50) PRIMARY KEY,
    task_id VARCHAR(50) NOT NULL UNIQUE,
    technology_recommendations TEXT,
    project_scope TEXT,
    estimated_complexity VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- 4. Planning Results Table
CREATE TABLE IF NOT EXISTS planning_results (
    id VARCHAR(50) PRIMARY KEY,
    task_id VARCHAR(50) NOT NULL UNIQUE,
    timeline TEXT,
    phases TEXT,
    milestones TEXT,
    risk_analysis TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- 5. Coding Results Table
CREATE TABLE IF NOT EXISTS coding_results (
    id VARCHAR(50) PRIMARY KEY,
    task_id VARCHAR(50) NOT NULL UNIQUE,
    folder_structure TEXT,
    database_design TEXT,
    rest_apis TEXT,
    coding_standards TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- 6. Testing Results Table
CREATE TABLE IF NOT EXISTS testing_results (
    id VARCHAR(50) PRIMARY KEY,
    task_id VARCHAR(50) NOT NULL UNIQUE,
    test_cases TEXT,
    possible_bugs TEXT,
    validation_rules TEXT,
    security_checks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- 7. Documentation Results Table
CREATE TABLE IF NOT EXISTS documentation_results (
    id VARCHAR(50) PRIMARY KEY,
    task_id VARCHAR(50) NOT NULL UNIQUE,
    readme_content TEXT,
    installation_steps TEXT,
    api_documentation TEXT,
    deployment_guide TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- 8. Reports Table
CREATE TABLE IF NOT EXISTS reports (
    id VARCHAR(50) PRIMARY KEY,
    task_id VARCHAR(50) NOT NULL UNIQUE,
    project_summary TEXT,
    final_report_content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Sample Data Seeding
-- Seed User (Password is 'password123' BCrypt hashed)
INSERT INTO users (id, name, email, password_hash, created_at)
VALUES (
    'user-sample-01',
    'Jane Doe',
    'jane.doe@example.com',
    '$2a$10$gR9bIszI8Rj/pEshO8gK/.rVz5X2pI1DmsvQh8g3j6IymG0tX6W.m',
    NOW()
) ON DUPLICATE KEY UPDATE email=email;

-- Seed Task
INSERT INTO tasks (id, user_id, prompt, status, created_at)
VALUES (
    'task-sample-01',
    'user-sample-01',
    'Create an Inventory Management System',
    'completed',
    NOW()
) ON DUPLICATE KEY UPDATE status=status;

-- Seed Research
INSERT INTO research_results (id, task_id, technology_recommendations, project_scope, estimated_complexity, created_at)
VALUES (
    'res-sample-01',
    'task-sample-01',
    'Backend: Spring Boot, Frontend: React, DB: MySQL',
    'Real-time tracking of item SKUs and Low-Stock notification triggers.',
    'Medium',
    NOW()
) ON DUPLICATE KEY UPDATE estimated_complexity=estimated_complexity;
