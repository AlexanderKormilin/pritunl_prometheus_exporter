/**
 * @fileOverview router file for the GET /metrics endpoint
 * @author Alexander Kormilin
 * @version 1.2.2
 */

const util = require('./util');
const path = '/metrics';

module.exports.registerListener = (expressReceiverInstance, metricsObserver, loggerInstance) => {
    const handlerFn = util.getGetMetricsEndpointHandlerFn(metricsObserver, loggerInstance, path);
    expressReceiverInstance.get(path, handlerFn);
};