/**
 * Mock implementation of nanoid for Jest testing
 */

module.exports = {
  nanoid: function(size = 21) {
    // Simple random string generator for testing
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    let result = '';
    for (let i = 0; i < size; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }
};