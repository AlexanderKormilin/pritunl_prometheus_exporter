const dataStorage = require('nedb-promises');

const metricsDataStore = dataStorage.create({
    inMemoryOnly: true
});

module.exports.ensureStructure = async () => {
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

module.exports.storeServerMetricsData = async ({
    data
} = {}) => {
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

module.exports.storeHostMetricsData = async ({
    data
} = {}) => {
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

module.exports.storeLinkMetricsData = async ({
    data
} = {}) => {
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

module.exports.getMetricsData = async () => {
    try {
        return await metricsDataStore.find({});
    } catch (err) {
        throw err;
    }
};