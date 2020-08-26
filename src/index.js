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
  editQueryQuestions1,
  editQueryQuestions2,
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

  let ghClientSecret = await getGHClientSecret_DB();

  if (!ghClientSecret) {
    console.log('Please provide the client secret first. 🙏');
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

  const { profile: chocoProfiles } = await loadChocoConfig();

  const stagesArr = Object.values(chocoProfiles).reduce(
    (unique, { stage }) =>
      unique.includes(stage) ? unique : [...unique, stage],
    []
  );

  // ---------------------------------------------------------------------------

  const { environment } = await inquirer.prompt(
    environmentQuestions(stagesArr)
  );

  const filteredUserTypeArr = Object.values(chocoProfiles)
    .filter(({ stage }) => stage === environment)
    .reduce(
      (unique, { userType }) =>
        unique.includes(userType) ? unique : [...unique, userType],
      []
    );

  // ---------------------------------------------------------------------------

  const { type } = await inquirer.prompt(
    userTypeQuestions(filteredUserTypeArr)
  );

  const filteredProfilesArr = Object.entries(chocoProfiles)
    .filter(
      ([__, { stage, userType }]) => stage === environment && userType === type
    )
    .map(([profile, { userIdentifier }]) => `${profile} : ${userIdentifier}`);

  // ---------------------------------------------------------------------------

  const { profile: userProfileStr } = await inquirer.prompt(
    userProfileQuestions(type, filteredProfilesArr)
  );

  profile = userProfileStr.split(' : ')[0];

  // ---------------------------------------------------------------------------
  // START OF RECURSION
  // ---------------------------------------------------------------------------

  await repeatQuery({ type, profile }, false);
}

// ---------------------------------------------------------------------------
// RECURSIVE FUNCTION
// ---------------------------------------------------------------------------

async function repeatQuery(answersObj, sameQueryBool) {
  let {
    type,
    profile,
    queriesObj,
    queryName,
    queryObj,
    paramObj: prevParamObj,
    orderNums: prevOrderNums,
    productNum: prevProductNum,
    editedQueryObj: prevEditedQueryObj,
  } = answersObj;

  let orderParamsArr = [];
  let newEditedQueryObj;

  if (!sameQueryBool) {
    const { queryType } = await inquirer.prompt(queryTypeQuestions(type));

    queriesObj = (await getGhQueries_DB())[queryType];

    // ---------------------------------------------------------------------------

    ({ queryName } = await inquirer.prompt(
      queryNameQuestions(queriesObj, queryType)
    ));

    queryObj = queriesObj[queryName];
  }

  queryParamArr = [...new Set(JSON.stringify(queryObj).match(/(\$)\w+/g))];

  // ---------------------------------------------------------------------------

  const { newOrderNums, newProductNum, ...newParamObj } = await inquirer.prompt(
    paramObjQuestions(
      queryParamArr,
      sameQueryBool,
      prevParamObj,
      prevOrderNums,
      prevProductNum
    )
  );

  if (!!newOrderNums) {
    let { order, ...rest } = newParamObj;

    // map creates a new array with each element being the result of the callback function
    orderParamsArr = newOrderNums.map((orderNum) => ({
      ...rest,
      order: defaultOrder(parseInt(orderNum)),
    }));
  }

  if (!!newProductNum) {
    newParamObj['products'] = defaultAdminProductArr(parseInt(newProductNum));
  }

  // ---------------------------------------------------------------------------

  const { editQueryBool } = await inquirer.prompt(editQueryQuestions1);

  if (editQueryBool) {
    ({ newEditedQueryObj } = await inquirer.prompt(
      editQueryQuestions2(queryObj, queryParamArr)
    ));
  } else if (!sameQueryBool) {
    newEditedQueryObj = queryObj;
  } else {
    newEditedQueryObj = prevEditedQueryObj;
  }

  // ---------------------------------------------------------------------------

  // writing .graphql file to temp folder in database
  try {
    await fs.outputFile(
      `${appDir}/../database/temp/${queryName}.graphql`,
      `${newEditedQueryObj ? newEditedQueryObj : queryObj}`
    );
  } catch (err) {
    throw new Error(err);
  }

  try {
    if (!!orderParamsArr.length) {
      for (let orderParams of orderParamsArr) {
        // placing an order
        const { stdout } = await exec(
          cmdStrGen(profile, queryName, orderParams)
        );

        // console.logging response from BE
        console.log(JSON.stringify(JSON.parse(stdout), null, 2));

        // wait 1s
        await wait(1000);
      }
    } else {
      const { stdout } = await exec(cmdStrGen(profile, queryName, newParamObj));

      console.log(JSON.stringify(JSON.parse(stdout), null, 2));
    }
  } catch (err) {
    throw new Error(err);
  }

  // ---------------------------------------------------------------------------
  // REPEATING THE LOOP
  // ---------------------------------------------------------------------------

  const { askAgain, sameQueryBoolean } = await inquirer.prompt(
    askAgainQuestions
  );

  if (askAgain) {
    await repeatQuery(
      {
        type,
        profile,
        queriesObj,
        queryName,
        queryObj,
        paramObj: newParamObj,
        orderNums: newOrderNums,
        productNum: newProductNum,
        editedQueryObj: newEditedQueryObj,
      },
      sameQueryBoolean
    );
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
