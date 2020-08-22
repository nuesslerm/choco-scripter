const inquirer = require('inquirer');
inquirer.registerPrompt('recursive', require('inquirer-recursive'));

const fs = require('fs-extra');
const opn = require('opn');

const exec = require('await-exec');

const { loadGhQueries } = require('../server/loadGhQueries');
const db = require('../server/db');
const { loadQueriesFromStore } = require('./loadQueriesFromStore');
const { loadChocoConfig } = require('./loadChocoConfig');
const {
  defaultOrder,
  defaultAdminProductArr,
} = require('./queryParamDefaults');
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

  const { newOrderNum, newProductNum, ...newParamObj } = await inquirer.prompt(
    paramObjQuestions(queryParamArr, sameQuery, prevParamObj, prevAnswersMap)
  );

  if (!!newOrderNum) {
    newParamObj['order'] = defaultOrder(parseInt(newOrderNum));

    prevAnswersMap['orderNum'] = newOrderNum;
  }

  if (!!newProductNum) {
    newParamObj['products'] = defaultAdminProductArr(parseInt(newProductNum));

    prevAnswersMap['productNum'] = newProductNum;
  }

  console.log(newParamObj['products']);

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
