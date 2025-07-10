-- Universal Log Viewer Database Schema
-- SQLite schema for Turso database

-- Projects table
CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    created_at TEXT NOT NULL,
    api_key TEXT NOT NULL UNIQUE
);

-- Logs table
CREATE TABLE logs (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    content TEXT NOT NULL,
    comment TEXT DEFAULT '',
    timestamp TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Indexes for better performance
CREATE INDEX idx_logs_project_id ON logs(project_id);
CREATE INDEX idx_logs_timestamp ON logs(timestamp);
CREATE INDEX idx_logs_is_read ON logs(is_read);
CREATE INDEX idx_projects_api_key ON projects(api_key);