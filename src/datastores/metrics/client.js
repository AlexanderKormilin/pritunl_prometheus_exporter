const exporter = module.exports;
const dataStorage = require('nedb-promises');

const metricsDataStore = dataStorage.create({
    inMemoryOnly: true
});

exporter.ensureStructure = async function ensureStructure() {
    try {
        const objectToStoreServerMetrics = {
            type: 'serverMetrics',
            data: null
        };
        const objectToStoreHostMetrics = {
            type: 'hostMetrics',
            data: null
        };
        const objectToStoreLinkMetrics = {
            type: 'linkMetrics',
            data: null
        };

        await metricsDataStore.remove({}, {});

        await metricsDataStore.insert(objectToStoreServerMetrics);
        await metricsDataStore.insert(objectToStoreHostMetrics);
        await metricsDataStore.insert(objectToStoreLinkMetrics);
    } catch (err) {
        throw err;
    }
};

exporter.storeServerMetricsData = async function storeServerMetricsData({
    data
} = {}) {
    try {
        const objectToStore = {
            type: 'serverMetrics',
            data: data
        };
        await metricsDataStore.updateOne({"type": "serverMetrics"}, objectToStore);
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
        await metricsDataStore.updateOne({"type": "hostMetrics"}, objectToStore);
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
        await metricsDataStore.updateOne({"type": "linkMetrics"}, objectToStore);
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