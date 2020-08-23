const express = require('express');
const router = express.Router();
const { loadAccessToken } = require('../helpers/loadAccessToken');

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

  // res.send({
  //   success: true,
  //   message: 'AccessToken fetched!',
  // });
  res.render('index', {
    title: 'Successfully retrieved GH queries. 💪',
    body: 'You can close this page and return to the terminal! 💻',
  });
});

module.exports = router;
