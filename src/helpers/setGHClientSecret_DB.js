const db = require('../../server/db');

const setGHClientSecret_DB = async (ghClientSecret) => {
  try {
    await db.gitHubStore.update(
      { __id: 'ghClientSecret' },
      { __id: 'ghClientSecret', ghClientSecret: ghClientSecret },
      { upsert: true }
    );
  } catch (err) {
    throw new Error(err);
  }
};

module.exports = setGHClientSecret_DB;
