const exporter = module.exports;
const metricsEndpoint = require('../apiListeners/getMetrics');

// Registering all the listeners at once
exporter.registerAllListeners = function registerAllListeners(expressReceiverInstance, metricsObserver) {
    metricsEndpoint.registerListener(expressReceiverInstance, metricsObserver);
};