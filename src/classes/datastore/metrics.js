/**
 * @fileOverview This file is the definition of the datastore used by the app to store metrics data during operation
 * @author Alexander Kormilin
 * @version 1.2.2
 */
const dataStorage = require('nedb-promises');

class MetricsDatastore {
    constructor({loggerInstance}) {
        this.storage = dataStorage.create({
            inMemoryOnly: true
        });
        this.loggerInstance = loggerInstance;
        this.initialized = false;
    }

    /**
     * Ensures datastore only have datastructures we need
     */
    async initialize() {
        try {
            await this.loggerInstance.debug('Ensuring metrics storage structure...');

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

            await this.storage.remove({}, {});

            await this.storage.insert(objectToStoreServerMetrics);
            await this.storage.insert(objectToStoreHostMetrics);
            await this.storage.insert(objectToStoreLinkMetrics);

            await this.loggerInstance.debug('Metrics storage structure ready');

            this.initialized = true;
        } catch (err) {
            throw err;
        }
    };

    /**
     * Stores the server metrics in the datastore
     * @param {object} data - the servers metrics data received from dataCollector
     */
    async storeServerMetricsData({data}) {
        if (this.initialized === false) {
            throw new Error('Attempting to access the datastore which was not initialized properly');
        }
        try {
            const objectToStore = {
                type: 'serverMetrics',
                data: data
            };
            await this.storage.updateOne({"type": "serverMetrics"}, objectToStore);
        } catch (err) {
            throw err;
        }
    };

    /**
     * Stores the server metrics in the datastore
     * @param {object} data - the hosts metrics data received from dataCollector
     */
    async storeHostMetricsData({data}) {
        if (this.initialized === false) {
            throw new Error('Attempting to access the datastore which was not initialized properly');
        }
        try {
            const objectToStore = {
                type: 'hostMetrics',
                data: data
            };
            await this.storage.updateOne({"type": "hostMetrics"}, objectToStore);
        } catch (err) {
            throw err;
        }
    };

    /**
     * Stores the server metrics in the datastore
     * @param {object} data - the links metrics data received from dataCollector
     */
    async storeLinkMetricsData({data}) {
        if (this.initialized === false) {
            throw new Error('Attempting to access the datastore which was not initialized properly');
        }
        try {
            const objectToStore = {
                type: 'linkMetrics',
                data: data
            };
            await this.storage.updateOne({"type": "linkMetrics"}, objectToStore);
        } catch (err) {
            throw err;
        }
    };

    /**
     * Gets all the metrics from the datastore
     * @return {Promise<Array<object>>}
     */
    async getMetricsData() {
        if (this.initialized === false) {
            throw new Error('Attempting to access the datastore which was not initialized properly');
        }
        try {
            const data = await this.storage.find({});
            await this.loggerInstance.debug('Metrics data fetched', data);
            return data;
        } catch (err) {
            throw err;
        }
    };
}

module.exports = MetricsDatastore;