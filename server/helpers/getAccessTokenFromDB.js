const db = require('../db');

const getAccessTokenFromDB = async () =>
  await db.gitHubStore.findOne({}, (err) => {
    if (err) throw err;
  });

module.exports = getAccessTokenFromDB;
