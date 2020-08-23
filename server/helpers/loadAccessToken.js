const axios = require('axios');
const db = require('../db');
// querystring is used to stringify and parse objects into/from REST request/response data
const querystring = require('querystring');

// loading in environment variables (needs to be loaded into every file where they are used?)
const dotenv = require('dotenv');
dotenv.config();

const ghClientId = process.env.GH_CLIENT_ID;
const ghClientSecret = process.env.GH_CLIENT_SECRET;

const loadAccessToken = async (code) => {
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

  await db.gitHubStore.insert({ accessToken: data.access_token }, (err) => {
    if (err) throw err;
  });
};

module.exports = { loadAccessToken };
