const exporter = module.exports;

exporter.registerListener = function registerListener(expressReceiverInstance, metricsObserver, loggerInstance) {
    expressReceiverInstance.get('/metrics', async function getAllMetrics(request, response) {
        try {
            await loggerInstance.debug('Got a request on /metrics endpoint...');
            await metricsObserver.updateMetrics();
            const metricsText = await metricsObserver.getMetrics();
            await loggerInstance.debug('Prometheus friendly metrics data ready...');
            response.type('text/plain');
            response.send(metricsText);
            await loggerInstance.debug('Request processed, response sent');
        } catch (err) {
            response.status(500).end();
            await loggerInstance.error('Failed to process incoming request on the metrics endpoint', err);
        }
    });
};