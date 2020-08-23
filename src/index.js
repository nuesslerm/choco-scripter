const inquirer = require('inquirer');
inquirer.registerPrompt('recursive', require('inquirer-recursive'));

const fs = require('fs-extra');
const opn = require('opn');
const exec = require('await-exec');

const { loadGhQueries } = require('../server/loadGhQueries');
const db = require('../server/db');
const { loadQueriesFromStore } = require('./helpers/loadQueriesFromStore');
const { loadChocoConfig } = require('./helpers/loadChocoConfig');
const {
  defaultOrder,
  defaultAdminProductArr,
} = require('./helpers/queryParamDefaults');
const {
  ghOAuthQuestions,
  environmentQuestions,
  userTypeQuestions,
  userProfileQuestions,
  queryTypeQuestions,
  queryNameQuestions,
  paramObjQuestions,
  askAgainQuestions,
} = require('./questions');
const { cmdStrGen, wait } = require('./helpers/misc');

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
  const { ghOAuth } = await inquirer.prompt(ghOAuthQuestions);

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

  const { environment } = await inquirer.prompt(environmentQuestions(stageSet));

  answersMap['environment'] = environment;

  const userTypeSet = new Set();

  for (let configProfile of configProfilesArr) {
    if (configProfile.stage === environment) {
      userTypeSet.add(configProfile.userType);
    }
  }

  // ---------------------------------------------------------------------------

  const { userType } = await inquirer.prompt(userTypeQuestions(userTypeSet));

  answersMap['userType'] = userType;

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

  // ---------------------------------------------------------------------------

  const { userProfile: userProfileStrArr } = await inquirer.prompt(
    userProfileQuestions(userProfileSet)
  );

  userProfile = userProfileStrArr.split(': ')[0];

  answersMap['userProfile'] = userProfile;

  // ---------------------------------------------------------------------------
  // START OF RECURSION
  // ---------------------------------------------------------------------------

  await repeatQuery(answersMap, false);
}

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
  const newOrderParamObjArr = [];

  if (!sameQuery) {
    const { queryType } = await inquirer.prompt(queryTypeQuestions);

    const allEntries = await loadQueriesFromStore();

    queriesObj = allEntries[queryType];

    prevAnswersMap['queriesObj'] = queriesObj;

    // ---------------------------------------------------------------------------

    ({ queryName } = await inquirer.prompt(
      queryNameQuestions(queryType, queriesObj)
    ));

    queryParamArr = [
      ...new Set(JSON.stringify(queriesObj[queryName]).match(/(\$)\w+/g)),
    ];

    prevAnswersMap['queryName'] = queryName;
    prevAnswersMap['queryParamArr'] = queryParamArr;
  }

  // ---------------------------------------------------------------------------

  const { newOrderNums, newProductNum, ...newParamObj } = await inquirer.prompt(
    paramObjQuestions(queryParamArr, sameQuery, prevParamObj, prevAnswersMap)
  );

  if (!!newOrderNums) {
    let { order, ...rest } = newParamObj;

    for (let orderNum of newOrderNums) {
      newOrderParamObjArr.push({
        ...rest,
        order: defaultOrder(parseInt(orderNum)),
      });
    }

    prevAnswersMap['orderNums'] = newOrderNums;
  }

  if (!!newProductNum) {
    newParamObj['products'] = defaultAdminProductArr(parseInt(newProductNum));

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
    if (!!newOrderParamObjArr.length) {
      for (let orderParamObj of newOrderParamObjArr) {
        // placing an order
        const { stdout } = await exec(
          cmdStrGen(prevAnswersMap['userProfile'], queryName, orderParamObj)
        );

        // console.logging response from BE
        console.log(JSON.stringify(JSON.parse(stdout), null, 2));

        // wait 1s
        await wait(1000);
      }
    } else {
      const { stdout } = await exec(
        cmdStrGen(prevAnswersMap['userProfile'], queryName, newParamObj)
      );

      console.log(JSON.stringify(JSON.parse(stdout), null, 2));
    }
  } catch (err) {
    throw new Error(err);
  }

  // ---------------------------------------------------------------------------
  // REPEATING THE LOOP
  // ---------------------------------------------------------------------------

  const { askAgain, sameQueryUpdate } = await inquirer.prompt(
    askAgainQuestions
  );

  if (askAgain) {
    await repeatQuery(prevAnswersMap, sameQueryUpdate);
  } else {
    console.log('Bye! 👋');
  }
}

main();

// 8049abb1-7c38-40ed-aab7-6a47082f2d0a
