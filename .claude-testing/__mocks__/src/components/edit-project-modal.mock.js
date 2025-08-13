// Mock for Edit-project-modal component
const React = require('react');

const Edit-project-modal = (props) => {
  return React.createElement('div', { 
    'data-testid': 'edit-project-modal-mock',
    ...props
  }, 'Edit-project-modal Mock');
};

module.exports = Edit-project-modal;