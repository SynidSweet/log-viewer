// Mock for LogEntryList component
const React = require('react');

const LogEntryList = ({ entries, selectedIndex, onSelectEntry, selectedEntryIds, onToggleSelection }) => {
  return React.createElement('div', { 
    'data-testid': 'log-entry-list'
  }, 
    entries.map((entry, index) => 
      React.createElement('div', {
        key: entry.id,
        'data-testid': `log-entry-${index}`,
        onClick: () => onSelectEntry && onSelectEntry(index),
        className: index === selectedIndex ? 'selected' : ''
      }, `${entry.message} - ${entry.level}`)
    )
  );
};

module.exports = LogEntryList;
module.exports.LogEntryList = LogEntryList;