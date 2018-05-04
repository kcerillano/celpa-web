require('dotenv').load(); // Load .env
const express = require('express');
const favicon = require('serve-favicon');
const path = require('path');
const bodyParser = require("body-parser");

const app = express();

// public assets
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(path.join(__dirname, 'public/images', 'favicon.ico')));
app.use('/coverage', express.static(path.join(__dirname, '..', 'coverage')));

// ejs for view templates
app.engine('.html', require('ejs').__express);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');

app.use(bodyParser.json()); // Support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); //Support encoded bodies

// load route
require('./routes/api')(app); // for apis
require('./routes/webapp')(app); // for webapp

// server
const port = process.env.PORT;
app.server = app.listen(port);
console.log(`listening on port ${port}`);

module.exports = app;
