const client = require('prom-client');

// Servers metrics section
const serverStatus = new client.Gauge({
    name: 'server_status',
    help: 'metric_help',
    labelNames: ['serverName']
});
const usersConnected = new client.Gauge({
    name: 'server_users_connected',
    help: 'metric_help',
    labelNames: ['serverName']
});
const serverEgressThroughputBytes = new client.Gauge({
    name: 'server_egress_throughput_bytes',
    help: 'metric_help',
    labelNames: ['serverName']
});
const serverIngressThroughputBytes = new client.Gauge({
    name: 'server_ingress_throughput_bytes',
    help: 'metric_help',
    labelNames: ['serverName']
});
// links metrics section
const linkStatus = new client.Gauge({
    name: 'link_status',
    help: 'metric_help',
    labelNames: ['linkName']
});
const linkLocationsConnectionStatus = new client.Gauge({
    name: 'link_locations_connection_status',
    help: 'metric_help',
    labelNames: ['srcLinkName', 'dstLinkName']
});
const linkInterconnectionLatency = new client.Gauge({
    name: 'link_locations_connection_latency',
    help: 'metric_help',
    labelNames: ['srcLinkName', 'srcHostName', 'dstLinkName', 'dstHostName']
});
const linkInterconnectionLatencyMin = new client.Gauge({
    name: 'link_locations_connection_latency_min_across_hosts',
    help: 'metric_help',
    labelNames: ['srcLinkName', 'dstLinkName']
});
const linkInterconnectionLatencyMax = new client.Gauge({
    name: 'link_locations_connection_latency_max_across_hosts',
    help: 'metric_help',
    labelNames: ['srcLinkName', 'dstLinkName']
});
const linkInterconnectionLatencyMonitoringStatus = new client.Gauge({
    name: 'link_locations_connection_latency_monitoring_status',
    help: 'metric_help',
    labelNames: ['srcLinkName', 'srcHostName', 'dstLinkName', 'dstHostName']
});
// Hosts metrics section
const hostStatus = new client.Gauge({
    name: 'host_status',
    help: 'metric_help',
    labelNames: ['hostName']
});
const hostUsersConnected = new client.Gauge({
    name: 'host_users_connected',
    help: 'metric_help',
    labelNames: ['hostName']
});
const hostCpuUtilization = new client.Gauge({
    name: 'host_cpu_utilization',
    help: 'metric_help',
    labelNames: ['hostName']
});
const hostRamUtilization = new client.Gauge({
    name: 'host_ram_utilization',
    help: 'metric_help',
    labelNames: ['hostName']
});

class PrometheusMetricsObserver {
    constructor({
        rawDataCollectorInstance
     } = {}) {
        this.rawDataCollectorInstance = rawDataCollectorInstance;
    }

    async updateMetrics() {
        try {
            // fetching the data
            const allTheMetrics = await this.rawDataCollectorInstance.getRawMetrics();
            const serverMetrics = allTheMetrics.find((element) => element['type'] === 'serverMetrics')['data'];
            const linkMetrics = allTheMetrics.find((element) => element['type'] === 'linkMetrics')['data'];
            const hostMetrics = allTheMetrics.find((element) => element['type'] === 'hostMetrics')['data'];

            // Host metrics
            for (const host of hostMetrics) {
                hostStatus.set({hostName: host.name}, host.status === 'online' ? 0 : 1);
                hostUsersConnected.set({
                    hostName: host.name
                }, host.usersConnected ? host.usersConnected : 0);

                let totalCpuLoadPercentage = 0;
                for (const piece of host.cpuUtilization) {
                    totalCpuLoadPercentage = totalCpuLoadPercentage + piece[1];
                }
                const averageLastMinuteCpuLoad = (totalCpuLoadPercentage / host.cpuUtilization.length) * 100;

                let totalMemoryLoadPercentage = 0;
                for (const piece of host.ramUtilization) {
                    totalMemoryLoadPercentage = totalMemoryLoadPercentage + piece[1];
                }
                const averageLastMinuteRamLoad = (totalMemoryLoadPercentage / host.ramUtilization.length) * 100;

                hostCpuUtilization.set({
                    hostName: host.name
                }, averageLastMinuteCpuLoad);
                hostRamUtilization.set({
                    hostName: host.name
                }, averageLastMinuteRamLoad);
            }

            // Link metrics
            for (const link of linkMetrics) {
                linkStatus.set({linkName: link.name}, 0);

                for (const interconnection of link.interconnectionStatsArray) {

                    linkLocationsConnectionStatus.set({
                        srcLinkName: interconnection.sourceLocationName,
                        dstLinkName: interconnection.destinationLocationName
                    }, 0);

                    let minLatency = 999999;
                    let maxLatency = 0;

                    for (const hostPair of interconnection.latencyMonitoringData) {

                        if (maxLatency < hostPair.latency) {
                            maxLatency = hostPair.latency;
                        }

                        if (hostPair.latency < minLatency) {
                            minLatency = hostPair.latency;
                        }
                    }

                    for (const hostPair of interconnection.latencyMonitoringData) {

                        linkInterconnectionLatency.set({
                            srcLinkName: interconnection.sourceLocationName,
                            dstLinkName: interconnection.destinationLocationName,
                            dstHostName: hostPair.dstHostName,
                            srcHostName: hostPair.srcHostName
                        }, hostPair.latency / 1000);
                        linkInterconnectionLatencyMin.set({
                            srcLinkName: interconnection.sourceLocationName,
                            dstLinkName: interconnection.destinationLocationName
                        }, minLatency / 1000);
                        linkInterconnectionLatencyMax.set({
                            srcLinkName: interconnection.sourceLocationName,
                            dstLinkName: interconnection.destinationLocationName
                        }, maxLatency / 1000);
                        linkInterconnectionLatencyMonitoringStatus.set({
                            srcLinkName: interconnection.sourceLocationName,
                            dstLinkName: interconnection.destinationLocationName,
                            dstHostName: hostPair.dstHostName,
                            srcHostName: hostPair.srcHostName
                        }, hostPair.ok === true ? 0 : 1);
                    }

                }
            }

            // Server metrics
            for (const server of serverMetrics) {
                serverStatus.set({
                    serverName: server.name
                }, 0);
                usersConnected.set({
                    serverName: server.name
                }, server.usersConnected ? server.usersConnected : 0);
                serverEgressThroughputBytes.set({
                    serverName: server.name
                }, server.egressThroughput);
                serverIngressThroughputBytes.set({
                    serverName: server.name
                }, server.ingressThroughput);
            }

        } catch (err) {
            console.error('Failed to update metrics');
            throw err;
        }
    }

    async getMetrics() {
        return client.register.metrics();
    }
}

module.exports = PrometheusMetricsObserver;