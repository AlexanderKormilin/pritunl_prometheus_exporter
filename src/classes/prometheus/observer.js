/**
 * @fileOverview And this is the entity that is responsible for conversion of the "raw" data to
 * the Prometheus-friendly metrics string
 * @author Alexander Kormilin
 * @version 1.1.2
 */

const client = require('prom-client');
const metricsDefinitionHelper = require('./metrics');

class Observer {
    constructor({
        rawDataCollectorInstance,
        loggerInstance
     } = {}) {
        this.loggerInstance = loggerInstance;
        this.rawDataCollectorInstance = rawDataCollectorInstance;
        this.metricsDefinitionHelper = new metricsDefinitionHelper();
    }

    async prepareMetrics() {
        try {
            // fetching the data
            const allTheMetrics = await this.rawDataCollectorInstance.getMetricsData();
            const serverMetrics = allTheMetrics.find((element) => element['type'] === 'serverMetrics')['data'];
            const linkMetrics = allTheMetrics.find((element) => element['type'] === 'linkMetrics')['data'];
            const hostMetrics = allTheMetrics.find((element) => element['type'] === 'hostMetrics')['data'];

            // Host metrics
            for (const host of hostMetrics) {
                this.metricsDefinitionHelper.metrics.host.host_status.set({hostName: host.name}, host.status === 'online' ? 0 : 1);
                this.metricsDefinitionHelper.metrics.host.host_users_connected.set({
                    hostName: host.name
                }, host.usersConnected ? host.usersConnected : 0);

                this.metricsDefinitionHelper.metrics.host.host_cpu_utilization.set({
                    hostName: host.name
                }, host.cpuUtilization * 100);
                this.metricsDefinitionHelper.metrics.host.host_ram_utilization.set({
                    hostName: host.name
                }, host.ramUtilization * 100);
            }

            // Link metrics
            for (const link of linkMetrics) {
                this.metricsDefinitionHelper.metrics.link.link_status.set({linkName: link.name}, 0);

                for (const interconnection of link.interconnectionStatsArray) {

                    this.metricsDefinitionHelper.metrics.link.link_locations_connection_status.set({
                        srcLinkName: interconnection.sourceLocationName,
                        dstLinkName: interconnection.destinationLocationName
                    }, interconnection.connectionStatus === 'connected' ? 0 : 1);

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

                        this.metricsDefinitionHelper.metrics.link.link_locations_connection_latency.set({
                            srcLinkName: interconnection.sourceLocationName,
                            dstLinkName: interconnection.destinationLocationName,
                            dstHostName: hostPair.dstHostName,
                            srcHostName: hostPair.srcHostName
                        }, hostPair.latency / 1000);
                        this.metricsDefinitionHelper.metrics.link.link_locations_connection_latency_min_across_hosts.set({
                            srcLinkName: interconnection.sourceLocationName,
                            dstLinkName: interconnection.destinationLocationName
                        }, minLatency / 1000);
                        this.metricsDefinitionHelper.metrics.link.link_locations_connection_latency_max_across_hosts.set({
                            srcLinkName: interconnection.sourceLocationName,
                            dstLinkName: interconnection.destinationLocationName
                        }, maxLatency / 1000);
                        this.metricsDefinitionHelper.metrics.link.link_locations_connection_latency_monitoring_status.set({
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
                this.metricsDefinitionHelper.metrics.server.server_status.set({
                    serverName: server.name
                }, server.status === 'online' ? 0 : 1);
                this.metricsDefinitionHelper.metrics.server.server_users_connected.set({
                    serverName: server.name
                }, server.usersConnected ? server.usersConnected : 0);
                this.metricsDefinitionHelper.metrics.server.server_egress_throughput_bytes.set({
                    serverName: server.name
                }, server.egressThroughput);
                this.metricsDefinitionHelper.metrics.server.server_ingress_throughput_bytes.set({
                    serverName: server.name
                }, server.ingressThroughput);
            }

        } catch (err) {
            await this.loggerInstance.error('Failed to fetch Prometheus metrics data', err);
            throw err;
        }
    }

    async getMetrics() {
        return client.register.metrics();
    }
}

module.exports = Observer;