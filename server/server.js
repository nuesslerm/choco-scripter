const express = require('express');
const axios = require('axios');
const querystring = require('querystring');
const dotenv = require('dotenv');
const db = require('./db.js');

dotenv.config();

const ghClientId = process.env.GH_CLIENT_ID;
const ghClientSecret = process.env.GH_CLIENT_SECRET;

const app = express();
const port = 1313;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/oauth/github/callback', async (req, res) => {
  const rawCode = /code=([^&]*)/.exec(req.url) || null;
  const code = rawCode && rawCode.length > 1 ? rawCode[1] : null;

  if (!code) {
    return res.send({
      success: false,
      message: 'Error: no code',
    });
  }

  // POST
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

  db.gitHubStore.insert({ accessToken: data.access_token }, (err) => {
    console.log(err);
  });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
