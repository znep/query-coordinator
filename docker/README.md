# Socrata Frontend in Docker

Required ENV vars:

- `CORESERVICE_URI` - The host and port to use for communicating with Core server
- `ZOOKEEPER_HOSTS` - A comma-separated list of Zookeeper hosts with ports to use


Optional ENV vars:

- `ACTIVEMQ_HOSTS`
- `AUTH0_URI` and `AUTH0_CLIENT_ID` and `AUTH0_CLIENT_SECRET`
- `INTERCESSIO_SERVER`
- `METRICS_DIR`
- `MIXPANEL_TOKEN`
- `POLAROID_HOSTNAME` and `POLAROID_PORT`
- `STATSD_ENABLED` and `STATSD_SERVER`
- `TILESERVER_HOSTNAME` and `TILESERVER_PORT`
- `TILESERVER_HOSTS` - A comma-separated list of public tileserver API hosts

_Note: An IP can be provided with `EXTERNAL_IP` that will be used for the `ZOOKEEPER_HOSTS`,
`CORESERVICE_URI`, and `ACTIVEMQ_HOSTS`_

## Build locally
```
docker build -f Dockerfile.local -t socrata/frontend .
```
