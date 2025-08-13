// Mock for NavMenu component
const React = require('react');

const NavMenu = () => {
  return React.createElement('div', { 
    'data-testid': 'nav-menu-mock'
  }, 'NavMenu Mock');
};

module.exports = NavMenu;
module.exports.NavMenu = NavMenu;