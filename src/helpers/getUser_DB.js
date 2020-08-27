const db = require('../../server/db');

const getUser_DB = async (environment) => {
  try {
    const userArr = await db.userStore.find({
      environment: environment,
    });
    return userArr;
  } catch (err) {
    return null;
  }
};

module.exports = getUser_DB;
