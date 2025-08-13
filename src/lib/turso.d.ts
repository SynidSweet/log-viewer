import { type ResultSet, type InArgs } from '@libsql/client';
import { DatabaseHealthDetails } from './types';
export declare const turso: import("@libsql/client").Client | null;
interface ConnectionMetrics {
    lastUsed: number;
    responseTime: number;
    queryCount: number;
}
export declare function executeQuery(sql: string, args?: InArgs, useCache?: boolean): Promise<ResultSet>;
export interface DatabaseError {
    type: 'connection' | 'initialization' | 'schema' | 'query' | 'validation';
    message: string;
    code?: string;
    retryable: boolean;
    details?: unknown;
}
export declare function createDatabaseError(type: DatabaseError['type'], message: string, originalError?: unknown): DatabaseError;
export declare function ensureDatabaseReady(): Promise<void>;
export declare function checkDatabaseConnection(): Promise<boolean>;
export declare function initializeDatabase(): Promise<void>;
export declare function checkDatabaseHealth(): Promise<{
    healthy: boolean;
    details: DatabaseHealthDetails;
}>;
export declare function getPerformanceMetrics(): ConnectionMetrics & {
    cacheSize: number;
};
export declare function clearQueryCache(): void;
export declare function executeBatch(operations: Array<{
    sql: string;
    args?: InArgs;
}>): Promise<ResultSet[]>;
export declare function warmupConnection(): Promise<void>;
export {};
//# sourceMappingURL=turso.d.ts.map