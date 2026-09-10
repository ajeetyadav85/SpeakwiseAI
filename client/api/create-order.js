const { handleCreateOrder } = require('./_razorpay');

module.exports = async (req, res) => {
  return handleCreateOrder(req, res);
};
