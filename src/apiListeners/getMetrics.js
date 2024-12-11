const exporter = module.exports;

exporter.registerListener = function registerListener(expressReceiverInstance, metricsObserver) {
    expressReceiverInstance.get('/metrics', async function getAllMetrics(request, response) {
        try {
            await metricsObserver.updateMetrics();
            const metricsText = await metricsObserver.getMetrics();
            response.type('text/plain');
            response.send(metricsText);
        } catch (err) {
            response.status(500).end();
            console.error(err);
        }
    });
};