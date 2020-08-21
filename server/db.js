// const Datastore = require('nedb');

// const db = {};
// db.gitHubStore = new Datastore({
//   filename: 'database/gitHubStore.db',
//   autoload: true,
// });

// db.queriesStore = new Datastore({
//   filename: 'database/queriesStore.db',
//   autoload: true,
// });

const Datastore = require('nedb-promises');

const db = {};
db.gitHubStore = Datastore.create({
  filename: 'database/gitHubStore.db',
});

db.queriesStore = Datastore.create({
  filename: 'database/queriesStore.db',
});

module.exports = db;
