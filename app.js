var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const { swaggerUi, specs } = require('./swagger');


var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var categoriesRouter = require('./routes/categories');
var sousCategoriesRouter = require('./routes/souscategories');
var comptesRouter = require('./routes/comptes');
var tiersRouter = require('./routes/tiers');
var mouvementsRouter = require('./routes/mouvements');
const virementsRouter = require('./routes/virements');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/api/users', usersRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/souscategories', sousCategoriesRouter);
app.use('/api/comptes', comptesRouter);
app.use('/api/tiers', tiersRouter);
app.use('/api/mouvements', mouvementsRouter);
app.use('/api/virements', virementsRouter);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));


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

module.exports = app;
