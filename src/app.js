/**
 * @fileOverview The application itself, Pritunl API metrics exporter for Prometheus
 * @author Alexander Kormilin
 * @version 1.2.0
 */

require('dotenv').config({path: './secrets/.env'});

const application = require('./classes/app');
const App = new application();

(async function start() {
    await App.start();
    await App.logger.info('App started');
})();