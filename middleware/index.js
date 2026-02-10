const auth = require('./auth');
const validation = require('./validation');
const security = require('./security');
const errorHandler = require('./errorHandler');

module.exports = {
  ...auth,
  ...validation,
  ...security,
  ...errorHandler
};
