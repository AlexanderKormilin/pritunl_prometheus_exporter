/**
 * @fileOverview This file is the definition of the datastore used by the app to store metrics data during operation
 * @author Alexander Kormilin
 * @version 1.1.3
 */
const dataStorage = require('nedb-promises');

class MetricsDatastore {
    constructor({loggerInstance}) {
        this.storage = dataStorage.create({
            inMemoryOnly: true
        });
        this.initialized = false;
        this.loggerInstance = loggerInstance;
    }

    async initialize() {
        try {
            await this.loggerInstance.debug('Ensuring datastore structure...');

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

            await this.loggerInstance.debug('Datastore structure ready');

            this.initialized = true;
        } catch (err) {
            throw err;
        }
    };

    async storeServerMetricsData({data}) {
        try {
            if (this.initialized === false) {
                await this.initialize();
            }
            const objectToStore = {
                type: 'serverMetrics',
                data: data
            };
            await this.storage.updateOne({"type": "serverMetrics"}, objectToStore);
        } catch (err) {
            throw err;
        }
    };

    async storeHostMetricsData({data}) {
        try {
            if (this.initialized === false) {
                await this.initialize();
            }
            const objectToStore = {
                type: 'hostMetrics',
                data: data
            };
            await this.storage.updateOne({"type": "hostMetrics"}, objectToStore);
        } catch (err) {
            throw err;
        }
    };

    async storeLinkMetricsData({data}) {
        try {
            if (this.initialized === false) {
                await this.initialize();
            }
            const objectToStore = {
                type: 'linkMetrics',
                data: data
            };
            await this.storage.updateOne({"type": "linkMetrics"}, objectToStore);
        } catch (err) {
            throw err;
        }
    };

    async getMetricsData() {
        try {
            if (this.initialized === false) {
                await this.initialize();
            }
            return this.storage.find({});
        } catch (err) {
            throw err;
        }
    };
}

module.exports = MetricsDatastore;