const exporter = module.exports;
const metricsEndpoint = require('../apiListeners/getMetrics');

// Registering all the listeners at once
exporter.registerAllListeners = function registerAllListeners(expressReceiverInstance, metricsObserver, loggerInstance) {
    metricsEndpoint.registerListener(expressReceiverInstance, metricsObserver, loggerInstance);
};