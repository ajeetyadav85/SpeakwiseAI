const { handleRegister } = require('../../_auth');

module.exports = async (req, res) => {
  return handleRegister(req, res);
};
