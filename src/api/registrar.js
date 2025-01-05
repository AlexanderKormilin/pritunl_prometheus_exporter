const getMetricsEndpoint = require('./metrics/get');

// Registering all the listeners at once
module.exports.registerAllListeners = (expressReceiverInstance, metricsObserver, loggerInstance) => {
    // GET /metrics endpoint handler
    getMetricsEndpoint.registerListener(expressReceiverInstance, metricsObserver, loggerInstance);
};