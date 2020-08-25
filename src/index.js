const inquirer = require('inquirer');
inquirer.registerPrompt('recursive', require('inquirer-recursive'));

const fs = require('fs-extra');
const exec = require('await-exec');
const open = require('open');
const path = require('path');

const appDir = path.dirname(require.main.filename);

const { loadChocoConfig } = require('./helpers/loadChocoConfig');
const {
  defaultOrder,
  defaultAdminProductArr,
} = require('./helpers/queryParamDefaults');
const {
  ghClientSecretQuestions,
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
const setGHClientSecret_DB = require('./helpers/setGHClientSecret_DB');
const getGHClientSecret_DB = require('./helpers/getGHClientSecret_DB');

// server entry point
const app = require('../server/app');
const loadGhQueries = require('../server/helpers/loadGhQueries');
const getAccessToken_DB = require('../server/helpers/getAccessToken_DB'); // async function
const getGhQueries_DB = require('../server/helpers/getGhQueries_DB'); // async function

// loading in environment variables
require('dotenv').config();

// const config =
//   '/Users/nuesslerm/Library/Application Support/gql-playground/config.json';

// const configObj = fs.readJSONSync(config);

const ghClientId = '2635e4b2a3d9838e4328';
const port = 1313;

const ghOAuthUrl = `https://github.com/login/oauth/authorize?client_id=${ghClientId}&scope=repo%20read:org`;

// ---------------------------------------------------------------------------
// DECLARATION OF MAIN METHOD
// ---------------------------------------------------------------------------

async function main() {
  // console.log(appDir);

  const { ghOAuth } = await inquirer.prompt(ghOAuthQuestions);

  const answersMap = {};
  answersMap['ghOAuth'] = ghOAuth;

  let ghClientSecret = await getGHClientSecret_DB();

  if (!ghClientSecret) {
    console.log('Please provide the oauth client secret first. 🙏');
    await wait(1000);

    const { ghClientSecret } = await inquirer.prompt(ghClientSecretQuestions);

    await setGHClientSecret_DB(ghClientSecret);
  }

  // get queries from DB
  let allEntries = await getGhQueries_DB();

  // check "load queries" response and check if some queries exist in the DB
  if (ghOAuth || !allEntries) {
    const server = app.listen(port, () => {
      // console.log(`Example app listening at http://localhost:${port}`);
      console.log('Loading...');
    });
    await wait(1000);

    let accessToken = await getAccessToken_DB();

    if (!accessToken) {
      // launching the browser and accessing github OAuth via /oauth/github/callback
      // the response is handled by the express server
      console.log('No access token found. 🚧 Opening website...');
      await wait(1000);
      await open(ghOAuthUrl);

      while (!accessToken) {
        await wait(2000);

        accessToken = await getAccessToken_DB();
      }
    } else {
      try {
        await fs.remove(`${appDir}/../database/queriesStore.db`);
      } catch (err) {
        throw new Error(err);
      }

      // get new gqlQueries here
      await loadGhQueries();

      // get queries again from DB if they already exist
      let allEntries = await getGhQueries_DB();

      while (!allEntries) {
        await wait(2000);

        allEntries = await getGhQueries_DB();
      }

      console.log('Successfully retrieved GH queries. 💪');
      wait(1000);
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

    const allEntries = await getGhQueries_DB();

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
      await fs.outputFile(
        `${appDir}/../database/temp/${queryName}.graphql`,
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
    try {
      await fs.emptyDir(`${appDir}/../database/temp`);
    } catch (err) {
      throw new Error(err);
    }
    console.log('Bye! 👋');
  }
}

main();
