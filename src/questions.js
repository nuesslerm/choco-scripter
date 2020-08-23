const inquirer = require('inquirer');
const uuid = require('uuid');

const {
  defaultProduct,
  defaultMessage,
  defaultChat,
} = require('./helpers/queryParamDefaults');

const ghOAuthQuestions = {
  type: 'confirm',
  name: 'ghOAuth',
  message: 'Do you want to load queries from GitHub (defaul: NO)? 🎁',
  default: false,
};

const environmentQuestions = (stageSet) => ({
  type: 'list',
  name: 'environment',
  message: 'Which environment would you like to use? 🌍',
  choices: [...stageSet],
});

const userTypeQuestions = (userTypeSet) => ({
  type: 'list',
  name: 'userType',
  message: 'Which userType would you like to use? 🙋‍♀️',
  choices: [...userTypeSet],
});

const userProfileQuestions = (userProfileSet) => ({
  type: 'list',
  name: 'userProfile',
  message: 'Which profile would you like to use? 📚',
  pageSize: 10,
  choices: [...userProfileSet]
    .map((profile) => `${profile.key}: ${profile.userIdentifier}`)
    .concat(userProfileSet.size >= 10 ? new inquirer.Separator() : []),
});

const queryTypeQuestions = {
  type: 'list',
  name: 'queryType',
  default: 'Query',
  message: 'What do you want to do? 🤸‍♀️',
  choices: ['Mutation', 'Query'],
  default: 'Mutation',
  filter: function (val) {
    return val.toLowerCase();
  },
};

const queryNameQuestions = (queryType, queriesObj) => ({
  type: 'list',
  name: 'queryName',
  message: 'Which query would you like to execute? 🤔',
  pageSize: 10,
  choices: Object.keys(queriesObj).concat(new inquirer.Separator()),
  default: () => {
    if (queryType === 'mutation') {
      return 'orderCreate';
    } else {
      return 'getChat';
    }
  },
});

const paramObjQuestions = (
  queryParamArr,
  sameQuery,
  prevParamObj,
  prevAnswersMap
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
  // {
  //   type: 'input',
  //   name: 'newOrderNums',
  //   message: `How many products should the order contain?`,
  //   when: (newParamObj) => newParamObj['order'],
  //   default: () => {
  //     if (sameQuery) {
  //       return prevAnswersMap['orderNums'];
  //     } else {
  //       return Math.floor(Math.random() * 19 + 1);
  //     }
  //   },
  // },
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
        return [...prevAnswersMap['orderNums']];
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
        return prevAnswersMap['productNum'];
      } else {
        return Math.floor(Math.random() * 199 + 1);
      }
    },
  },
];

const askAgainQuestions = [
  {
    type: 'confirm',
    name: 'askAgain',
    message: 'Do you want to run another query (default: YES)? 💪',
    default: true,
  },
  {
    type: 'confirm',
    name: 'sameQueryUpdate',
    message: 'Do you want to run the same query again (default: YES)? 📣',
    when: (answers) => answers.askAgain,
    default: true,
  },
];

module.exports = {
  ghOAuthQuestions,
  environmentQuestions,
  userTypeQuestions,
  userProfileQuestions,
  queryTypeQuestions,
  queryNameQuestions,
  paramObjQuestions,
  askAgainQuestions,
};
