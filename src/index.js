const inquirer = require('inquirer');
const fs = require('fs-extra');
const opn = require('opn');
const { loadGhQueries } = require('../server/loadGhQueries');
const db = require('../server/db');
const { loadQueriesFromStore } = require('./loadQueriesFromStore');
const { loadChocoConfig } = require('./loadChocoConfig');

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
  .then(async ({ queryType }) => {
    const allEntries = await loadQueriesFromStore();

    const queriesObj = allEntries[queryType];

    inquirer
      .prompt({
        type: 'list',
        name: 'queryName',
        message: 'Which query would you like to execute?',
        choices: Object.keys(queriesObj),
      })
      .then(({ queryName }) => {
        const queryObj = queriesObj[queryName];

        const queryParamArr = [
          ...new Set(JSON.stringify(queryObj).match(/(\$)\w+/g)),
        ];

        inquirer
          .prompt(
            queryParamArr.map((queryParam) => ({
              type: 'input',
              name: `${queryParam.slice(1)}`,
              message: `Value for ${queryParam.slice(1)}?`,
            }))
          )
          .then(async (queryParamsObj) => {
            const { profile: profiles } = await loadChocoConfig();

            console.log(profiles);

            inquirer
              .prompt({
                type: 'list',
                name: 'profile',
                message: 'Which profile would you like to use?',
                choices: ['osdfj', 'jfoaij'],
              })
              .then(({ profile }) => {
                console.log(profile, queryParamsObj);
              });
          });
      });
  });
