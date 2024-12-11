const rawDataStorage = require('../../datastores/metrics/client');
const PritunlApiClient = require('../pritunl/apiClient');

class DataCollector {
    constructor({
        pritunlServerFQDN,
        pritunlServerApiToken,
        pritunlServerApiSecret,
        metricsUpdateIntervalSeconds
    }) {
        this.started = false;
        this.updateTimer = null;
        this.metricsUpdateIntervalSeconds = metricsUpdateIntervalSeconds;
        this.apiClient = new PritunlApiClient({
            apiToken: pritunlServerApiToken,
            apiSecret: pritunlServerApiSecret,
            baseUrl: pritunlServerFQDN
        });
    }

    async start() {
        try {
            console.log('Starting raw data collector...');
            await this.updateRawMetrics();
            this.updateTimer = setInterval(async () => {
                try {
                    await this.updateRawMetrics();
                } catch (err) {
                    console.error('Failed to update raw metrics data: ' + err.message);
                }
            }, (Number.parseInt(this.metricsUpdateIntervalSeconds) * 1000));
            console.log('Background update timer set and enabled, timeout is: ' + this.metricsUpdateIntervalSeconds + ' seconds...');
            this.started = true;
            console.log('Raw data collector started');
        } catch (err) {
            throw new Error('Failed to start raw data collector: ' + err.message);
        }
    };

    async stop() {
        console.log('Stopping raw data collector...');
        if (this.started === true) {
            console.log('Clearing data update interval...');
            clearInterval(this.updateTimer);
            console.log('Data update interval cleared');
        }
        console.log('Raw data collector stopped');
    };

    async updateRawMetrics() {
        console.log('Updating raw metrics data...');
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
            // 9. Links location to location delay, momentary, ms. One metric per each possible combination of both source link and destination link
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

            const hosts = await this.apiClient.listHosts();
            console.log('Successfully fetched the hosts list...');

            for (const host of hosts) {
                try {
                    hostsLoadRawData[host.id] = await this.apiClient.getHostUsageData(host.id);
                } catch (err) {
                    console.error('Failed to fetch host load data! Host data is: ' + host.toString());
                }
            }
            console.log('Successfully fetched the hosts load stats...');

            const links = await this.apiClient.listLinks();
            console.log('Successfully fetched the links list...');

            for (const link of links.links) {
                try {
                    const linkLocation = await this.apiClient.listLinkLocations(link.id);

                    for (const linkLocationLoop of linkLocation) {
                        linkLocationsRawData[linkLocationLoop.id] = linkLocationLoop;
                        linkHostsRawData.push(...linkLocationLoop['hosts']);
                    }
                } catch (err) {
                    console.error('Failed to fetch link location! Link data is: ' + link.toString());
                }
            }
            console.log('Successfully fetched the link locations list...');


            const servers = await this.apiClient.listServers();
            console.log('Successfully fetched the servers list...');

            for (const server of servers) {
                serverBandwidthRawData[server.id] = await this.apiClient.getServerBandwidthData(server.id);
            }
            console.log('Successfully fetched the servers bandwidth stats...');
            console.log('All the raw metrics data fetched, processing...');

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
                            // iterating through the locations connected link clients (hosts)

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

            await rawDataStorage.storeHostMetricsData({data: hostsPrettyData});
            await rawDataStorage.storeServerMetricsData({data: serverPrettyData});
            await rawDataStorage.storeLinkMetricsData({data: linksPrettyData});

            console.log('Data ready');

        } catch (err) {
            throw new Error('Failed to update raw metrics data: ' + err);
        }
    };

    async getRawMetrics() {
        try {
            return rawDataStorage.getMetricsData();
        } catch (err) {
            throw new Error('Failed to retrieve raw metrics data: ' + err);
        }
    };
}

module.exports = DataCollector;