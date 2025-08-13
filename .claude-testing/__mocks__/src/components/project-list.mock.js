// Mock for Project-list component
const React = require('react');

const Project-list = (props) => {
  return React.createElement('div', { 
    'data-testid': 'project-list-mock',
    ...props
  }, 'Project-list Mock');
};

module.exports = Project-list;