const express = require('express');
const router = express.Router();
const { loadAccessToken } = require('../helpers/loadAccessToken');

router.get('/', async (req, res) => {
  const rawCode = /code=([^&]*)/.exec(req.url) || null;
  const code = rawCode && rawCode.length > 1 ? rawCode[1] : null;

  if (!code) {
    return res.send({
      success: false,
      message: 'Error: no code',
    });
  }

  await loadAccessToken(code);
});

module.exports = router;
