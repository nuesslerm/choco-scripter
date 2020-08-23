const express = require('express');
const logger = require('morgan');

const ghCallbackRouter = require('./routes/ghCallback');

// loading in environment variables
const dotenv = require('dotenv');
dotenv.config();

const app = express();
app.use(logger('dev'));
app.use(express.json);
app.use(express.urlencoded({ extended: false }));

app.use('/oauth/github/callback', ghCallbackRouter);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

module.exports = app;
