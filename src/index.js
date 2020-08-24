const inquirer = require('inquirer');
inquirer.registerPrompt('recursive', require('inquirer-recursive'));

const fs = require('fs-extra');
const exec = require('await-exec');
const open = require('open');
const path = require('path');

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

// server entry point
const app = require('../server/app');
const { loadGhQueries } = require('../server/helpers/loadGhQueries');
const getAccessTokenFromDB = require('../server/helpers/getAccessTokenFromDB'); // async function
const getGhQueriesFromDB = require('../server/helpers/getGhQueriesFromDB'); // async function

// loading in environment variables
require('dotenv').config();

// const config =
//   '/Users/nuesslerm/Library/Application Support/gql-playground/config.json';

// const configObj = fs.readJSONSync(config);

const ghClientId = process.env.GH_CLIENT_ID;
const ghClientSecret = process.env.GH_CLIENT_SECRET;
const port = process.env.PORT;

const ghOAuthUrl = `https://github.com/login/oauth/authorize?client_id=${ghClientId}&scope=repo%20read:org`;

const appDir = path.dirname(require.main.filename);

// ---------------------------------------------------------------------------
// DECLARATION OF MAIN METHOD
// ---------------------------------------------------------------------------

async function main() {
  const { ghOAuth } = await inquirer.prompt(ghOAuthQuestions);

  const answersMap = {};
  answersMap['ghOAuth'] = ghOAuth;

  // launching the browser and accessing github OAuth via /oauth/github/callback
  // the rest will be handled by the express server

  if (ghOAuth) {
    const server = app.listen(port, () => {
      // console.log(`Example app listening at http://localhost:${port}`);
      console.log('Loading...');
    });

    let accessToken = await getAccessTokenFromDB();

    if (!accessToken) {
      console.log('No access token found. 🚧 Opening website...');
      await wait(1000);
      await open(ghOAuthUrl);

      while (!accessToken) {
        await wait(2000);

        accessToken = await getAccessTokenFromDB();
      }
    } else {
      try {
        await fs.remove('database/queriesStore.db');
      } catch (err) {
        throw new Error(err);
      }

      // get new gqlQueries here
      await loadGhQueries();

      let allEntries = await getGhQueriesFromDB();

      while (!allEntries) {
        await wait(2000);

        allEntries = await getGhQueriesFromDB();
      }

      console.log('Successfully retrieved GH queries. 💪');
    }

    server.close(() => {
      // console.log('Http server closed.');
    });
  }

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
    userProfileQuestions(userType, userProfileSet)
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

    const allEntries = await getGhQueriesFromDB();

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
        `${appDir}/../gqlQueries/${queryName}.graphql`,
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
