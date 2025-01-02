const metricsDataStorage = require('../../datastores/metrics/client');
const PritunlApiClient = require('../pritunl/apiClient');

class DataCollector {
    constructor({
        pritunlServerFQDN,
        pritunlServerApiToken,
        pritunlServerApiSecret,
        metricsUpdateIntervalSeconds,
        loggerInstance
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
        this.loggerInstance = loggerInstance;
    }

    async start() {
        try {
            await this.loggerInstance.debug('Starting raw data collector...');
            await metricsDataStorage.ensureStructure();
            await this.updateRawMetrics();
            this.updateTimer = setInterval(async () => {
                await this.updateRawMetrics();
            }, (Number.parseInt(this.metricsUpdateIntervalSeconds) * 1000));
            await this.loggerInstance.debug('Background update timer set and enabled, timeout is: ' + this.metricsUpdateIntervalSeconds + ' seconds...');
            this.started = true;
            await this.loggerInstance.debug('Raw data collector started');
        } catch (err) {
            throw new Error('Failed to start raw data collector: ' + err.message);
        }
    };

    async stop() {
        await this.loggerInstance.debug('Stopping raw data collector...');
        if (this.started === true) {
            await this.loggerInstance.debug('Clearing data update interval...');
            clearInterval(this.updateTimer);
            await this.loggerInstance.debug('Data update interval cleared');
        }
        await this.loggerInstance.debug('Raw data collector stopped');
    };

    async updateRawMetrics() {
        await this.loggerInstance.info('Attempting to update raw metrics data...');
        try {
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

            const linkLocationsRawData = {};
            const hostsLoadRawData = {};
            const serverBandwidthRawData = {};
            const linkHostsRawData = [];

            await this.loggerInstance.debug('Fetching the hosts list...');
            const hosts = await this.apiClient.listHosts();
            await this.loggerInstance.debug('Successfully fetched the hosts list');

            await this.loggerInstance.debug('Fetching the hosts load stats...');
            for (const host of hosts) {
                hostsLoadRawData[host.id] = await this.apiClient.getHostUsageData(host.id);
            }
            await this.loggerInstance.debug('Successfully fetched the hosts load stats');

            await this.loggerInstance.debug('Fetching the links list...');
            const links = await this.apiClient.listLinks();
            await this.loggerInstance.debug('Successfully fetched the links list');

            await this.loggerInstance.debug('Fetching the link locations list...');
            for (const link of links.links) {
                const linkLocation = await this.apiClient.listLinkLocations(link.id);

                for (const linkLocationLoop of linkLocation) {
                    linkLocationsRawData[linkLocationLoop.id] = linkLocationLoop;
                    linkHostsRawData.push(...linkLocationLoop['hosts']);
                }
            }
            await this.loggerInstance.debug('Successfully fetched the link locations list');

            await this.loggerInstance.debug('Fetching the servers list...');
            const servers = await this.apiClient.listServers();
            await this.loggerInstance.debug('Successfully fetched the servers list');

            await this.loggerInstance.debug('Fetching the servers bandwidth stats...');
            for (const server of servers) {
                serverBandwidthRawData[server.id] = await this.apiClient.getServerBandwidthData(server.id);
            }
            await this.loggerInstance.debug('Successfully fetched the servers bandwidth stats');
            await this.loggerInstance.debug('All the raw metrics data fetched, processing...');

            // servers block
            for (const server of servers) {
                const prettyData = JSON.parse(JSON.stringify(serverData));
                prettyData.id = server.id;
                prettyData.name = server.name;
                prettyData.status = server.status;
                prettyData.usersConnected = server['users_online'];
                prettyData.ingressThroughput = serverBandwidthRawData[server.id]['received'];
                prettyData.ingressTotal = serverBandwidthRawData[server.id]['received_total'];
                prettyData.egressThroughput = serverBandwidthRawData[server.id]['sent'];
                prettyData.egressTotal = serverBandwidthRawData[server.id]['sent_total'];

                serverPrettyData.push(prettyData);
            }
            await this.loggerInstance.debug('Servers data processed...');


            // hosts block
            for (const host of hosts) {
                const prettyData = JSON.parse(JSON.stringify(hostData));
                prettyData.id = host.id;
                prettyData.name = host.name;
                prettyData.status = host.status;
                prettyData.usersConnected = host['users_online'];
                prettyData.cpuUtilization = hostsLoadRawData[host.id]['cpu'];
                prettyData.ramUtilization = hostsLoadRawData[host.id]['mem'];

                hostsPrettyData.push(prettyData);
            }
            await this.loggerInstance.debug('Hosts data processed...');

            // links block
            for (const link of links.links) {
                const prettyData = JSON.parse(JSON.stringify(linkData));
                prettyData.id = link.id;
                prettyData.name = link.name;
                prettyData.status = link.status;

                const interconnectionStatsArray = [];

                for (const locationId of Object.getOwnPropertyNames(linkLocationsRawData)) {
                    if (linkLocationsRawData[locationId]['link_id'] !== link.id) {
                        continue;
                    }

                    const latencyMonitoringData = [];

                    for (const host of linkLocationsRawData[locationId]['hosts']) {
                        for (const key of Object.getOwnPropertyNames(host['hosts'])) {
                            // iterating through the location's link clients (hosts)

                            const dstHost = linkHostsRawData.find((element) => {
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

                    for (const peer of linkLocationsRawData[locationId]['peers']) {
                        const prettyInterconnectionData = JSON.parse(JSON.stringify(linksInterconnectionStatusObject));
                        prettyInterconnectionData.sourceLocationId = linkLocationsRawData[locationId]['id'];
                        prettyInterconnectionData.sourceLocationName = linkLocationsRawData[locationId]['name'];
                        prettyInterconnectionData.destinationLocationId = peer.id;
                        prettyInterconnectionData.destinationLocationName = peer.name;
                        prettyInterconnectionData.connectionStatus = peer.status;

                        prettyInterconnectionData.latencyMonitoringData = latencyMonitoringData.filter((element) => {
                            if (element.srcLocationId === linkLocationsRawData[locationId]['id'] && element.dstLocationId === peer.id) {
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

            await metricsDataStorage.storeHostMetricsData({data: hostsPrettyData});
            await metricsDataStorage.storeServerMetricsData({data: serverPrettyData});
            await metricsDataStorage.storeLinkMetricsData({data: linksPrettyData});

            await this.loggerInstance.debug('Data stored...');
            await this.loggerInstance.info('Raw metrics data updated');

        } catch (err) {
            throw new Error('Failed to update raw metrics data: ' + err);
        }
    };

    async getRawMetrics() {
        try {
            return metricsDataStorage.getMetricsData();
        } catch (err) {
            throw new Error('Failed to retrieve raw metrics data: ' + err);
        }
    };
}

module.exports = DataCollector;