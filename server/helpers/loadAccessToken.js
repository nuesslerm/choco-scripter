const axios = require('axios');
const db = require('../db');
// querystring is used to stringify and parse objects into/from REST request/response data
const querystring = require('querystring');

const getGHClientSecret_DB = require('../../src/helpers/getGHClientSecret_DB');

// loading in environment variables (needs to be loaded into every file where they are used?)
require('dotenv').config();

const loadAccessToken = async (code) => {
  const ghClientId = '2635e4b2a3d9838e4328';
  const ghClientSecret = await getGHClientSecret_DB();

  const postData = querystring.stringify({
    client_id: ghClientId,
    client_secret: ghClientSecret,
    code,
  });

  const response = await axios.post(
    'https://github.com/login/oauth/access_token',
    postData,
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': postData.length,
      },
    }
  );

  const data = querystring.parse(response.data);

  try {
    await db.gitHubStore.update(
      { __id: 'accessToken' },
      { __id: 'accessToken', accessToken: data.access_token },
      { upsert: true }
    );
  } catch (err) {
    throw new Error(err);
  }
};

module.exports = loadAccessToken;
