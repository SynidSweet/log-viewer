// Mock for LogItem component
const React = require('react');

const LogItem = ({ log, isSelected, onSelectLog, onDeleteLog, onToggleReadStatus }) => {
  return React.createElement('div', { 
    'data-testid': `log-item-${log.id}`,
    onClick: () => onSelectLog && onSelectLog(log.id),
    className: isSelected ? 'selected' : ''
  }, log.comment || 'LogItem Mock');
};

module.exports = LogItem;
module.exports.LogItem = LogItem;