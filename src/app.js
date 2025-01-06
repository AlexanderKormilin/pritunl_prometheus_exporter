/**
 * @fileOverview The application itself, Pritunl API metrics exporter for Prometheus
 * @author Alexander Kormilin
 * @version 1.2.1
 */

require('dotenv').config({path: './secrets/.env'});

const application = require('./classes/app');
const App = new application({
    httpPort: process.env.PORT,
    logLevel: process.env.LOG_LEVEL,
    pritunlServerFQDN: process.env.PRITUNL_SERVER_FQDN,
    pritunlServerApiSecret: process.env.PRITUNL_SERVER_API_SECRET,
    pritunlServerApiToken: process.env.PRITUNL_SERVER_API_TOKEN,
    metricsUpdateIntervalSeconds: process.env.DATA_PERIODIC_UPDATE_INTERVAL_SECONDS
});

(async function start() {
    await App.logger.info('App starting...');
    await App.start();
    await App.logger.info('App started');
})();