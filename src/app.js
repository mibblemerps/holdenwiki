import logger from 'morgan';
import createError from 'http-errors';
import express from 'express';
import cookieParser from 'cookie-parser';
import env from './env.js';

import indexRouter from './routes/index.js';
import docsRouter from './routes/docs.js';

var app = express();

// view engine setup
app.set('env', env.ENVIRONMENT);
app.set('views', 'views');
app.set('view engine', 'ejs');

app.use(logger(env.ENVIRONMENT));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static('public'));

//app.use('/', indexRouter);
app.get('/', (req, res) => { res.redirect('/docs/Main Menu'); })
app.use('/docs', docsRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.listen(env.PORT, '0.0.0.0');
console.log('Web server listening on port ' + env.PORT);
