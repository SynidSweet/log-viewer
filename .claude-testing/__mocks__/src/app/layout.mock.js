// Mock for layout component
const React = require('react');

const MockLayout = ({ children }) => {
  return React.createElement('div', { 'data-testid': 'layout-mock' }, children);
};

module.exports = MockLayout;