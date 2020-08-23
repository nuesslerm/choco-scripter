const path = require('path');
// const fetch = require('node-fetch');

// const { loadGhQueries } = require('../server/helpers/loadGhQueries');
// const db = require('../server/db');

const appDir = path.dirname(require.main.filename);

const chocoCLIPath =
  appDir + '/../node_modules/@chocoapp/choco-cli/dist/index.js';
const gqlQueriesPath = appDir + '/../gqlQueries';

const cmdStrGen = (userProfileIn, queryNameIn, paramObjIn) => {
  return `node ${chocoCLIPath} -p ${userProfileIn} run -d ${gqlQueriesPath}/${queryNameIn}.graphql -v '${JSON.stringify(
    paramObjIn
  )}'`;
};

const wait = (timeToDelay) =>
  new Promise((resolve) => setTimeout(resolve, timeToDelay));

// db.queriesStore.insert({ queries: data }, (err) => {
//   if (err) throw err;
// });

// const loadQueriesFromStore = async () => await db.queriesStore.find({});

// (async () => {
//   const queriesObj = await loadQueriesFromStore();
//   console.log(queriesObj);
// })();

// async function callServer() {
//   let res = fetch(`http://localhost:${port}/oauth/github/callback`);
//   let data = res.json();
//   console.log(data);
// }

module.exports = { cmdStrGen, wait };
