const exporter = module.exports;
const getMetricsEndpoint = require('.//getMetrics');

// Registering all the listeners at once
exporter.registerAllListeners = function registerAllListeners(expressReceiverInstance, metricsObserver, loggerInstance) {
    // GET /metrics endpoint handler
    getMetricsEndpoint.registerListener(expressReceiverInstance, metricsObserver, loggerInstance);
};