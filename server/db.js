const Datastore = require('nedb');

const db = {};
db.gitHubStore = new Datastore({
  filename: '../database/gitHubStore.db',
  autoload: true,
});

db.queriesStore = new Datastore({
  filename: '../database/queriesStore.db',
  autoload: true,
});

module.exports = db;
