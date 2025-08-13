// Mock for Checkbox component
const React = require('react');

const Checkbox = (props) => {
  return React.createElement('div', { 
    'data-testid': 'checkbox-mock',
    ...props
  }, 'Checkbox Mock');
};

module.exports = Checkbox;