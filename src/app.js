/**
 * @fileOverview The application itself, Pritunl API metrics exporter for Prometheus
 * @author Alexander Kormilin
 * @version 1.1.2
 */

require('dotenv').config({path: './secrets/.env'});

const express = require('express');
const apiListenersRegistrar = require('./api/registrar');

const logger = require('./classes/core/logger');
const Logger = new logger({
    logLvl: process.env.LOG_LEVEL
});

const metricsDataStorage = require('./classes/datastore/metrics');
const MetricsDataStorage = new metricsDataStorage({
    loggerInstance: Logger
});

const dataCollector = require('./classes/core/dataCollector');
const DataCollector = new dataCollector({
    pritunlServerFQDN: process.env.PRITUNL_SERVER_FQDN,
    pritunlServerApiToken: process.env.PRITUNL_SERVER_API_TOKEN,
    pritunlServerApiSecret: process.env.PRITUNL_SERVER_API_SECRET,
    metricsUpdateIntervalSeconds: process.env.DATA_PERIODIC_UPDATE_INTERVAL_SECONDS ?
        Number.parseInt(process.env.DATA_PERIODIC_UPDATE_INTERVAL_SECONDS) :
        30,
    loggerInstance: Logger,
    metricsDataStorage: MetricsDataStorage
});

const metricsObserver = require('./classes/prometheus/observer');
const MetricsObserver = new metricsObserver({
    rawDataCollectorInstance: DataCollector,
    loggerInstance: Logger
});

(async function start() {
    try {
        await Logger.info('App starting...');

        const App = express();
        await Logger.debug('Created Express server instance...');

        await DataCollector.start();
        await Logger.debug('Data collector started...');

        apiListenersRegistrar.registerAllListeners(App, MetricsObserver, Logger);
        await Logger.debug('Metrics endpoint registered...');

        App.listen(Number.parseInt(process.env.PORT));
        await Logger.debug('Express server started, listening on port ' + process.env.PORT + '...');
        await Logger.info('Start sequence completed');
    } catch (err) {
        await Logger.error('The app has failed to start: ' + err.stack);
        await DataCollector.stop();
        process.exit(1);
    }
})();