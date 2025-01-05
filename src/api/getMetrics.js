const exporter = module.exports;

exporter.registerListener = function registerListener(expressReceiverInstance, metricsObserver, loggerInstance) {
    const path = '/metrics';
    expressReceiverInstance.get(path, async function getAllMetrics(request, response) {
        try {
            await loggerInstance.debug('Got a request on /metrics endpoint...');
            await loggerInstance.debug('Preparing the Prometheus friendly metrics data...');
            await metricsObserver.prepareMetrics();
            const metricsText = await metricsObserver.getMetrics();
            await loggerInstance.debug('Prometheus friendly metrics data ready');
            response.type('text/plain');
            response.send(metricsText);
            await loggerInstance.debug('Response sent');
        } catch (err) {
            response.status(500).end();
            await loggerInstance.error('Failed to process incoming request on the ' + path + ' endpoint', err);
        }
    });
};