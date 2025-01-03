require('dotenv').config({path: './secrets/.env'});

const express = require('express');
const expressListenersRegistrar = require('../src/apiListeners/registrar');

const logger = require('./classes/core/logger');
const Logger = new logger({
    logLvl: process.env.LOG_LEVEL
});

const dataCollector = require('./classes/core/dataCollector');
const DataCollector = new dataCollector({
    pritunlServerFQDN: process.env.PRITUNL_SERVER_FQDN,
    pritunlServerApiToken: process.env.PRITUNL_SERVER_API_TOKEN,
    pritunlServerApiSecret: process.env.PRITUNL_SERVER_API_SECRET,
    metricsUpdateIntervalSeconds: process.env.DATA_PERIODIC_UPDATE_INTERVAL_SECONDS ?
        Number.parseInt(process.env.DATA_PERIODIC_UPDATE_INTERVAL_SECONDS) :
        30,
    loggerInstance: Logger
});

const metricsObserver = require('./classes/core/prometheusMetricsObserver');
const MetricsObserver = new metricsObserver({
    rawDataCollectorInstance: DataCollector,
    loggerInstance: Logger
});

(async function start() {
    try {
        await Logger.info('App starting...');

        const app = express();
        await Logger.debug('Created Express server instance...');

        await DataCollector.start();
        await Logger.debug('Data collector started...');

        expressListenersRegistrar.registerAllListeners(app, MetricsObserver, Logger);
        await Logger.debug('Metrics endpoint registered...');

        app.listen(Number.parseInt(process.env.PORT));
        await Logger.debug('Express server started, listening on port ' + process.env.PORT + '...');
        await Logger.info('Start sequence completed');
    } catch (err) {
        await Logger.error('The app has failed to start: ' + err.stack);
        await DataCollector.stop();
        process.exit(1);
    }
})();