const sendMail = jest.fn();

module.exports = {
  createTransport: jest.fn(() => ({
    sendMail
  })),
  __mockSendMail: sendMail
};