const { handleVerifyPayment } = require('../_razorpay');

module.exports = async (req, res) => {
  return handleVerifyPayment(req, res);
};
