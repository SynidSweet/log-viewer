import { Project, ProjectLog } from './types';
export declare function getProjects(): Promise<Project[]>;
export declare function getProject(id: string): Promise<Project | null>;
export declare function createProject(name: string, description?: string): Promise<Project>;
export declare function updateProject(id: string, updates: {
    name?: string;
    description?: string;
    id?: string;
}): Promise<Project | null>;
export declare function deleteProject(id: string): Promise<boolean>;
export declare function hasProjectLogs(id: string): Promise<boolean>;
export declare function getProjectLogs(projectId: string): Promise<ProjectLog[]>;
export declare function getLog(logId: string): Promise<ProjectLog | null>;
export declare function createLog(projectId: string, content: string, comment?: string): Promise<ProjectLog>;
export declare function updateLog(logId: string, updates: {
    isRead?: boolean;
}): Promise<ProjectLog | null>;
export declare function deleteLog(logId: string): Promise<boolean>;
export declare function getPerformanceStats(): Promise<{
    database: {
        queryCount: number;
        avgResponseTime: number;
        cacheSize: number;
        lastUsed: number;
    };
    operations: {
        totalOperations: number;
        averageLatency: number;
        cacheHitRate: string;
    };
}>;
export declare function createMultipleLogs(logs: Array<{
    projectId: string;
    content: string;
    comment?: string;
}>): Promise<ProjectLog[]>;
export declare function clearDatabaseCache(): Promise<void>;
export declare function warmupDatabaseConnection(): Promise<void>;
export declare function getProjectByApiKey(apiKey: string): Promise<Project | null>;
//# sourceMappingURL=db-turso.d.ts.map