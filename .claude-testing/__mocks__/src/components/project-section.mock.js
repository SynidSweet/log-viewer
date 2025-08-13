// Mock for Project-section component
const React = require('react');

const Project-section = (props) => {
  return React.createElement('div', { 
    'data-testid': 'project-section-mock',
    ...props
  }, 'Project-section Mock');
};

module.exports = Project-section;