const db = require('../../server/db');

const setChat_DB = async (environment, chat) => {
  try {
    await db.chatStore.insert({
      environment: environment,
      chat: chat,
    });
  } catch (err) {
    throw new Error(err);
  }
};

module.exports = setChat_DB;
