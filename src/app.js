/**
 * @fileOverview The wrapper used to instantiate App, pass arguments it needs and start it
 * @author Alexander Kormilin
 * @version 1.2.2
 */

require('dotenv').config({path: './secrets/.env'});

const application = require('./classes/app');
const App = new application({
    httpPort: process.env.PORT,
    logLevel: process.env.LOG_LEVEL,
    pritunlServerFQDN: process.env.PRITUNL_SERVER_FQDN,
    pritunlServerApiSecret: process.env.PRITUNL_SERVER_API_SECRET,
    pritunlServerApiToken: process.env.PRITUNL_SERVER_API_TOKEN,
    pritunlServerCaPath: process.env.PRITUNL_SERVER_CA_PATH,
    metricsUpdateIntervalSeconds: process.env.DATA_PERIODIC_UPDATE_INTERVAL_SECONDS
});

(async function start() {
    await App.logger.info('App starting...');
    await App.start();
    await App.logger.info('App started');
})();