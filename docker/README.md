# Socrata Frontend in Docker

Required ENV vars:

- `CORESERVICE_URI` - The host and port to use for communicating with Core server
- `ZOOKEEPER_HOSTS` - A comma-separated list of Zookeeper hosts with ports to use
- `ODYSSEUS_HOST` - The host to use for communicating with Odysseus

Optional ENV vars:

- `AUTH0_URI` and `AUTH0_CLIENT_ID` and `AUTH0_CLIENT_SECRET` and `AUTH0_JWT`
- `METRICS_DIR`
- `MIXPANEL_TOKEN`
- `POLAROID_HOSTNAME` and `POLAROID_PORT`
- `STATSD_ENABLED` and `STATSD_SERVER`
- `TILESERVER_HOSTS` - A comma-separated list of public tileserver API hosts

Additional optional ENV vars for the config/environments/<rails_env>.rb:

- `CACHE_CLASSES` defautls to true
- `CONSIDER_ALL_REQUESTS_LOCAL` defaults to false
- `ACTION_CONTROLLER_PERFORM_CHECKING` defaults to true
- `SERVCE_STATIC_ASSEST` defaults to true

_Note: An IP can be provided with `EXTERNAL_IP` that will be used for the `ZOOKEEPER_HOSTS`,
`CORESERVICE_URI`

## Build locally
```
docker build -f Dockerfile.local -t socrata/frontend .
```
