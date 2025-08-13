// Mock for logs route API
const NextRequest = jest.fn();
const NextResponse = jest.fn();
const mockDb = jest.fn();
const mockApiErrorHandler = jest.fn();

module.exports = {
  NextRequest,
  NextResponse,
  mockDb,
  mockApiErrorHandler
};