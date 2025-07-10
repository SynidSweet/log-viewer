-- Universal Log Viewer Database Schema
-- Turso SQLite Database Schema for Projects and Logs
-- Created: 2025-07-10
-- Version: 1.0
-- 
-- This schema is automatically applied during database initialization.
-- It can also be used for manual database setup or documentation.

-- Projects table: stores project metadata and API keys
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,                    -- Unique project identifier (slug format)
    name TEXT NOT NULL,                     -- Human-readable project name
    description TEXT DEFAULT '',            -- Optional project description
    created_at TEXT NOT NULL,               -- ISO timestamp when project was created
    api_key TEXT NOT NULL UNIQUE          -- API key for log submission authentication
);

-- Logs table: stores log entries with metadata
CREATE TABLE IF NOT EXISTS logs (
    id TEXT PRIMARY KEY,                    -- Unique log entry identifier (nanoid)
    project_id TEXT NOT NULL,               -- Foreign key to projects table
    content TEXT NOT NULL,                  -- Full log content (may contain multiple log lines)
    comment TEXT DEFAULT '',               -- Optional comment from log submission
    timestamp TEXT NOT NULL,               -- ISO timestamp when log was created
    is_read BOOLEAN DEFAULT FALSE,          -- Track if this log has been viewed
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Performance indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_logs_project_id ON logs(project_id);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_logs_is_read ON logs(is_read);
CREATE INDEX IF NOT EXISTS idx_projects_api_key ON projects(api_key);

-- Schema validation queries (for health checks)
-- SELECT COUNT(*) FROM projects;
-- SELECT COUNT(*) FROM logs;
-- PRAGMA foreign_key_check;

-- Example data structure:
-- Projects table example:
-- id: 'my-web-app'
-- name: 'My Web App'
-- description: 'Frontend application logs'
-- created_at: '2025-07-10T10:30:00.000Z'
-- api_key: 'abc123def456...' (32 character nanoid)

-- Logs table example:
-- id: 'V1StGXR8_Z5jdHi6B-myT' (nanoid)
-- project_id: 'my-web-app'
-- content: '[2025-07-10, 10:30:00] [LOG] User login successful - {"userId": "123", "role": "admin"}'
-- comment: 'Login audit trail'
-- timestamp: '2025-07-10T10:30:00.000Z'
-- is_read: false