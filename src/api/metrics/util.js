/**
 * @fileOverview Utils used to process metrics requests
 * @author Alexander Kormilin
 * @version 1.1.2
 */

module.exports.getGetMetricsEndpointHandlerFn = (metricsObserver, loggerInstance, path) => {
    try {
        return async (request, response) => {
            try {
                await loggerInstance.info('Got a request on the ' + path + ' endpoint...');
                await loggerInstance.debug('Preparing the Prometheus-friendly metrics data...');
                await metricsObserver.prepareMetrics();
                const metricsText = await metricsObserver.getMetrics();
                await loggerInstance.debug('Prometheus-friendly metrics data ready');
                response.type('text/plain');
                response.send(metricsText);
                await loggerInstance.info('Response sent');
            } catch (err) {
                response.status(500).end();
                await loggerInstance.error('Failed to process incoming request on the ' + path + ' endpoint', err);
            }
        };
    } catch (err) {
        throw err;
    }
};