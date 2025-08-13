// Mock for Log-entry-details component
const React = require('react');

const Log-entry-details = (props) => {
  return React.createElement('div', { 
    'data-testid': 'log-entry-details-mock',
    ...props
  }, 'Log-entry-details Mock');
};

module.exports = Log-entry-details;