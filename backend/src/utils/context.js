// backend/src/utils/context.js
const { AsyncLocalStorage } = require('node:async_hooks');

const contextStorage = new AsyncLocalStorage();

const getContext = () => {
  return contextStorage.getStore();
};

module.exports = {
  contextStorage,
  getContext,
};