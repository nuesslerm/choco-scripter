const path = require('path');

const appDir = path.dirname(require.main.filename);

const choco_cli = appDir + '/../node_modules/@chocoapp/choco-cli/dist/index.js';

const cmdStrGen = (userProfileIn, queryNameIn, paramObjIn) =>
  `node ${choco_cli} -p ${userProfileIn} run -d gqlQueries/${queryNameIn}.graphql -v '${JSON.stringify(
    paramObjIn
  )}'`;

const wait = (timeToDelay) =>
  new Promise((resolve) => setTimeout(resolve, timeToDelay));

module.exports = { cmdStrGen, wait };
