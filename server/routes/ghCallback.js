const express = require('express');
const router = express.Router();
const loadAccessToken = require('../helpers/loadAccessToken');
const loadGhQueries = require('../helpers/loadGhQueries');

router.get('/', async (req, res, next) => {
  const rawCode = /code=([^&]*)/.exec(req.url) || null;
  const code = rawCode && rawCode.length > 1 ? rawCode[1] : null;

  if (!code) {
    return res.send({
      success: false,
      message: 'Error: no code',
    });
  }

  await loadAccessToken(code);

  await loadGhQueries();

  res.render('index', {
    title: 'Successfully retrieved GH queries. 💪',
    body: 'You can close this page and return to the terminal! 💻',
  });
  // res.send({
  //   success: true,
  //   message: 'AccessToken fetched!',
  // });
});

module.exports = router;
