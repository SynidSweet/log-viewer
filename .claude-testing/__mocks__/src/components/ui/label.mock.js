// Mock for Label component
const React = require('react');

const Label = (props) => {
  return React.createElement('div', { 
    'data-testid': 'label-mock',
    ...props
  }, 'Label Mock');
};

module.exports = Label;