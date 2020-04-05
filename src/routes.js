const express = require('express');
const ReportController = require('./controllers/ReportController');

const routes = express.Router();

routes.get('/', ReportController.getReport);
routes.get('/report/latest', ReportController.getReport);

module.exports = routes;