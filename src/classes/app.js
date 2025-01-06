/**
 * @fileOverview Exactly what it sounds like - the application itself
 * @author Alexander Kormilin
 * @version 1.2.2
 */

const logger = require('./core/logger');
const express = require('express');
const apiListenersRegistrar = require('../api/registrar');
const metricsDataStorage = require('./datastore/metrics');
const dataCollector = require('./core/dataCollector');
const metricsObserver = require('./prometheus/observer');

class Application {
    constructor({
        httpPort,
        logLevel,
        pritunlServerFQDN,
        pritunlServerApiToken,
        pritunlServerApiSecret,
        metricsUpdateIntervalSeconds,
    }) {
        this.httpPort = httpPort;
        this.logger = new logger({
            logLvl: logLevel
        });
        this.metricsDataStorage = new metricsDataStorage({
            loggerInstance: this.logger
        });
        this.dataCollector = new dataCollector({
            pritunlServerFQDN: pritunlServerFQDN,
            pritunlServerApiToken: pritunlServerApiToken,
            pritunlServerApiSecret: pritunlServerApiSecret,
            metricsUpdateIntervalSeconds: Number.parseInt(metricsUpdateIntervalSeconds),
            loggerInstance: this.logger,
            metricsDataStorage: this.metricsDataStorage
        });
        this.metricsObserver = new metricsObserver({
            loggerInstance: this.logger,
            metricsDataStorage: this.metricsDataStorage
        });
    };

    async start() {
        try {
            const App = express();
            await this.logger.debug('Created Express server instance...');

            await this.dataCollector.start();
            await this.logger.debug('Data collector started...');

            apiListenersRegistrar.registerAllListeners(App, this.metricsObserver, this.logger);
            await this.logger.debug('Metrics endpoint registered...');

            App.listen(Number.parseInt(process.env.PORT));
            await this.logger.debug('Express server started, listening on port ' + Number.parseInt(this.httpPort) + '...');
            await this.logger.info('Start sequence completed');
        } catch (err) {
            await this.logger.error('The app has failed to start: ' + err.stack);
            await this.dataCollector.stop();
            process.exit(1);
        }
    }

}

module.exports = Application;