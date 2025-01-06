/**
 * @fileOverview This file describes data collector - the entity responsible for querying metrics data from remote API,
 * as well as processing and storage of that data.
 * @author Alexander Kormilin
 * @version 1.2.2
 */

const PritunlApiClient = require('../pritunl/apiClient');

class DataCollector {
    constructor({
        pritunlServerFQDN,
        pritunlServerApiToken,
        pritunlServerApiSecret,
        metricsUpdateIntervalSeconds,
        loggerInstance,
        metricsDataStorage
    }) {
        this.started = false;
        this.updateTimer = null;
        this.metricsUpdateIntervalSeconds = metricsUpdateIntervalSeconds;
        this.apiClient = new PritunlApiClient({
            apiToken: pritunlServerApiToken,
            apiSecret: pritunlServerApiSecret,
            baseUrl: pritunlServerFQDN,
            loggerInstance: loggerInstance
        });
        this.metricsDataStorage = metricsDataStorage;
        this.loggerInstance = loggerInstance;
    }

    /**
     * Starts the background data update job in the data collector instance
     */
    async start() {
        await this.loggerInstance.debug('Starting raw data collector...');
        try {
            await this.updateMetricsData();
        } catch (err) {
            throw new Error('Failed to update metrics during start sequence: ' + err.message);
        }
        this.updateTimer = setInterval(async () => {
            try {
                await this.updateMetricsData();
            } catch (err) {
                await this.loggerInstance.error('Metrics update timer failure', err);
            }
        }, (Number.parseInt(this.metricsUpdateIntervalSeconds) * 1000));
        await this.loggerInstance.debug('Background update timer set and enabled, timeout is: ' +
            this.metricsUpdateIntervalSeconds + ' seconds...');
        this.started = true;
        await this.loggerInstance.debug('Raw data collector started');
    };

    /**
     * Stops the previously started background data update job in the data collector instance
     */
    async stop() {
        if (this.started === true) {
            await this.loggerInstance.debug('Stopping raw data collector...');
            await this.loggerInstance.debug('Clearing data update interval...');
            clearInterval(this.updateTimer);
            await this.loggerInstance.debug('Data update interval cleared');
            await this.loggerInstance.debug('Raw data collector stopped');
        } else {
            await this.loggerInstance.debug('Raw data collector is not started and may not be stopped');
        }
    };

