const express = require('express');
const router = express.Router();

/* GET hello world response. */
router.get('/', (req, res, next) => {
  res.send('Hello World!');
  res.render('index', { title: 'Hello World!' });
});

module.exports = router;
