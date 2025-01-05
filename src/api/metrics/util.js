module.exports.getGetMetricsEndpointHandlerFn = (metricsObserver, loggerInstance, path) => {
    try {
        return async (request, response) => {
            try {
                await loggerInstance.info('Got a request on the ' + path + ' endpoint...');
                await loggerInstance.debug('Preparing the Prometheus friendly metrics data...');
                await metricsObserver.prepareMetrics();
                await loggerInstance.debug('Prometheus friendly metrics data ready');
                const metricsText = metricsObserver.getMetrics();
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