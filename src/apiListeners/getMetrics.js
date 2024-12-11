const exporter = module.exports;

exporter.registerListener = function registerListener(expressReceiverInstance, metricsObserver) {
    expressReceiverInstance.get('/metrics', async function getAllMetrics(request, response) {
        let responseCode = 200;
        try {
            await metricsObserver.updateMetrics();
            const metricsText = await metricsObserver.getMetrics();
            response.type('text/plain');
            response.send(metricsText);
        } catch (err) {
            responseCode = 500;
            response.writeHead(responseCode).end();
            console.error(err);
        }
    });
};