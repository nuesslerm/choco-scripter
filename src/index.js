const inquirer = require('inquirer');
const fs = require('fs-extra');
const opn = require('opn');
const { loadGhQueries } = require('../server/loadGhQueries');
const db = require('../server/db');
const { loadQueriesFromStore } = require('./loadQueriesFromStore');

const dotenv = require('dotenv');
dotenv.config();

// const config =
//   '/Users/nuesslerm/Library/Application Support/gql-playground/config.json';

// const configObj = fs.readJSONSync(config);

// --------------------------------

const ghClientId = process.env.GH_CLIENT_ID;
const ghClientSecret = process.env.GH_CLIENT_SECRET;

const authUrl = `https://github.com/login/oauth/authorize?client_id=${ghClientId}&scope=repo%20read:org`;

// opn(authUrl) will redirect to /oauth/github/callback so the rest will be handled by the express server

// opn(authUrl);

// db.queriesStore.insert({ queries: data }, (err) => {
//   if (err) throw err;
// });

// --------------------------------

// const loadQueriesFromStore = async () => await db.queriesStore.find({});

// (async () => {
//   const queriesObj = await loadQueriesFromStore();
//   console.log(queriesObj);
// })();

inquirer
  .prompt({
    type: 'list',
    name: 'queryType',
    default: 'Query',
    message: 'What do you want to do?',
    choices: ['Query', 'Mutation'],
    filter: function (val) {
      return val.toLowerCase();
    },
  })
  .then(async (answer) => {
    const allEntries = await loadQueriesFromStore();

    const queriesObj = allEntries[answer.queryType];

    inquirer
      .prompt({
        type: 'list',
        name: 'queryName',
        message: 'Which query would you like to execute?',
        choices: Object.keys(queriesObj),
      })
      .then((answer) => {
        const queryObj = queriesObj[answer.queryName];
        console.log(queryObj);
      });
  });
