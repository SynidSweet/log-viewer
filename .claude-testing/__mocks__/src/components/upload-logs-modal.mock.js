// Mock for Upload-logs-modal component
const React = require('react');

const Upload-logs-modal = (props) => {
  return React.createElement('div', { 
    'data-testid': 'upload-logs-modal-mock',
    ...props
  }, 'Upload-logs-modal Mock');
};

module.exports = Upload-logs-modal;