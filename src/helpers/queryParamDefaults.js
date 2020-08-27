const uuid = require('uuid');
const _ = require('lodash');
const faker = require('faker');

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

const defaultChat = {
  userIds: [
    'af1457f7-508f-46d0-ae1d-d52abac20c2e',
    'edc3743e-0910-4a4f-9dc9-95d88733b820',
  ],
  chatName: 'support chat now1',
  restaurantName: 'resto test',
  customerNumber: 'delivery test',
  supplierId: '3dd6d61e-01dc-4403-bda8-54c15d3926b4',
};

const defaultUser = (isSupplier) => ({
  id: uuid.v4(),
  name: faker.name.findName(),
  phone: faker.phone.phoneNumber('+49###########'),
  email: faker.internet.email(),
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
