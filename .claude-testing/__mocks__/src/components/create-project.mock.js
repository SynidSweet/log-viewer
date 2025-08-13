// Mock for Create-project component
const React = require('react');

const Create-project = (props) => {
  return React.createElement('div', { 
    'data-testid': 'create-project-mock',
    ...props
  }, 'Create-project Mock');
};

module.exports = Create-project;