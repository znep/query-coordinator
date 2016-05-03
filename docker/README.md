# Socrata Frontend in Docker

> **NOTE:** The source of truth is the `config.yml.j2` file in this directory.
> This README has fallen behind; devs aren't looking at it often enough for us
> to remember to keep it updated, so we need to rethink its purpose.

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

- `CACHE_CLASSES` defaults to true
- `CONSIDER_ALL_REQUESTS_LOCAL` defaults to false
- `ACTION_CONTROLLER_PERFORM_CACHING` defaults to true
- `SERVE_STATIC_ASSETS` defaults to true
- `MEMCACHE_VALUE_MAX_BYTES` defaults to 2000000

_Note: An IP can be provided with `EXTERNAL_IP` that will be used for the `ZOOKEEPER_HOSTS`,
`CORESERVICE_URI`

_Note: Since the template expansion is done by python, you cannot use ruby-isms
in the defaults, e.g. 2000 cannot be written as 2\_000.

## Build locally
```
docker build -f Dockerfile.local -t socrata/frontend .
```
