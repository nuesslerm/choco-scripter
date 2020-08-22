const uuid = require('uuid');

const defaultOrder = (num) => ({
  body: `Order ${Date.now()}`,
  deliveryDate: 1600002000000,
  orderProducts: [...Array(num)].map(() => ({
    amount: Math.floor(Math.random() * 19 + 1),
    product: {
      id: uuid.v4(),
      name: `product ${uuid.v4()}`,
      unit: 'kg',
    },
  })),
});

const defaultProductArr = (num) =>
  [...Array(num)].map(() => ({
    id: uuid.v4(),
    name: `product ${uuid.v4()}`,
    unit: 'kg',
  }));

const defaultProduct = {
  id: uuid.v4(),
  name: `product ${uuid.v4()}`,
  unit: 'kg',
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

module.exports = {
  defaultOrder,
  defaultProductArr,
  defaultProduct,
  defaultMessage,
  defaultChat,
};
