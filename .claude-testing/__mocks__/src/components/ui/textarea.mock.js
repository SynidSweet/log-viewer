// Mock for Textarea component
const React = require('react');

const Textarea = (props) => {
  return React.createElement('div', { 
    'data-testid': 'textarea-mock',
    ...props
  }, 'Textarea Mock');
};

module.exports = Textarea;