// Mock for Input component
const React = require('react');

const Input = (props) => {
  return React.createElement('div', { 
    'data-testid': 'input-mock',
    ...props
  }, 'Input Mock');
};

module.exports = Input;