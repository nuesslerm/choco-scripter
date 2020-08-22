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

inquirer
  .prompt({
    type: 'confirm',
    name: 'ghOAuth',
    message: 'Do you want to load queries from GitHub (defaul: NO)?',
    default: false,
  })
  // ---------------------------------------------------------------------------
  .then(({ ghOAuth }) => {
    let globalaAnswersMap = new Map();
    globalaAnswersMap.set('ghOAuth', ghOAuth);

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

        globalaAnswersMap.set('queriesObj', queriesObj);

        inquirer
          .prompt({
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
          })
          // -----------------------------------------------------------------------
          .then(({ queryName }) => {
            const queryParamArr = [
              ...new Set(
                JSON.stringify(queriesObj[queryName]).match(/(\$)\w+/g)
              ),
            ];

            globalaAnswersMap.set('queryName', queryName);
            globalaAnswersMap.set('queryParamArr', queryParamArr);

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
                  when: (paramObj) => paramObj['order'],
                },
                {
                  type: 'input',
                  name: 'productNum',
                  message: `How many products should the batchCreate contain?`,
                  default: Math.floor(Math.random() * 199 + 1),
                  when: (paramObj) => paramObj['products'],
                },
              ])
              // -------------------------------------------------------------------
              .then(async ({ orderNum, productNum, ...paramObj }) => {
                if (!!orderNum) {
                  paramObj['order'] = defaultOrder(parseInt(orderNum));
                }

                if (!!productNum) {
                  paramObj['products'] = defaultProductArr(
                    parseInt(productNum)
                  );
                }

                const { profile: configProfilesObj } = await loadChocoConfig();

                configProfilesArr = Object.values(configProfilesObj);

                const stageSet = new Set();

                for (let configProfile of configProfilesArr) {
                  stageSet.add(configProfile.stage);
                }

                globalaAnswersMap.set('orderNum', orderNum);
                globalaAnswersMap.set('productNum', productNum);
                globalaAnswersMap.set('paramObj', paramObj);

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

                    globalaAnswersMap.set('environment', environment);

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

                        globalaAnswersMap.set('userType', userType);

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
                          // --------------------------------------------------------
                          .then(async ({ userProfile: userProfileStrArr }) => {
                            userProfile = userProfileStrArr.split(': ')[0];

                            globalaAnswersMap.set('userProfile', userProfile);

                            const cmdStrGen = (
                              userProfileIn,
                              queryNameIn,
                              paramObjIn
                            ) =>
                              `choco -p ${userProfileIn} run -d gqlQueries/${queryNameIn}.graphql -v '${JSON.stringify(
                                paramObjIn
                              )}'`;

                            try {
                              await fs.writeFile(
                                `gqlQueries/${queryName}.graphql`,
                                `${queriesObj[queryName]}`
                              );

                              const { stdout } = await exec(
                                cmdStrGen(userProfile, queryName, paramObj)
                              );

                              let parsedResponse = JSON.stringify(
                                JSON.parse(stdout),
                                null,
                                2
                              );

                              console.log(parsedResponse);
                            } catch (err) {
                              throw new Error(err);
                            }

                            repeatQuery(
                              cmdStrGen,
                              queryParamArr,
                              paramObj,
                              orderNum,
                              productNum,
                              globalaAnswersMap
                            );

                            // 8049abb1-7c38-40ed-aab7-6a47082f2d0a
                          });
                      });
                  });
              });
          });
      });
  });

function repeatQuery(
  cmdStrGenerator,
  prevQueryParamArr,
  prevParamObj,
  prevOrderNum,
  prevProductNum,
  prevAnswersMap
) {
  inquirer
    .prompt([
      {
        type: 'confirm',
        name: 'askAgain',
        message: 'Do you want to run the query again (default: YES)?',
        default: true,
      },
      ...prevQueryParamArr.map((queryParam) => ({
        type: 'input',
        name: `${queryParam.slice(1)}`,
        message: `Value for ${queryParam.slice(1)}?`,
        when: (answers) => answers['askAgain'],
        default: () => {
          if (/order/gi.test(queryParam)) {
            return 'OrderInput - auto-generated';
          } else if (/products/gi.test(queryParam)) {
            return '[AdminProductInput] - auto-generated';
          } else {
            return prevParamObj[queryParam.slice(1)];
          }
        },
      })),
      {
        type: 'input',
        name: 'newOrderNum',
        message: `How many products should the order contain?`,
        when: (newParamObj) => newParamObj['order'],
        default: () => prevOrderNum,
      },
      {
        type: 'input',
        name: 'newProductNum',
        message: `How many products should the batchCreate contain?`,
        when: (newParamObj) => newParamObj['products'],
        default: () => prevProductNum,
      },
    ])
    // -------------------------------------------------------------------------
    .then(async ({ askAgain, newOrderNum, newProductNum, ...newParamObj }) => {
      if (askAgain) {
        if (!!newOrderNum) {
          newParamObj['order'] = defaultOrder(parseInt(newOrderNum));
        }

        if (!!newProductNum) {
          newParamObj['products'] = defaultProductArr(parseInt(newProductNum));
        }

        try {
          const { stdout } = await exec(
            cmdStrGenerator(
              prevAnswersMap.get('userProfile'),
              prevAnswersMap.get('queryName'),
              newParamObj
            )
          );

          let parsedResponse = JSON.stringify(JSON.parse(stdout), null, 2);

          console.log(parsedResponse);
        } catch (err) {
          throw new Error(err);
        }

        repeatQuery(
          cmdStrGenerator,
          prevQueryParamArr,
          newParamObj,
          newOrderNum,
          newProductNum,
          prevAnswersMap
        );
      } else {
        console.log('Bye!');
      }
    });
}
