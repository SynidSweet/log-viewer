// Mock for Alert-dialog component
const React = require('react');

const Alert-dialog = (props) => {
  return React.createElement('div', { 
    'data-testid': 'alert-dialog-mock',
    ...props
  }, 'Alert-dialog Mock');
};

module.exports = Alert-dialog;