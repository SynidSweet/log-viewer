// Mock for Card component
const React = require('react');

const Card = (props) => {
  return React.createElement('div', { 
    'data-testid': 'card-mock',
    ...props
  }, 'Card Mock');
};

module.exports = Card;