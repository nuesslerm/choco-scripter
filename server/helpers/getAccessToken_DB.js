const db = require('../db');

const getAccessToken_DB = async () => {
  try {
    const { accessToken } = await db.gitHubStore.findOne({
      __id: 'accessToken',
    });
    return accessToken;
  } catch (err) {
    return null;
  }
};

module.exports = getAccessToken_DB;
