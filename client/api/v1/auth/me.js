const { handleGetMe } = require('../../_auth');

module.exports = async (req, res) => {
  return handleGetMe(req, res);
};
