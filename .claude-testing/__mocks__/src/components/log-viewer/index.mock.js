// Mock for Index component
const React = require('react');

const Index = (props) => {
  return React.createElement('div', { 
    'data-testid': 'index-mock',
    ...props
  }, 'Index Mock');
};

module.exports = Index;