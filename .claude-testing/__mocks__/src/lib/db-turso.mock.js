// Mock for db-turso module
const mockDb = {
  getProjects: jest.fn(),
  getProject: jest.fn(),
  createProject: jest.fn(),
  updateProject: jest.fn(),
  deleteProject: jest.fn(),
  getLogs: jest.fn(),
  getLog: jest.fn(),
  createLog: jest.fn(),
  updateLog: jest.fn(),
  deleteLog: jest.fn(),
  initializeDatabase: jest.fn(),
  testConnection: jest.fn()
};

module.exports = mockDb;