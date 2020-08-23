const Datastore = require('nedb-promises');

const db = {};
db.gitHubStore = Datastore.create({
  filename: 'database/gitHubStore.db',
});

db.queriesStore = Datastore.create({
  filename: 'database/queriesStore.db',
});

module.exports = db;
