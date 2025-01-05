const exporter = module.exports;
const getMetricsEndpoint = require('../apiListeners/getMetrics');

// Registering all the listeners at once
exporter.registerAllListeners = function registerAllListeners(expressReceiverInstance, metricsObserver, loggerInstance) {
    // GET /metrics endpoint handler
    getMetricsEndpoint.registerListener(expressReceiverInstance, metricsObserver, loggerInstance);
};