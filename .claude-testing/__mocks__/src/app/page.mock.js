// Mock for page component
const React = require('react');

const MockPage = () => {
  return React.createElement('div', { 'data-testid': 'page-mock' }, 'Page Mock');
};

module.exports = MockPage;