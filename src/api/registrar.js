/**
 * @fileOverview This is just the wrapper used to distribute app components instances across consumers. And organize
 * API handlers a bit.
 * @author Alexander Kormilin
 * @version 1.2.0
 */

const getMetricsEndpoint = require('./metrics/get');

// Registering all the listeners at once
module.exports.registerAllListeners = (expressReceiverInstance, metricsObserver, loggerInstance) => {
    // GET /metrics endpoint handler
    getMetricsEndpoint.registerListener(expressReceiverInstance, metricsObserver, loggerInstance);
};