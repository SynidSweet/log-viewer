// Mock for Dialog component
const React = require('react');

const Dialog = (props) => {
  return React.createElement('div', { 
    'data-testid': 'dialog-mock',
    ...props
  }, 'Dialog Mock');
};

module.exports = Dialog;