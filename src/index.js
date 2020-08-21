const inquirer = require('inquirer');
const fs = require('fs-extra');
const opn = require('opn');
const loadGhQueries = require('../server/loadGhQueries');
const db = require('../server/db');

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

const loadQueriesFromStore = async () => {
  try {
    return await fs.readFile('database/queriesStore.db', 'utf-8');
    // console.log(data);
  } catch (err) {
    if (err) throw err;
  }
};

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
    const { entries: queryEntries } = JSON.parse(await loadQueriesFromStore());

    const [
      {
        object: { entries },
      },
    ] = queryEntries.filter((entry) => entry.name === answer.queryType);

    inquirer
      .prompt({
        type: 'list',
        name: 'queryName',
        message: 'Which query would you like to execute?',
        choices: entries.map((entry) => entry.name),
      })
      .then((answer) => {
        const queryObj = entries.filter(
          (entry) => entry.name === answer.queryName
        );
        console.log(queryObj);
      });
  });
