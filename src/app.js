require('dotenv').config({path: './secrets/.env'});
const express = require('express');
const expressListenersRegistrar = require('../src/apiListeners/registrar');

const rawDataCollector = require('./classes/core/dataCollector');
const RawDataCollector = new rawDataCollector({
    pritunlServerFQDN: process.env.PRITUNL_SERVER_FQDN,
    pritunlServerApiToken: process.env.PRITUNL_SERVER_API_TOKEN,
    pritunlServerApiSecret: process.env.PRITUNL_SERVER_API_SECRET,
    metricsUpdateIntervalSeconds: process.env.DATA_PERIODIC_UPDATE_INTERVAL_SECONDS ?
     Number.parseInt(process.env.DATA_PERIODIC_UPDATE_INTERVAL_SECONDS) :
     30
});

const metricsObserver = require('./classes/core/prometheusMetricsObserver');

(async function start() {
    try {
        console.log('Starting...');

        const app = express();
        console.log('Created Express server instance...');

        await RawDataCollector.start();
        console.log('Data collector started...');

        const MetricsObserver = new metricsObserver({
            rawDataCollectorInstance: RawDataCollector
        });
        console.log('Prometheus metrics observer initialized...');

        expressListenersRegistrar.registerAllListeners(app, MetricsObserver);
        console.log('Metrics endpoint registered...');

        app.listen(Number.parseInt(process.env.PORT));
        console.log('Express server started, listening on port ' + process.env.PORT + '...');
        console.log('Start sequence completed');
    } catch (err) {
        console.error('Failed to start: ' + err.stack);
        await RawDataCollector.stop();
        process.exit(1);
    }
})();