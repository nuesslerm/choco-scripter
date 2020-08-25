const Datastore = require('nedb-promises');
const path = require('path');

const appDir = path.dirname(require.main.filename);

const db = {};
db.gitHubStore = Datastore.create({
  filename: `${appDir}/../database/gitHubStore.db`,
});

db.queriesStore = Datastore.create({
  filename: `${appDir}/../database/queriesStore.db`,
});

module.exports = db;