    /**
     * Gets data from the Pritunl API, parses it and stores resulting metrics in the local storage for later requests
     */
    async updateMetricsData() {
        await this.loggerInstance.info('Attempting to update metrics data...');

        // the metrics itself
        // 1. Server status (can be 0 - online and 1 - offline) One metric per each server, type is gauge
        // 2. Users online, total. One metric per server, type is gauge
        // 3. Server throughput, egress, bytes per second. One metric per server, type is gauge
        // 4. Server throughput, ingress, bytes per second. One metric per server, type is gauge
        // 5. Host status (can be 0 - online and 1 - offline). One metric per each host, type is gauge
        // 6. Host CPU utilization, momentary, percents. One metric per host, type is gauge
        // 7. Host RAM utilization, momentary, percents. One metric per hots, type is gauge
        // 8. Link status (can be 0 - online and 1 - offline). One metric per each link, type is gauge
        // 9. Links location to location delay, momentary, ms. One metric per each possible combination of both source link, destination link, source host and destination host
        // 10. Link location to location connection status (can be 0 - up or 1 - down). One metric per each possible combination of both source link and destination link
        const linksPrettyData = [];
        const hostsPrettyData = [];
        const serverPrettyData = [];

        const serverData = {
            id: '',
            name: '',
            status: '',
            usersConnected: 0,
            ingressThroughput: 0,
            ingressTotal: 0,
            egressThroughput: 0,
            egressTotal: 0
        };

        const hostData = {
            id: '',
            name: '',
            status: '',
            usersConnected: 0,
            cpuUtilization: 0,
            ramUtilization: 0
        };

        const linkData = {
            id: '',
            name: '',
            status: '',
            interconnectionStatsArray: []
        };

        const linksInterconnectionStatusObject = {
            sourceLocationId: '',
            sourceLocationName: '',
            destinationLocationId: '',
            destinationLocationName: '',
            connectionStatus: '',
            latencyMonitoringData: ''
        };

        // gathering raw data from the target Pritunl installation

        const rawData = {
            hostsData: {},
            serversData: {},
            linksData: {},
            linkLocationsData: {},
            linkHostsData: [],
            hostsLoadData: {},
            serverBandwidthData: {},
        };

        try {
            await this.loggerInstance.debug('Fetching the hosts list...');
            rawData.hostsData = await this.apiClient.listHosts();
            await this.loggerInstance.debug('Successfully fetched the hosts list');

            await this.loggerInstance.debug('Fetching the hosts load stats...');
            for (const host of rawData.hostsData) {
                rawData.hostsLoadData[host.id] = await this.apiClient.getHostUsageData(host.id);
            }
            await this.loggerInstance.debug('Successfully fetched the hosts load stats');

            await this.loggerInstance.debug('Fetching the links list...');
            rawData.linksData = await this.apiClient.listLinks();
            await this.loggerInstance.debug('Successfully fetched the links list');

            await this.loggerInstance.debug('Fetching the link locations list...');
            for (const link of rawData.linksData.links) {
                const linkLocation = await this.apiClient.listLinkLocations(link.id);

                for (const linkLocationLoop of linkLocation) {
                    rawData.linkLocationsData[linkLocationLoop['id']] = linkLocationLoop;
                    rawData.linkHostsData.push(...linkLocationLoop['hosts']);
                }
            }
            await this.loggerInstance.debug('Successfully fetched the link locations list');

            await this.loggerInstance.debug('Fetching the servers list...');
            rawData.serversData = await this.apiClient.listServers();
            await this.loggerInstance.debug('Successfully fetched the servers list');

            await this.loggerInstance.debug('Fetching the servers bandwidth stats...');
            for (const server of rawData.serversData) {
                rawData.serverBandwidthData[server.id] = await this.apiClient.getServerBandwidthData(server.id);
            }
            await this.loggerInstance.debug('Successfully fetched the servers bandwidth stats');
            await this.loggerInstance.debug('All the raw metrics data fetched, processing...');

        } catch (err) {
            throw new Error('Failed to fetch raw metrics data: ' + err);
        }

        try {
            // servers block
            for (const server of rawData.serversData) {
                const prettyData = JSON.parse(JSON.stringify(serverData));
                prettyData.id = server.id;
                prettyData.name = server.name;
                prettyData.status = server.status;
                prettyData.usersConnected = server['users_online'];
                prettyData.ingressThroughput = rawData.serverBandwidthData[server.id]['received'];
                prettyData.ingressTotal = rawData.serverBandwidthData[server.id]['received_total'];
                prettyData.egressThroughput = rawData.serverBandwidthData[server.id]['sent'];
                prettyData.egressTotal = rawData.serverBandwidthData[server.id]['sent_total'];

                serverPrettyData.push(prettyData);
            }
            await this.loggerInstance.debug('Servers data processed...');
            await this.metricsDataStorage.storeServerMetricsData({data: serverPrettyData});
            await this.loggerInstance.debug('Updated servers data stored...');
        } catch (err) {
            throw new Error('Failed to process raw servers data: ' + err);
        }

        try {
            // hosts block
            for (const host of rawData.hostsData) {
                const prettyData = JSON.parse(JSON.stringify(hostData));
                prettyData.id = host.id;
                prettyData.name = host.name;
                prettyData.status = host.status;
                prettyData.usersConnected = host['users_online'];
                prettyData.cpuUtilization = rawData.hostsLoadData[host.id]['cpu'];
                prettyData.ramUtilization = rawData.hostsLoadData[host.id]['mem'];

                hostsPrettyData.push(prettyData);
            }
            await this.loggerInstance.debug('Hosts data processed...');
            await this.metricsDataStorage.storeHostMetricsData({data: hostsPrettyData});
            await this.loggerInstance.debug('Updated hosts data stored...');
        } catch (err) {
            throw new Error('Failed to process raw hosts data: ' + err);
        }

        try {
            // links block
            for (const link of rawData.linksData.links) {
                const prettyData = JSON.parse(JSON.stringify(linkData));
                prettyData.id = link.id;
                prettyData.name = link.name;
                prettyData.status = link.status;

                const interconnectionStatsArray = [];

                for (const locationId of Object.getOwnPropertyNames(rawData.linkLocationsData)) {
                    if (rawData.linkLocationsData[locationId]['link_id'] !== link.id) {
                        continue;
                    }

                    const latencyMonitoringData = [];

                    for (const host of rawData.linkLocationsData[locationId]['hosts']) {
                        for (const key of Object.getOwnPropertyNames(host['hosts'])) {
                            // iterating through the location's link clients (hosts)

                            const dstHost = rawData.linkHostsData.find((element) => {
                                if (element.id === key) {
                                    return true;
                                }
                            });

                            const latencyMonitoringObject = {
                                srcHostId: host['id'],
                                srcHostName: host['name'],
                                srcLocationId: host['location_id'],
                                dstHostId: dstHost.id,
                                dstHostName: dstHost['name'],
                                dstLocationId: dstHost['location_id'],
                                latency: host['hosts'][key]['latency'],
                                ok: host['hosts'][key]['state'] === true
                            };

                            latencyMonitoringData.push(latencyMonitoringObject);
                        }
                    }

                    for (const peer of rawData.linkLocationsData[locationId]['peers']) {
                        const prettyInterconnectionData = JSON.parse(JSON.stringify(linksInterconnectionStatusObject));
                        prettyInterconnectionData.sourceLocationId = rawData.linkLocationsData[locationId]['id'];
                        prettyInterconnectionData.sourceLocationName = rawData.linkLocationsData[locationId]['name'];
                        prettyInterconnectionData.destinationLocationId = peer.id;
                        prettyInterconnectionData.destinationLocationName = peer.name;
                        prettyInterconnectionData.connectionStatus = peer.status;

                        prettyInterconnectionData.latencyMonitoringData = latencyMonitoringData.filter((element) => {
                            if (element.srcLocationId === rawData.linkLocationsData[locationId]['id'] && element.dstLocationId === peer.id) {
                                return true;
                            }
                        });

                        interconnectionStatsArray.push(prettyInterconnectionData);
                    }
                }
                prettyData.interconnectionStatsArray = interconnectionStatsArray;
                linksPrettyData.push(prettyData);
            }
            await this.loggerInstance.debug('Links data processed...');
            await this.metricsDataStorage.storeLinkMetricsData({data: linksPrettyData});
            await this.loggerInstance.debug('Updated links data stored...');
        } catch (err) {
            throw new Error('Failed to process raw links data: ' + err);
        }

        await this.loggerInstance.info('Metrics data update completed successfully');
    };
}

module.exports = DataCollector;