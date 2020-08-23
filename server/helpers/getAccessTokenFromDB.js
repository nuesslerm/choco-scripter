const db = require('../db');

const getAccessTokenFromDB = async () => {
  try {
    return await db.gitHubStore.findOne({}, (err) => {
      throw new Error(err);
    });
  } catch (err) {
    throw new Error(err);
  }
};

module.exports = getAccessTokenFromDB;
