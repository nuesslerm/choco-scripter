const inquirer = require('inquirer');
inquirer.registerPrompt('recursive', require('inquirer-recursive'));

const fs = require('fs-extra');
const opn = require('opn');
const uuid = require('uuid');
const exec = require('await-exec');

const { loadGhQueries } = require('../server/loadGhQueries');
const db = require('../server/db');
const { loadQueriesFromStore } = require('./loadQueriesFromStore');
const { loadChocoConfig } = require('./loadChocoConfig');
let {
  defaultOrder,
  defaultProductArr,
  defaultProduct,
  defaultMessage,
  defaultChat,
} = require('./queryParamDefaults');

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

async function main() {
  const { ghOAuth } = await inquirer.prompt({
    type: 'confirm',
    name: 'ghOAuth',
    message: 'Do you want to load queries from GitHub (defaul: NO)?',
    default: false,
  });

  const answersMap = {};
  answersMap['ghOAuth'] = ghOAuth;

  // launching the browser and accessing github OAuth

  // ---------------------------------------------------------------------------

  const { profile: configProfilesObj } = await loadChocoConfig();

  configProfilesArr = Object.values(configProfilesObj);

  const stageSet = new Set();

  for (let configProfile of configProfilesArr) {
    stageSet.add(configProfile.stage);
  }

  // ---------------------------------------------------------------------------

  const { environment } = await inquirer.prompt({
    type: 'list',
    name: 'environment',
    message: 'Which environment would you like to use?',
    choices: [...stageSet],
  });

  const userTypeSet = new Set();

  for (let configProfile of configProfilesArr) {
    if (configProfile.stage === environment) {
      userTypeSet.add(configProfile.userType);
    }
  }

  answersMap['environment'] = environment;

  // ---------------------------------------------------------------------------

  const { userType } = await inquirer.prompt({
    type: 'list',
    name: 'userType',
    message: 'Which userType would you like to use?',
    choices: [...userTypeSet],
  });

  const userProfileSet = new Set();

  for (let key in configProfilesObj) {
    if (
      configProfilesObj[key].stage === environment &&
      configProfilesObj[key].userType === userType
    ) {
      userProfileSet.add({
        key,
        userIdentifier: configProfilesObj[key].userIdentifier,
      });
    }
  }

  answersMap['userType'] = userType;

  // ---------------------------------------------------------------------------

  const { userProfile: userProfileStrArr } = await inquirer.prompt({
    type: 'list',
    name: 'userProfile',
    message: 'Which profile would you like to use?',
    choices: [...userProfileSet].map(
      (profile) => `${profile.key}: ${profile.userIdentifier}`
    ),
  });

  userProfile = userProfileStrArr.split(': ')[0];

  answersMap['userProfile'] = userProfile;

  // ---------------------------------------------------------------------------
  // START OF RECURSION
  // ---------------------------------------------------------------------------

  await repeatQuery(answersMap, false);
}

// ---------------------------------------------------------------------------
// HELPER FUNCTIONS
// ---------------------------------------------------------------------------

const cmdStrGen = (userProfileIn, queryNameIn, paramObjIn) =>
  `choco -p ${userProfileIn} run -d gqlQueries/${queryNameIn}.graphql -v '${JSON.stringify(
    paramObjIn
  )}'`;

// ---------------------------------------------------------------------------
// RECURSIVE FUNCTION
// ---------------------------------------------------------------------------

