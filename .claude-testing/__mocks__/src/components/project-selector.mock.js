// Mock for Project-selector component
const React = require('react');

const Project-selector = (props) => {
  return React.createElement('div', { 
    'data-testid': 'project-selector-mock',
    ...props
  }, 'Project-selector Mock');
};

module.exports = Project-selector;