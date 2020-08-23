const express = require('express');
const router = express.Router();

/* GET hello world response. */
router.get('/', (req, res, next) => {
  res.render('index', { title: 'Hello World!' });
  // res.send('Hello World!');
});

module.exports = router;
