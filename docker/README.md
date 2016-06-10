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

## Run locally
```
docker run -e AIRBRAKE_API_KEY=2aa9cf5b8e41f462f46fe1cfd07aed69 -e APP_TOKEN=U29jcmF0YS0td2VraWNrYXNz0 -e AUTH0_URI=socrata.auth0.com -e CURATED_REGION_JOB_QUEUE_PORT=80 -e DATA_CARDS_APP_TOKEN=zvQamMSTi4GNuZWWDwjLdLPhW -e ENABLE_PNG_DOWNLOAD_UI=true -e ENABLE_SEARCH_SUGGESTIONS=true -e FEATURE_MAP_DISABLE_PAN_ZOOM=false -e IMPORT_STATUS_SERVICE_PORT=80 -e LOG_LEVEL=DEBUG -e MIXPANEL_TOKEN=59b0b54697603105463834afdf20accf -e ODUX_ENABLE_FEATURE_MAP=true -e ODYSSEUS_APP_NAME=localhost -e ODYSSEUS_HOST=localhost -e POLAROID_PORT=80 -e RAILS_LOG_FILE=STDOUT -e STANDARD_GA_TRACKING_CODE=UA-51039907-4 -e UNICORN_LISTEN_PORT=3000 -e UNICORN_TIMEOUT=300 -e UNICORN_WORKER_PROCESSES=4 -e USERZOOM_CUID=C95E515772DAE311BEDA0022196C4538 -e WORKER_PROCESSES=4 -e AIRBRAKE_ENVIRONNMENT_NAME=development -e CORESERVICE_URI=localhost:8081 -e CETERA_HOST=http://localhost:5704 -e CURATED_REGION_JOB_QUEUE_HOSTNAME=localhost -e IMPORT_STATUS_SERVICE_HOSTNAME=localhost -e KAFKA_REST_URI=http://localhost:8082 -e MEMCACHED_HOSTS=localhost:11211 -e POLAROID_HOSTNAME=polaroid.app.marathon.aws-us-west-2-prod.socrata.net -e RAILS_ENV=development -e TILESERVER_HOST=localhost -e TILESERVER_HOSTS=localhost -e ZOOKEEPER_HOSTS=localhost:2181 d63ae37d5261
```
> Note: `d63ae37d5261` is the SHA of the docker image you wish to start

## List all local docker images
```
docker images
```
