import { NextResponse } from 'next/server';
export interface ApiErrorResponse {
    error: string;
    message: string;
    type: string;
    retryable?: boolean;
    timestamp: string;
    statusCode: number;
}
export interface ApiSuccessResponse<T = unknown> {
    success: true;
    data: T;
    timestamp: string;
}
export declare function classifyAndFormatError(error: unknown): ApiErrorResponse;
export declare function createErrorResponse(error: unknown): NextResponse;
export declare function createSuccessResponse<T>(data: T, status?: number): NextResponse;
export declare function withApiErrorHandling<T>(operation: () => Promise<T>): Promise<NextResponse>;
export declare function validateEnvironmentVariables(required: string[]): void;
//# sourceMappingURL=api-error-handler.d.ts.map