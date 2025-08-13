// Mock for Select component
const React = require('react');

const Select = (props) => {
  return React.createElement('div', { 
    'data-testid': 'select-mock',
    ...props
  }, 'Select Mock');
};

module.exports = Select;