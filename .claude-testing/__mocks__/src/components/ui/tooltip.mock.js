// Mock for Tooltip component
const React = require('react');

const Tooltip = (props) => {
  return React.createElement('div', { 
    'data-testid': 'tooltip-mock',
    ...props
  }, 'Tooltip Mock');
};

module.exports = Tooltip;