const db = require('../../server/db');

const setUser_DB = async (environment, user) => {
  try {
    await db.userStore.insert({
      environment: environment,
      user: user,
    });
  } catch (err) {
    throw new Error(err);
  }
};

module.exports = setUser_DB;
