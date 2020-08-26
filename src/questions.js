const inquirer = require('inquirer');
const uuid = require('uuid');

const {
  defaultProduct,
  defaultMessage,
  defaultChat,
} = require('./helpers/queryParamDefaults');

const requireLetterNumberLength = (value) => {
  if (/\w/.test(value) && /\d/.test(value) && value.length === 40) {
    return true;
  }

  return "That ain't it chief 🙅‍♂️";
};

const ghClientSecretQuestions = {
  type: 'password',
  message: 'Enter client secret',
  name: 'ghClientSecret',
  mask: '*',
  validate: requireLetterNumberLength,
};

const ghOAuthQuestions = {
  type: 'confirm',
  name: 'ghOAuth',
  message: 'Do you want to load queries from GitHub (defaul: NO)? 🎁',
  default: false,
};

const environmentQuestions = (stagesArr) => ({
  type: 'list',
  name: 'environment',
  message: 'Which environment would you like to use? 🌍',
  choices: stagesArr,
});

const userTypeQuestions = (filteredUserTypeArr) => ({
  type: 'list',
  name: 'type',
  message: 'Which userType would you like to use? 🙋‍♀️',
  choices: filteredUserTypeArr,
});

const userProfileQuestions = (type, filteredProfilesArr) => ({
  type: 'list',
  name: 'profile',
  message: 'Which profile would you like to use? 📚',
  pageSize: 10,
  choices: filteredProfilesArr.concat(
    filteredProfilesArr.length >= 10 ? new inquirer.Separator() : []
  ),
  default: () => {
    if (type === 'admin') {
      return 'admin : Markus';
    } else if (type === 'customer') {
      return 'de-DE Restaurant User : +4930967711750';
    }
  },
});

const queryTypeQuestions = (type) => ({
  type: 'list',
  name: 'queryType',
  default: 'Query',
  message: 'What do you want to do? 🤸‍♀️',
  choices: ['Mutation', 'Query'],
  default: () => {
    if (type === 'admin') {
      return 'Query';
    } else if (type === 'customer') {
      return 'Mutation';
    }
  },
  filter: function (val) {
    return val.toLowerCase();
  },
});

const queryNameQuestions = (queriesObj, queryType) => ({
  type: 'list',
  name: 'queryName',
  message: 'Which query would you like to execute? 🤔',
  pageSize: 10,
  choices: Object.keys(queriesObj).concat(new inquirer.Separator()),
  default: () => {
    if (queryType === 'mutation') {
      return 'orderCreate';
    } else if (queryType === 'query') {
      return 'getChat';
    }
  },
});

const paramObjQuestions = (
  queryParamArr,
  sameQuery,
  prevParamObj,
  prevOrderNums,
  prevProductNum
) => [
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
    type: 'checkbox',
    name: 'newOrderNums',
    message: `How many products should the order contain? 📦`,
    pageSize: 20,
    choices: [
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
      13,
      14,
      15,
      20,
      25,
      30,
      35,
      40,
      45,
      50,
      100,
      150,
      200,
      new inquirer.Separator(),
    ],
    when: (newParamObj) => newParamObj['order'],
    default: () => {
      if (sameQuery) {
        return [...prevOrderNums];
      } else {
        return [Math.floor(Math.random() * 14 + 1)];
      }
    },
    validate: (newOrderNums) => {
      if (newOrderNums.length < 1) {
        return 'You must choose at least one value.';
      }

      return true;
    },
  },
  {
    type: 'input',
    name: 'newProductNum',
    message: `How many products should the batchCreate contain? 🎬`,
    when: (newParamObj) => newParamObj['products'],
    default: () => {
      if (sameQuery) {
        return prevProductNum;
      } else {
        return Math.floor(Math.random() * 199 + 1);
      }
    },
  },
];

const editQueryQuestions1 = {
  type: 'confirm',
  name: 'editQueryBool',
  message: "Do you want to edit the query's response body (default: NO)?",
  default: false,
};

const editQueryQuestions2 = (queryObj) => ({
  type: 'editor',
  name: 'newEditedQueryObj',
  message: 'Please only edit the response body of the query! 🙏',
  default: () => queryObj,
  // validate: function (text) {
  //   if (text.split('\n').length < 3) {
  //     return 'Must be at least 3 lines.';
  //   }

  //   return true;
  // },
});

const askAgainQuestions = [
  {
    type: 'confirm',
    name: 'askAgain',
    message: 'Do you want to run another query (default: YES)? 💪',
    default: true,
  },
  {
    type: 'confirm',
    name: 'sameQueryBoolean',
    message: 'Do you want to run the same query again (default: YES)? 📣',
    when: (answers) => answers.askAgain,
    default: true,
  },
];

module.exports = {
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
};
