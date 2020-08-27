const uuid = require('uuid');
const _ = require('lodash');
const faker = require('faker');
const getUser_DB = require('./getUser_DB');

const defaultOrder = (num) => {
  if (num <= 0) num = 1;
  return {
    body: `Order ${Date.now()}`,
    deliveryDate: Date.now(),
    orderProducts: [...Array(num)].map((product, i) => ({
      amount: Math.floor(Math.random() * 19 + 1),
      product: {
        id: uuid.v4(),
        name: `Product #${i + 1}`,
        unit: _.sample(['kg', 'litre', 'case', 'CA', 'box']),
        externalId: `${uuid.v4().slice(0, 6)}`,
        par: Math.floor(Math.random() * 19 + 19),
      },
    })),
  };
};

const defaultAdminProductArr = (num) => {
  if (num <= 0) num = 1;
  return [...Array(num)].map((product, i) => ({
    // id: uuid.v4(), <- not defined for input object type 'AdminProductInput'
    name: `Product #${i + 1} ${uuid.v4().slice(0, 5)}`,
    unit: _.sample(['kg', 'litre', 'case', 'CA', 'box']),
    externalId: `${uuid.v4().slice(0, 6)}`,
    par: Math.floor(Math.random() * 19 + 19),
  }));
};

const defaultProduct = {
  id: uuid.v4(),
  name: `Product ${uuid.v4().slice(0, 5)}`,
  unit: _.sample(['kg', 'litre', 'case', 'CA', 'box']),
  externalId: `${uuid.v4().slice(0, 6)}`,
  par: Math.floor(Math.random() * 19 + 19),
};

const defaultMessage = {
  id: uuid.v4(),
  body: 'Hello there!',
  media: false,
};

const defaultChat = async (env, participantsNum) => {
  const userArr = await getUser_DB(env);
  const mappedUserArr = userArr.map(({ user }) => user);

  const filteredUserIdsArr = mappedUserArr.reduce(
    (unique, { id }) => (unique.includes(id) ? unique : [...unique, id]),
    []
  );

  const filteredSupplierIdsArr = mappedUserArr
    .filter(({ supplier }) => supplier === true)
    .reduce(
      (unique, { id }) => (unique.includes(id) ? unique : [...unique, id]),
      []
    );

  return {
    userIds: _.sampleSize(filteredUserIdsArr, participantsNum),
    chatName: faker.company.catchPhrase(),
    restaurantName: faker.company.companyName(),
    deliveryAddress: faker.address.streetAddress(),
    customerNumber: '0123456789',
    supplierId: _.sample(filteredSupplierIdsArr),
  };
};

const defaultUser = (isSupplier) => ({
  id: uuid.v4(),
  name: faker.name.findName(),
  phone: faker.phone.phoneNumber('+49163296####'),
  email: faker.internet
    .email()
    .toLowerCase()
    .replace(/(\@\w+\.\w+)/gi, '@choco.com'),
  businessName: faker.company.companyName(),
  cutOffTime: '6pm',
  deliveryCosts: '$100',
  minOrderAmount: '5kg',
  position: faker.company.catchPhraseDescriptor(),
  chocoUser: true,
  supplier: isSupplier,
  locale: _.sample(['de-DE', 'en-US', 'fr-FR', 'es-ES', 'pt-BR', 'it-IT']),
});

module.exports = {
  defaultOrder,
  defaultAdminProductArr,
  defaultProduct,
  defaultMessage,
  defaultChat,
  defaultUser,
};
