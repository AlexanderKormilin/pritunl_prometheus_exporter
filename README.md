# Pritunl Prometheus exporter

Exports the state of a [Pritunl](https://pritunl.com) installation – VPN servers, hosts and Pritunl Link
site-to-site connections – as Prometheus metrics.

The exporter polls the Pritunl API in the background at a fixed interval and keeps the latest data in memory.
Prometheus scrapes are served from that data, so a scrape never hits the Pritunl API directly.

## Metrics

Status metrics follow Pritunl's own states: `0` means online, connected or ok; `1` means offline, disconnected
or failed. Alert on `== 1`.

| Metric | Labels | Value |
|---|---|---|
| `server_status` | `serverName` | 0 online, 1 offline |
| `server_users_connected` | `serverName` | users connected to the server |
| `server_ingress_throughput_bytes` | `serverName` | incoming traffic, bytes – the latest point of Pritunl's 1-minute bandwidth series |
| `server_egress_throughput_bytes` | `serverName` | outgoing traffic, bytes – same source |
| `host_status` | `hostName` | 0 online, 1 offline |
| `host_users_connected` | `hostName` | users connected to the host |
| `host_cpu_utilization` | `hostName` | CPU utilization, percent |
| `host_ram_utilization` | `hostName` | RAM utilization, percent |
| `link_status` | `linkName` | 0 online, 1 offline |
| `link_locations_connection_status` | `srcLinkName`, `dstLinkName` | 0 connected, 1 disconnected, per pair of locations |
| `link_locations_connection_latency` | `srcLinkName`, `srcHostName`, `dstLinkName`, `dstHostName` | the last health-check latency between two link clients, ms |
| `link_locations_connection_latency_min_across_hosts` | `srcLinkName`, `dstLinkName` | the lowest of those latencies across the link clients of a location pair, ms |
| `link_locations_connection_latency_max_across_hosts` | `srcLinkName`, `dstLinkName` | the highest, ms |
| `link_locations_connection_latency_monitoring_status` | `srcLinkName`, `srcHostName`, `dstLinkName`, `dstHostName` | 0 health check ok, 1 failed |

The `srcLinkName` and `dstLinkName` labels carry location names. Servers, hosts and links removed from Pritunl
disappear from the output on the next scrape.

## Configuration

Settings come from environment variables. The app also reads them from `secrets/.env` relative to its working
directory; `secrets/` is excluded from both git and the Docker build context.

| Variable | Required | Description |
|---|---|---|
| `PRITUNL_SERVER_FQDN` | yes | Base URL of the Pritunl console, e.g. `https://vpn.example.com` |
| `PRITUNL_SERVER_API_TOKEN` | yes | API token of a Pritunl administrator with token authentication enabled |
| `PRITUNL_SERVER_API_SECRET` | yes | API secret of the same administrator |
| `PRITUNL_SERVER_CA_PATH` | no | Path to the CA certificate when the console uses a self-signed certificate; the hostname is still verified |
| `PORT` | yes | Port of the `/metrics` endpoint; the Docker image exposes `9130` |
| `LOG_LEVEL` | yes | `info`, `error` or `debug` |
| `DATA_PERIODIC_UPDATE_INTERVAL_SECONDS` | yes | How often the Pritunl API is polled, in seconds |

## Running with Docker

```bash
docker build -t pritunl-exporter .
docker run -d --name pritunl-exporter -p 9130:9130 \
  -v "$PWD/secrets:/home/node/app/secrets:ro" \
  pritunl-exporter
```

with `secrets/.env` like:

```
PORT=9130
LOG_LEVEL=info
DATA_PERIODIC_UPDATE_INTERVAL_SECONDS=30
PRITUNL_SERVER_FQDN=https://vpn.example.com
PRITUNL_SERVER_API_TOKEN=...
PRITUNL_SERVER_API_SECRET=...
```

The image runs as an unprivileged user (UID 10001).

## Prometheus

```yaml
scrape_configs:
  - job_name: pritunl
    static_configs:
      - targets: ['pritunl-exporter:9130']
```

## Running without Docker

```bash
npm ci
mkdir -p secrets   # put .env here
node src/app.js
```

Requires Node.js 22.
