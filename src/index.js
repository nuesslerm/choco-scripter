const inquirer = require('inquirer');
const fs = require('fs-extra');
const opn = require('opn');
const uuid = require('uuid');

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
const { sh } = require('./sh');

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

function isPresent(queryParam) {
  return function (answers) {
    return answers[queryParam];
  };
}

inquirer
  .prompt({
    type: 'confirm',
    name: 'ghOAuth',
    message: 'Do you want to load queries from GitHub?',
    default: false,
  })
  // ---------------------------------------------------------------------------
  .then(({ ghOAuth }) => {
    // launching the browser and accessing github OAuth

    inquirer
      .prompt({
        type: 'list',
        name: 'queryType',
        default: 'Query',
        message: 'What do you want to do?',
        choices: ['Mutation', 'Query'],
        default: 'Mutation',
        filter: function (val) {
          return val.toLowerCase();
        },
      })
      // ---------------------------------------------------------------------------
      .then(async ({ queryType }) => {
        const allEntries = await loadQueriesFromStore();

        const queriesObj = allEntries[queryType];

        inquirer
          .prompt({
            type: 'list',
            name: 'queryName',
            message: 'Which query would you like to execute?',
            choices: Object.keys(queriesObj),
            default: 'orderCreate',
          })
          // -----------------------------------------------------------------------
          .then(({ queryName }) => {
            const queryObj = queriesObj[queryName];

            const queryParamArr = [
              ...new Set(JSON.stringify(queryObj).match(/(\$)\w+/g)),
            ];

            inquirer
              .prompt([
                ...queryParamArr.map((queryParam) => ({
                  type: 'input',
                  name: `${queryParam.slice(1)}`,
                  message: `Value for ${queryParam.slice(1)}?`,
                  default: () => {
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
                  },
                })),
                {
                  type: 'input',
                  name: 'orderNum',
                  message: `How many products should the order contain?`,
                  default: Math.floor(Math.random() * 19 + 1),
                  when: (orderParamObj) => orderParamObj['order'],
                },
                {
                  type: 'input',
                  name: 'productNum',
                  message: `How many products should the batchCreate contain?`,
                  default: Math.floor(Math.random() * 199 + 1),
                  when: (orderParamObj) => orderParamObj['products'],
                },
              ])
              // -------------------------------------------------------------------
              .then(async ({ orderNum, productNum, ...orderParamObj }) => {
                if (orderNum) {
                  orderParamObj['order'] = defaultOrder(parseInt(orderNum));
                }

                if (productNum) {
                  orderParamObj['products'] = defaultProductArr(
                    parseInt(productNum)
                  );
                }

                const { profile: configProfilesObj } = await loadChocoConfig();

                configProfilesArr = Object.values(configProfilesObj);

                const stageSet = new Set();

                for (let configProfile of configProfilesArr) {
                  stageSet.add(configProfile.stage);
                }

                inquirer
                  .prompt({
                    type: 'list',
                    name: 'environment',
                    message: 'Which environment would you like to use?',
                    choices: [...stageSet],
                  })
                  // ---------------------------------------------------------------
                  .then(({ environment }) => {
                    const userTypeSet = new Set();

                    for (let configProfile of configProfilesArr) {
                      if (configProfile.stage === environment) {
                        userTypeSet.add(configProfile.userType);
                      }
                    }

                    inquirer
                      .prompt({
                        type: 'list',
                        name: 'userType',
                        message: 'Which userType would you like to use?',
                        choices: [...userTypeSet],
                      })
                      // -----------------------------------------------------------
                      .then(({ userType }) => {
                        const userProfileSet = new Set();

                        for (let key in configProfilesObj) {
                          if (
                            configProfilesObj[key].stage === environment &&
                            configProfilesObj[key].userType === userType
                          ) {
                            userProfileSet.add({
                              key,
                              userIdentifier:
                                configProfilesObj[key].userIdentifier,
                            });
                          }
                        }

                        inquirer
                          .prompt({
                            type: 'list',
                            name: 'userProfile',
                            message: 'Which profile would you like to use?',
                            choices: [...userProfileSet].map(
                              (profile) =>
                                `${profile.key}: ${profile.userIdentifier}`
                            ),
                          })
                          // -------------------------------------------------------
                          .then(async ({ userProfile: userProfileStrArr }) => {
                            (userProfile = userProfileStrArr.split(': ')[0]),
                              await fs.writeFile(
                                `gqlQueries/${queryName}.graphql`,
                                `${queriesObj[queryName]}`,
                                function (err) {
                                  if (err) throw err;
                                }
                              );

                            // let { stdout } = await sh(
                            //   `choco -p ${userProfile} run -d gqlQueries/${queryName}.graphql -v ${JSON.stringify(
                            //     orderParamObj
                            //   )}`
                            // );
                            // for (let line of stdout.split('\n')) {
                            //   console.log(`ls: ${line}`);
                            // }

                            console.log(
                              // queryName,
                              // queriesObj[queryName],
                              // userProfile,
                              'PARAMS',
                              JSON.stringify(orderParamObj)
                            );
                          });
                      });
                  });
              });
          });
      });
  });
