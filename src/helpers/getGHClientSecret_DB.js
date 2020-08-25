const db = require('../../server/db');

const getGHClientSecret_DB = async () => {
  try {
    const { ghClientSecret } = await db.gitHubStore.findOne({
      __id: 'ghClientSecret',
    });
    return ghClientSecret;
  } catch (err) {
    return null;
  }
};

module.exports = getGHClientSecret_DB;
