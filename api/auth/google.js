const { handleGoogleLogin } = require('../_auth');

module.exports = async (req, res) => {
  return handleGoogleLogin(req, res);
};
