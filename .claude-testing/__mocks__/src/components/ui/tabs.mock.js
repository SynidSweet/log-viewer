// Mock for Tabs component
const React = require('react');

const Tabs = (props) => {
  return React.createElement('div', { 
    'data-testid': 'tabs-mock',
    ...props
  }, 'Tabs Mock');
};

module.exports = Tabs;