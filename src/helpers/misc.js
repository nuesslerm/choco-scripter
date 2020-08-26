const path = require('path');

const appDir = path.dirname(require.main.filename);

const chocoCLIPath =
  appDir + '/../node_modules/@chocoapp/choco-cli/dist/index.js';

const cmdStrGen = (profileIn, queryNameIn, paramObjIn) => {
  return `node ${chocoCLIPath} -p ${profileIn} run -d ${appDir}/../database/temp/${queryNameIn}.graphql -v '${JSON.stringify(
    paramObjIn
  )}'`;
};

const wait = (timeToDelay) =>
  new Promise((resolve) => setTimeout(resolve, timeToDelay));

module.exports = { cmdStrGen, wait };
