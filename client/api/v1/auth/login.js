const { handleLogin } = require('../../_auth');

module.exports = async (req, res) => {
  return handleLogin(req, res);
};
