/**
 * @fileOverview Exactly what it sounds like - the application itself
 * @author Alexander Kormilin
 * @version 1.2.0
 */

const express = require('express');
const apiListenersRegistrar = require('../api/registrar');

const logger = require('./core/logger');
const metricsDataStorage = require('./datastore/metrics');
const dataCollector = require('./core/dataCollector');
const metricsObserver = require('./prometheus/observer');

class Application {
    constructor() {

        this.logger = new logger({
            logLvl: process.env.LOG_LEVEL
        });

        this.metricsDataStorage = new metricsDataStorage({
            loggerInstance: this.logger
        });

        this.dataCollector = new dataCollector({
            pritunlServerFQDN: process.env.PRITUNL_SERVER_FQDN,
            pritunlServerApiToken: process.env.PRITUNL_SERVER_API_TOKEN,
            pritunlServerApiSecret: process.env.PRITUNL_SERVER_API_SECRET,
            metricsUpdateIntervalSeconds: process.env.DATA_PERIODIC_UPDATE_INTERVAL_SECONDS ?
                Number.parseInt(process.env.DATA_PERIODIC_UPDATE_INTERVAL_SECONDS) :
                30,
            loggerInstance: this.logger,
            metricsDataStorage: this.metricsDataStorage
        });

        this.metricsObserver = new metricsObserver({
            rawDataCollectorInstance: this.dataCollector,
            loggerInstance: this.logger
        });
    };

    async start() {
        try {
            await this.logger.info('App starting...');

            const App = express();
            await this.logger.debug('Created Express server instance...');

            await this.dataCollector.start();
            await this.logger.debug('Data collector started...');

            apiListenersRegistrar.registerAllListeners(App, this.metricsObserver, this.logger);
            await this.logger.debug('Metrics endpoint registered...');

            App.listen(Number.parseInt(process.env.PORT));
            await this.logger.debug('Express server started, listening on port ' + process.env.PORT + '...');
            await this.logger.info('Start sequence completed');
        } catch (err) {
            await this.logger.error('The app has failed to start: ' + err.stack);
            await this.dataCollector.stop();
            process.exit(1);
        }
    }

}

module.exports = Application;