async function repeatQuery(prevAnswersMap, sameQuery) {
  let {
    queriesObj,
    queryName,
    queryParamArr,
    paramObj: prevParamObj,
  } = prevAnswersMap;

  if (!sameQuery) {
    const { queryType } = await inquirer.prompt({
      type: 'list',
      name: 'queryType',
      default: 'Query',
      message: 'What do you want to do?',
      choices: ['Mutation', 'Query'],
      default: 'Mutation',
      filter: function (val) {
        return val.toLowerCase();
      },
    });

    const allEntries = await loadQueriesFromStore();

    queriesObj = allEntries[queryType];

    prevAnswersMap['queriesObj'] = queriesObj;

    // ---------------------------------------------------------------------------

    ({ queryName } = await inquirer.prompt({
      type: 'list',
      name: 'queryName',
      message: 'Which query would you like to execute?',
      choices: Object.keys(queriesObj),
      default: () => {
        if (queryType === 'mutation') {
          return 'orderCreate';
        } else {
          return 'getChat';
        }
      },
    }));

    queryParamArr = [
      ...new Set(JSON.stringify(queriesObj[queryName]).match(/(\$)\w+/g)),
    ];

    prevAnswersMap['queryName'] = queryName;
    prevAnswersMap['queryParamArr'] = queryParamArr;
  }

  // ---------------------------------------------------------------------------

  const { newOrderNum, newProductNum, ...newParamObj } = await inquirer.prompt([
    ...queryParamArr.map((queryParam) => ({
      type: 'input',
      name: `${queryParam.slice(1)}`,
      message: `Value for ${queryParam.slice(1)}?`,
      default: () => {
        if (sameQuery) {
          if (/order/gi.test(queryParam)) {
            return 'OrderInput - auto-generated';
          } else if (/products/gi.test(queryParam)) {
            return '[AdminProductInput] - auto-generated';
          } else {
            return prevParamObj[queryParam.slice(1)];
          }
        } else {
          if (/id/gi.test(queryParam)) {
            return uuid.v4();
          } else if (/order/gi.test(queryParam)) {
            return 'OrderInput - auto-generated';
          } else if (/products/gi.test(queryParam)) {
            return '[AdminProductInput] - auto-generated';
          } else if (/product/gi.test(queryParam)) {
            return defaultProduct;
          } else if (/dryRun/gi.test(queryParam)) {
            return false;
          } else if (/message/gi.test(queryParam)) {
            return defaultMessage;
          } else if (/chat/gi.test(queryParam)) {
            return defaultChat;
          }
        }
      },
    })),
    {
      type: 'input',
      name: 'newOrderNum',
      message: `How many products should the order contain?`,
      when: (newParamObj) => newParamObj['order'],
      default: () => {
        if (sameQuery) {
          return prevAnswersMap['orderNum'];
        } else {
          return Math.floor(Math.random() * 19 + 1);
        }
      },
    },
    {
      type: 'input',
      name: 'newProductNum',
      message: `How many products should the batchCreate contain?`,
      when: (newParamObj) => newParamObj['products'],
      default: () => {
        if (sameQuery) {
          return prevAnswersMap['productNum'];
        } else {
          return Math.floor(Math.random() * 199 + 1);
        }
      },
    },
  ]);

  if (!!newOrderNum) {
    newParamObj['order'] = defaultOrder(parseInt(newOrderNum));

    prevAnswersMap['orderNum'] = newOrderNum;
  }

  if (!!newProductNum) {
    newParamObj['products'] = defaultProductArr(parseInt(newProductNum));

    prevAnswersMap['productNum'] = newProductNum;
  }

  prevAnswersMap['paramObj'] = newParamObj;

  // ---------------------------------------------------------------------------

  if (!sameQuery) {
    try {
      await fs.writeFile(
        `gqlQueries/${queryName}.graphql`,
        `${queriesObj[queryName]}`
      );
    } catch (err) {
      throw new Error(err);
    }
  }

  try {
    const { stdout } = await exec(
      cmdStrGen(prevAnswersMap['userProfile'], queryName, newParamObj)
    );

    let parsedResponse = JSON.stringify(JSON.parse(stdout), null, 2);

    console.log(parsedResponse);
  } catch (err) {
    throw new Error(err);
  }

  // ---------------------------------------------------------------------------
  // REPEATING THE LOOP
  // ---------------------------------------------------------------------------

  const { askAgain, sameQueryUpdate } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'askAgain',
      message: 'Do you want to run another query (default: YES)?',
      default: true,
    },
    {
      type: 'confirm',
      name: 'sameQueryUpdate',
      message: 'Do you want to run the same query again (default: YES)?',
      when: (answers) => answers.askAgain,
      default: true,
    },
  ]);

  if (askAgain) {
    await repeatQuery(prevAnswersMap, sameQueryUpdate);
  } else {
    console.log('Bye! 👋');
  }
}

main();

// 8049abb1-7c38-40ed-aab7-6a47082f2d0a
