/**
 * @fileOverview This file is the definition of the Prometheus metrics this app knows and produces
 * @author Alexander Kormilin
 * @version 1.1.2
 */

const client = require('prom-client');

module.exports = {
    server: {
        server_status: new client.Gauge({
            name: 'server_status',
            help: 'The current status of the server. May be either 0 (online) or 1 (offline)',
            labelNames: ['serverName']
        }),
        server_users_connected: new client.Gauge({
            name: 'server_users_connected',
            help: 'The total number of a users currently connected to the server',
            labelNames: ['serverName']
        }),
        server_egress_throughput_bytes: new client.Gauge({
            name: 'server_egress_throughput_bytes',
            help: 'Out-coming server traffic, in bytes',
            labelNames: ['serverName']
        }),
        server_ingress_throughput_bytes: new client.Gauge({
            name: 'server_ingress_throughput_bytes',
            help: 'In-coming server traffic, in bytes',
            labelNames: ['serverName']
        })
    },
    link: {
        link_status: new client.Gauge({
            name: 'link_status',
            help: 'The current status of the link. May be either 0 (online) or 1 (offline)',
            labelNames: ['linkName']
        }),
        link_locations_connection_status: new client.Gauge({
            name: 'link_locations_connection_status',
            help: 'The current status of each location interconnection status. May be either 0 (connected) or 1 (disconnected)',
            labelNames: ['srcLinkName', 'dstLinkName']
        }),
        link_locations_connection_latency: new client.Gauge({
            name: 'link_locations_connection_latency',
            help: 'The last latency value measured during the link client healthcheck. Milliseconds',
            labelNames: ['srcLinkName', 'srcHostName', 'dstLinkName', 'dstHostName']
        }),
        link_locations_connection_latency_min_across_hosts: new client.Gauge({
            name: 'link_locations_connection_latency_min_across_hosts',
            help: 'The minimal last latency value measured during the link client healthcheck. Milliseconds, useful if there is more than one link client per location',
            labelNames: ['srcLinkName', 'dstLinkName']
        }),
        link_locations_connection_latency_max_across_hosts: new client.Gauge({
            name: 'link_locations_connection_latency_max_across_hosts',
            help: 'The maximal last latency value measured during the link client healthcheck. Milliseconds, useful if there is more than one link client per location',
            labelNames: ['srcLinkName', 'dstLinkName']
        }),
        link_locations_connection_latency_monitoring_status: new client.Gauge({
            name: 'link_locations_connection_latency_monitoring_status',
            help: 'The actual status of each interconnection healthcheck. May be either 0 (ok) or 1 (failed)',
            labelNames: ['srcLinkName', 'srcHostName', 'dstLinkName', 'dstHostName']
        }),
    },
    host: {
        host_status: new client.Gauge({
            name: 'host_status',
            help: 'The current status of the host. May be either 0 (online) or 1 (offline)',
            labelNames: ['hostName']
        }),
        host_users_connected: new client.Gauge({
            name: 'host_users_connected',
            help: 'The total number of a users currently connected to the host',
            labelNames: ['hostName']
        }),
        host_cpu_utilization: new client.Gauge({
            name: 'host_cpu_utilization',
            help: 'metric_help',
            labelNames: ['hostName']
        }),
        host_ram_utilization: new client.Gauge({
            name: 'host_ram_utilization',
            help: 'metric_help',
            labelNames: ['hostName']
        })
    }
};
