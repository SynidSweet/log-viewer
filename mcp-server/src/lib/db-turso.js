"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProjects = getProjects;
exports.getProject = getProject;
exports.createProject = createProject;
exports.updateProject = updateProject;
exports.deleteProject = deleteProject;
exports.hasProjectLogs = hasProjectLogs;
exports.getProjectLogs = getProjectLogs;
exports.getLog = getLog;
exports.createLog = createLog;
exports.updateLog = updateLog;
exports.deleteLog = deleteLog;
exports.getPerformanceStats = getPerformanceStats;
exports.createMultipleLogs = createMultipleLogs;
exports.clearDatabaseCache = clearDatabaseCache;
exports.warmupDatabaseConnection = warmupDatabaseConnection;
exports.getProjectByApiKey = getProjectByApiKey;
// lib/db-turso.ts
const turso_1 = require("./turso");
const nanoid_1 = require("nanoid");
// Database operation wrapper with error handling
async function withDatabaseOperation(operation, operationType) {
    try {
        await (0, turso_1.ensureDatabaseReady)();
        return await operation();
    }
    catch (error) {
        if (error instanceof Error && 'type' in error) {
            throw error; // Re-throw database errors as-is
        }
        throw (0, turso_1.createDatabaseError)('query', `${operationType} operation failed`, error);
    }
}
// Project related functions
async function getProjects() {
    return withDatabaseOperation(async () => {
        // Use optimized query with caching for frequently accessed data
        const result = await (0, turso_1.executeQuery)('SELECT * FROM projects ORDER BY created_at DESC', undefined, true);
        return result.rows.map(row => ({
            id: row.id,
            name: row.name,
            description: row.description,
            createdAt: row.created_at,
            apiKey: row.api_key
        }));
    }, 'getProjects');
}
async function getProject(id) {
    return withDatabaseOperation(async () => {
        // Use optimized query with caching for single project lookups
        const result = await (0, turso_1.executeQuery)('SELECT * FROM projects WHERE id = ?', [id], true);
        if (result.rows.length === 0)
            return null;
        const row = result.rows[0];
        return {
            id: row.id,
            name: row.name,
            description: row.description,
            createdAt: row.created_at,
            apiKey: row.api_key
        };
    }, 'getProject');
}
async function createProject(name, description = '') {
    return withDatabaseOperation(async () => {
        const id = name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
        const apiKey = (0, nanoid_1.nanoid)(32);
        const createdAt = new Date().toISOString();
        const project = {
            id,
            name,
            description,
            createdAt,
            apiKey
        };
        // Use optimized query execution (no caching for writes)
        await (0, turso_1.executeQuery)('INSERT INTO projects (id, name, description, created_at, api_key) VALUES (?, ?, ?, ?, ?)', [id, name, description, createdAt, apiKey]);
        return project;
    }, 'createProject');
}
async function updateProject(id, updates) {
    return withDatabaseOperation(async () => {
        const project = await getProject(id);
        if (!project)
            return null;
        const updatedProject = { ...project, ...updates };
        // If ID was changed, we need to create a new record and delete the old one
        if (updates.id && updates.id !== id) {
            // Use batch operations for better performance
            const operations = [
                {
                    sql: 'INSERT INTO projects (id, name, description, created_at, api_key) VALUES (?, ?, ?, ?, ?)',
                    args: [updates.id, updatedProject.name, updatedProject.description, updatedProject.createdAt, updatedProject.apiKey]
                },
                {
                    sql: 'UPDATE logs SET project_id = ? WHERE project_id = ?',
                    args: [updates.id, id]
                },
                {
                    sql: 'DELETE FROM projects WHERE id = ?',
                    args: [id]
                }
            ];
            await (0, turso_1.executeBatch)(operations);
            return updatedProject;
        }
        // If no ID change, just update the existing record
        const setClause = [];
        const args = [];
        if (updates.name) {
            setClause.push('name = ?');
            args.push(updates.name);
        }
        if (updates.description !== undefined) {
            setClause.push('description = ?');
            args.push(updates.description);
        }
        if (setClause.length > 0) {
            args.push(id);
            await (0, turso_1.executeQuery)(`UPDATE projects SET ${setClause.join(', ')} WHERE id = ?`, args);
        }
        return updatedProject;
    }, 'updateProject');
}
async function deleteProject(id) {
    return withDatabaseOperation(async () => {
        // Use optimized query execution
        const result = await (0, turso_1.executeQuery)('DELETE FROM projects WHERE id = ?', [id]);
        return result.rowsAffected > 0;
    }, 'deleteProject');
}
async function hasProjectLogs(id) {
    return withDatabaseOperation(async () => {
        // Use optimized query with caching for count checks
        const result = await (0, turso_1.executeQuery)('SELECT COUNT(*) as count FROM logs WHERE project_id = ?', [id], true);
        return result.rows[0].count > 0;
    }, 'hasProjectLogs');
}
// Log related functions
async function getProjectLogs(projectId) {
    return withDatabaseOperation(async () => {
        // Use optimized query with caching for log lists (frequently accessed)
        const result = await (0, turso_1.executeQuery)('SELECT id, project_id, timestamp, comment, is_read FROM logs WHERE project_id = ? ORDER BY timestamp DESC', [projectId], true);
        return result.rows.map(row => ({
            id: row.id,
            projectId: row.project_id,
            timestamp: row.timestamp,
            comment: row.comment || '',
            isRead: Boolean(row.is_read)
        }));
    }, 'getProjectLogs');
}
async function getLog(logId) {
    return withDatabaseOperation(async () => {
        // Use optimized query with caching for individual log details
        const result = await (0, turso_1.executeQuery)('SELECT * FROM logs WHERE id = ?', [logId], true);
        if (result.rows.length === 0)
            return null;
        const row = result.rows[0];
        return {
            id: row.id,
            projectId: row.project_id,
            timestamp: row.timestamp,
            comment: row.comment || '',
            isRead: Boolean(row.is_read),
            content: row.content
        };
    }, 'getLog');
}
async function createLog(projectId, content, comment = '') {
    return withDatabaseOperation(async () => {
        const id = (0, nanoid_1.nanoid)();
        const timestamp = new Date().toISOString();
        const log = {
            id,
            projectId,
            timestamp,
            comment,
            isRead: false,
            content
        };
        // Use optimized query execution
        await (0, turso_1.executeQuery)('INSERT INTO logs (id, project_id, content, comment, timestamp, is_read) VALUES (?, ?, ?, ?, ?, ?)', [id, projectId, content, comment, timestamp, false]);
        return log;
    }, 'createLog');
}
async function updateLog(logId, updates) {
    return withDatabaseOperation(async () => {
        const log = await getLog(logId);
        if (!log)
            return null;
        if (updates.isRead !== undefined) {
            // Use optimized query execution
            await (0, turso_1.executeQuery)('UPDATE logs SET is_read = ? WHERE id = ?', [updates.isRead, logId]);
        }
        return {
            ...log,
            ...updates,
            content: undefined // Don't return content for efficiency
        };
    }, 'updateLog');
}
async function deleteLog(logId) {
    return withDatabaseOperation(async () => {
        // Use optimized query execution
        const result = await (0, turso_1.executeQuery)('DELETE FROM logs WHERE id = ?', [logId]);
        return result.rowsAffected > 0;
    }, 'deleteLog');
}
// Performance monitoring and optimization utilities
async function getPerformanceStats() {
    return withDatabaseOperation(async () => {
        const { getPerformanceMetrics } = await Promise.resolve().then(() => __importStar(require('./turso')));
        const metrics = getPerformanceMetrics();
        return {
            database: {
                queryCount: metrics.queryCount,
                avgResponseTime: metrics.responseTime,
                cacheSize: metrics.cacheSize,
                lastUsed: metrics.lastUsed
            },
            operations: {
                totalOperations: metrics.queryCount,
                averageLatency: metrics.responseTime,
                cacheHitRate: metrics.cacheSize > 0 ? 'cached' : 'not cached'
            }
        };
    }, 'getPerformanceStats');
}
// Batch operations for better performance
async function createMultipleLogs(logs) {
    return withDatabaseOperation(async () => {
        const timestamp = new Date().toISOString();
        const createdLogs = [];
        // Prepare batch operations
        const operations = logs.map(logData => {
            const id = (0, nanoid_1.nanoid)();
            const log = {
                id,
                projectId: logData.projectId,
                timestamp,
                comment: logData.comment || '',
                isRead: false,
                content: logData.content
            };
            createdLogs.push(log);
            return {
                sql: 'INSERT INTO logs (id, project_id, content, comment, timestamp, is_read) VALUES (?, ?, ?, ?, ?, ?)',
                args: [id, logData.projectId, logData.content, logData.comment || '', timestamp, false]
            };
        });
        // Execute batch operation
        await (0, turso_1.executeBatch)(operations);
        return createdLogs;
    }, 'createMultipleLogs');
}
// Cache management utilities
async function clearDatabaseCache() {
    const { clearQueryCache } = await Promise.resolve().then(() => __importStar(require('./turso')));
    clearQueryCache();
}
async function warmupDatabaseConnection() {
    const { warmupConnection } = await Promise.resolve().then(() => __importStar(require('./turso')));
    await warmupConnection();
}
// Utility function to get project by API key
async function getProjectByApiKey(apiKey) {
    return withDatabaseOperation(async () => {
        // Use optimized query with caching for API key lookups (frequently accessed)
        const result = await (0, turso_1.executeQuery)('SELECT * FROM projects WHERE api_key = ?', [apiKey], true);
        if (result.rows.length === 0)
            return null;
        const row = result.rows[0];
        return {
            id: row.id,
            name: row.name,
            description: row.description,
            createdAt: row.created_at,
            apiKey: row.api_key
        };
    }, 'getProjectByApiKey');
}
//# sourceMappingURL=db-turso.js.map