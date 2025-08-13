// Mock for Button component
const React = require('react');

const Button = (props) => {
  return React.createElement('div', { 
    'data-testid': 'button-mock',
    ...props
  }, 'Button Mock');
};

module.exports = Button;