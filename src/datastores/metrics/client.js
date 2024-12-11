const exporter = module.exports;
const dataStorage = require('nedb-promises');

const metricsDataStore = dataStorage.create({
    inMemoryOnly: true,
    autoload: true,
});

exporter.storeServerMetricsData = async function storeServerMetricsData({
    data
} = {}) {
    try {
        const objectToStore = {
            type: 'serverMetrics',
            data: data
        };
        await metricsDataStore.remove({"type": "serverMetrics"}, {multi: true});
        await metricsDataStore.insert(objectToStore);
        return true;
    } catch (err) {
        throw err;
    }
};

exporter.storeHostMetricsData = async function storeHostMetricsData({
    data
} = {}) {
    try {
        const objectToStore = {
            type: 'hostMetrics',
            data: data
        };
        await metricsDataStore.remove({"type": "hostMetrics"}, {multi: true});
        await metricsDataStore.insert(objectToStore);
        return true;
    } catch (err) {
        throw err;
    }
};

exporter.storeLinkMetricsData = async function storeLinkMetricsData({
    data
} = {}) {
    try {
        const objectToStore = {
            type: 'linkMetrics',
            data: data
        };
        await metricsDataStore.remove({"type": "linkMetrics"}, {multi: true});
        await metricsDataStore.insert(objectToStore);
        return true;
    } catch (err) {
        throw err;
    }
};

exporter.getMetricsData = async function getMetricsData() {
    try {
        return await metricsDataStore.find({});
    } catch (err) {
        throw err;
    }
};