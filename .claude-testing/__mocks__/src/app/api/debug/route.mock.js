// Mock for API route
const NextRequest = jest.fn();
const NextResponse = jest.fn();
const mockDb = jest.fn();
const mockApiErrorHandler = jest.fn();
const mockTurso = jest.fn();

module.exports = {
  NextRequest,
  NextResponse,
  mockDb,
  mockApiErrorHandler,
  mockTurso
};