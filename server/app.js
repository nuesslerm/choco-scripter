const express = require('express');
const path = require('path');
const logger = require('morgan');

const indexRouter = require('./routes/index');
const ghCallbackRouter = require('./routes/ghCallback');

// loading in environment variables
require('dotenv').config();

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// app.use(logger('dev'));
// app.use(express.json);
// app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// -----------------------------------------------------------------------------
// DEFINE ROUTES
// -----------------------------------------------------------------------------

app.get('/favicon.ico', (req, res) => res.status(204));

app.use('/', indexRouter);
app.use('/oauth/github/callback', ghCallbackRouter);

// -----------------------------------------------------------------------------
// EXPRESS ERROR HANDLER
// -----------------------------------------------------------------------------

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// -----------------------------------------------------------------------------
// EXPORT EXPRESS APP
// -----------------------------------------------------------------------------

module.exports = app;
