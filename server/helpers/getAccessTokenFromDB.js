const db = require('../db');

const getAccessTokenFromDB = async () => {
  try {
    const { accessToken } = await db.gitHubStore.findOne({}, (err) => {
      throw new Error(err);
    });
    return accessToken;
  } catch (err) {
    throw new Error(err);
  }
};

module.exports = getAccessTokenFromDB;
