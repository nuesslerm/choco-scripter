const inquirer = require('inquirer');
const fs = require('fs-extra');
const opn = require('opn');
const loadGhQueries = require('../server/loadGhQueries');
const db = require('../server/db');

// const config =
//   '/Users/nuesslerm/Library/Application Support/gql-playground/config.json';

// const configObj = fs.readJSONSync(config);

const dotenv = require('dotenv');
dotenv.config();

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

inquirer
  .prompt([
    {
      type: 'input',
      name: 'queryName',
      message: 'Are you a human?',
      default: false,
    },
  ])
  .then((answers) => {})
  .catch((error) => {
    if (error.isTtyError) {
      // Prompt couldn't be rendered in the current environment
    } else {
      // Something else when wrong
    }
  });
