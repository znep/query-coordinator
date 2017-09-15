# Socrata Frontend

## Starting up

The command to run the HTTP server is:

    sudo nginx -c ${PWD}/dev-server/nginx.conf

There are two commands to run the frontend.  The first is a Rails server run by Unicorn:

    # This will install missing Ruby dependencies:
    bin/start_frontend

The second is [webpack dev server](#webpack), which compiles and caches Javascript:

    # This will install and check versions:
    bin/start_webpack

### Development Stack Setup


```
-------------------------------------------------------------------------------
|                                 browser                                     |
-------------------------------------------------------------------------------
              (*)                 (/javascripts/webpack/*)           |
-------------------------------------------------------------        |
|                          nginx                            |   (websocket)
-------------------------------------------------------------        |
         (port 3000)                  (port 3030)                    |
---------------------------  --------------------------------------------------
| Rails via Unicorn (web) |  |          Webpack Dev Server (webpack)          |
---------------------------  --------------------------------------------------
```

#### Webpack

We proxy the webpack dev server through nginx to avoid cross-domain / SSL issues.
The websocket connection is used by the dev server to notify the page of code
changes, where it will either refresh the page, or reload specific assets (CSS,
React components).

The webpack dev server serves its packaged assets from memory. For production
builds, see the [webpack](#webpack) section.

##### Webpack bundles

To build a subset of the webpack bundles, use the `FRONTEND_WEBPACK_BUNDLES` environment variable. For example
to load only the DSLP (Data Set Landing Page) bundle run:

    FRONTEND_WEBPACK_BUNDLES=signin,data-cards,dataset-landing-page npm run webpack-dev-server

This loads the `signin`, `data-cards` and `dataset-landing-page` bundles. For example, if you'd like to be able
to login, and are working on both DSLP and view Data Lenses, you'll need to ensure that all of these bundles are
loaded, otherwise the Data Lens pages and the login page will not work.

If you're curious about the list of webpack bundles that exist that you might be interested in using, look
in the `config/webpack/` directory. Each `.config.js` file corresponds to a loadable bundle (except `base.js`
and `common.js`). The "legacy" Javascript bundle is called `open-data`.

> Note: When making new webpack config files, please refrain from choosing a name that differs from the name of the
feature you're working on. Having to maintain mental mapping for `data-cards` => "Data Lens", and `signin` => "Login"
is needless complexity which should be avoided.

## Running the app _without_ the local stack

Important services are discovered through the
[`config/config.yml`](https://github.com/socrata/frontend/blob/master/config/config.yml) file.
Below is a brief outline of the minimum required changes to run the frontend locally.

> Note! There is a corresponding file `docker/config.yml.j2` that is a template used to derive
> the contents of `config/config.yml` within docker containers.

### Core

Under the `development` section of `config.yml`, set the `coreservice_uri` to the appropriate URI for
the environment you're connecting to. For example, if you want to use the services in the RC environment,
the URI would be `http://lb-vip.aws-us-west-2-rc.socrata.net:8081`.

### Zookeeper

Under the `development` section of `config.yml`, set the `zk_hosts` to the list of hosts providing
Zookeeper services. In the RC environment this value is `'10.112.35.120:2181,10.112.36.163:2181,10.112.41.205:2181'`

### Cetera

Under the `development` section of `config.yml`, set the `cetera_internal_uri` to the appropriate URI for the
environment you're connecting to. In the RC environment, this URI is
`http://cetera.app.marathon.aws-us-west-2-rc.socrata.net`.

For a guide on how to set up Cetera search from Elasticsearch to Frontend, see
[this Google Doc](https://docs.google.com/document/d/1wsslEGnp15STX8UnUFZ_kLzxDHkpLWstvAa-9OS31Gk/edit#)

##### Host Spoofing

> Note: This approach is _only_ necessary if you wish to connect to Cetera in a different environment
> but you are _already running_ the other required services locally and _not_ masquerading as a
> different domain (see Domain below). If you _are_ masquerading as a different domain (i.e. adding an
> entry to your `/etc/hosts` file), then Cetera will perform catalog searches against that domain, and
> setting `CETERA_SPOOF_HOST` is redundant.

In order for Cetera to function properly when connecting to other environments such as RC or staging,
you must also "spoof" the domain that Cetera will search when interacting with the catalog. You must
set this domain using the `CETERA_SPOOF_HOST` environment variable before starting the frontend. The
domain you spoof must be a valid domain in the environment you are connecting to. In the RC environment
one might use `opendata-demo.rc-socrata.com` for example. One way to do this is shown below:

    CETERA_SPOOF_HOST=opendata-demo.rc-socrata.com bundle exec rails s

### Domain

In order to statisfy Core security checks, you must masquerade as a domain that exists in the
environment you are connecting to. For example, in RC one might use `opendata-demo.rc-socrata.com`.
In order to masquerade as this domain, one must set your host name to match. One way of doing
this is to add an alias to `/etc/hosts` for your loopback IP address entry. In this example,
one would change the entry to match:

    127.0.0.1	localhost opendata-demo.rc-socrata.com

### Google Chrome

Finally, in order to satisfy certain security requirements in Google Chrome, you must launch the
application with an extra argument. This is necessary to resolve Chrome refusing to load "insecure"
resources. This manifests as failures when loading CSS or Javascript which breaks page rendering.

    open -a Google Chrome --args --disable-web-security

## Dependencies

Dependencies are stored in repo.socrata.com. A shared username and password can be found in
LastPass under the user "shared-engr". Instructions on how to use these credentials can be
found in the "Getting Artifacts" section of the
[Artifactory Ops Doc](https://docs.google.com/document/d/1xXUHPVtChsk1UHuw2b-m7fslCs4IVe-VTaDwrd4-6-M).

To install dependencies, run:

    bin/setup_environment.sh

This will set up Bundler and NPM properly and will create a user for `frontend@socrata.com` with password `OpenData!`.

## Tests

tl;dr: First run the Setup steps below, then run:

    bundle exec rake test

This will run all Ruby (MiniTest _and_ RSpec) and Javascript (Karma) tests.

#### To run a specific Ruby test

###### For MiniTest tests

    ruby -I test test/.../file.rb -n /regex_matcher_for_your_test_name/

> Note: The regex match technique does not work for MiniTest tests written using the
> [MiniTest](https://github.com/seattlerb/minitest) "spec" style.

###### For RSpec tests

    bundle exec rspec spec/.../file.rb:line_number

> Note: The `line_number` is optional can point to a single test, a context, or a describe
> block and all tests within the enclosing scope will be run. If you're updating RSpec tests
> or writing new ones and you see error messages from VCR complaining about unregistered
> HTTP requests, you can tell VCR to record the HTTP request(s) in your test by setting the
> [record mode](https://relishapp.com/vcr/vcr/v/3-0-3/docs/record-modes) to either
> `:record => :new_episodes` or `:record => :all`.

### Karma tests

We use Karma to test our Javascript code. These tests live under `karma`.
There are multiple test suites defined by files named `karma.conf.js`.

Test suites:

1. Data Lens and Angular common components: `karma/dataCards`
2. Dataset Landing Page: `karma/datasetLandingPage`
3. Category Landing Page: `karma/catalogLandingPage`
4. Visualization Canvas: `karma/visualizationCanvas`
5. Old UX tests: `karma/oldUx`

#### Setup

Ensure that you are using Ruby version 2.3.0 or greater.

#### Karma Test Rake Tasks

```sh
bundle exec rake test:karma
bundle exec rake test:karma:adminGoals
bundle exec rake test:karma:adminActivityFeed
bundle exec rake test:karma:common
bundle exec rake test:karma:dataCards
bundle exec rake test:karma:datasetLandingPage
bundle exec rake test:karma:datasetManagementUI
bundle exec rake test:karma:oldUx
bundle exec rake test:karma:visualizationCanvas
```

Each rake task accepts three arguments:

- `watch`: Whether or not to watch files for changes. If a change to any of the tested files is
detected, the tests will re-run.
> IMPORTANT: If you're using vim, you need to add this to your `.vimrc`:

        set backupcopy=yes

  Otherwise, vim's rename-on-save behavior will confuse webpack. See
  [this issue](https://github.com/webpack/webpack/issues/781#issuecomment-95523711).
- `browser`: Which browser to run the tests in. Can be `phantom`, `chrome`, or `firefox`.
- `reporter`: Which reporter to use. The default is `dots`. You can also specify
  `mocha`, `progress`, `growl`, and `junit`, or install your own.

Example invocation that watches file changes, runs the dataCards tests in chrome,
and uses the mocha reporter:

    bundle exec rake test:karma:dataCards[true,chrome,mocha]

For the simple case where a single test run under Chrome is needed for a
general pass/fail check, a faster parallelized test run is also available:

    bundle exec rake test:karma:parallel

## Javascript/other asset package management

See the [doc/javascript.md#dependency-management](Dependency Management section) of the JavaScript
documentation.

### Webpack

Assets for data lens, dataset landing page, catalog landing page, and some old UX pages are packaged
using [webpack](http://webpack.io).

Webpack provides ES2015 w/ JSX transpilation through [Babel](http://babeljs.io),
source map generation, hot module reloading for Babel, angular module annotation
and template in-lining, uglification, and other modern front-end developer niceties.
Its configuration is located in `config/webpack`. Each file ending in `.config.js`
represents a configuration for a javascript module in the project.

In development, we use `webpack-dev-server`, which serves development bundles of Javascript,
caches the results, and refreshes them whenever a file is saved.  The command for `webpack-dev-server`
is `npm run webpack-dev-server`.  IMPORTANT: If you're using vim, you need to
add this to your `.vimrc`:

    set backupcopy=yes

Otherwise, vim's rename-on-save behavior will confuse webpack. See
[this issue](https://github.com/webpack/webpack/issues/781#issuecomment-95523711).

For production, webpack can generate bundles with a fingerprint hash in their
filenames, as well as a manifest file mapping the entry name to its hashed
name. The Rails initializer in `config/initializers/webpack.rb` holds configuration
for this, and the `include_webpack_bundle` helper in `application_helper.rb` allows
for seamless inclusion of webpack bundles during development and in production.

One-time webpack bundle generation can be done with:

    bundle exec rake assets:webpack

The rake command above runs `npm run build:prod` which generates the production assets
that will be used by the frontend when running in production. You can test the assets
generated by this process by starting the frontend with the following environment
variables set, which simulates running webpack in production:

    WEBPACK_USE_MANIFEST=true WEBPACK_USE_DEV_SERVER=false rails s

### JSCodeShift

[jscodeshift](https://github.com/facebook/jscodeshift) is a tool for doing AST-to-AST transformations of JS code.
It is helpful for making changes across a codebase that are more complicated than just a search and replace.

Under the `tools/jscodeshift-transforms` are a few transformations for modifying our code in an AST-to-AST manner.

To run a transform, follow the instructions on the jscodeshift project page, but setting and environment variable
of `BABEL_ENV=jscodeshift` — this ensures that a clean babel configuration is used for the transforms, alleviating
an issue with babel versions.

## Tools in `bin` directory

These tools can be used to run commands like `rails`, `rake`, `bundler` and so on, when on the application is
deployed in a development environment.

An example of starting up the `rails` console on a production host is:

    sudo -u blist RAILS_ENV=production bundle exec bin/rails c

An example of running `bundler` on a prouction host:

    sudo -u blist RAILS_ENV=production bundle install --without=development --deployment

An example of running `rake` on a production host:

    sudo -u blist RAILS_ENV=productionbundle exec bin/rake routes

You can add `-h` for more options. By default it routes requests to `dataspace-demo.test-socrata.com`.
That may change in the future.

## Linting

A linter is a tool that we use to find problematic patterns or code that doesn't
adhere to certain style guidelines. For javascript, we use `eslint`, because it's
highly configurable. `eslint` is automatically installed via npm as a dev dependency.
For ruby, we use `reek`, which is installed as a gem.

Although the codebase is automatically linted by Jenkins for each build, you can manually
run linters for different parts of the codebase using the following
rake tasks:

```sh
rake lint:eslint:all                   # Lint the whole javascript codebase
rake lint:eslint:adminActivityFeed     # Lint admin activity feed page
rake lint:eslint:oldUx                 # Lint the old ux
rake lint:eslint:catalogLandingPage    # Lint catalog landing page
rake lint:eslint:dataCards             # Lint data lens
rake lint:eslint:datasetLandingPage    # Lint dataset landing page
rake lint:eslint:datasetManagementUI   # Lint dataset management UI
rake lint:eslint:diff                  # Lint javascript files changed on this branch
rake lint:ruby                         # Lint ruby code
rake lint                              # Lint all the things
```

The lint tasks take an optional argument representing the desired format of the output.
The default for the `js` flavors is 'stylish' and the default for the `ruby` flavors is
'text'. See the [eslint documentation](http://eslint.org/docs/user-guide/command-line-interface#f-format) and the
[reek documentation](https://github.com/troessner/reek#output-formats) for more formats. Example:

    rake lint:js:all[junit]

If you're too cool for rake tasks, you can also run `npm run eslint -- [args]`
or `bundle exec reek [args]` on the command line and supply your own arguments.
You can find our specific configuration options for `eslint` in `package.json`
under the `eslintConfig` key. Currently we use no configuration options for
`reek`.

## Dependency docs

### JavaScript

* [AngularJS](https://docs.angularjs.org)
* [Chai](http://chaijs.com/api/bdd/)
* [D3](https://github.com/mbostock/d3/wiki/API-Reference)
* [jQuery](http://api.jquery.com/)
* [Leaflet](http://leafletjs.com/reference.html)
* [Lodash](http://lodash.com/docs)
* [Mocha](http://mochajs.org/)
* [Moment.js](momentjs.com/docs)
* [RxJS](https://github.com/Reactive-Extensions/RxJS/tree/master/doc)
* [Sinon](http://sinonjs.org/docs/)
* [Squire](https://github.com/neilj/Squire/blob/master/README.md)
* [Webpack](http://webpack.github.io/docs/)

### Ruby

* [Minitest](http://docs.seattlerb.org/minitest/)
* [Mocha](http://gofreerange.com/mocha/docs/)
* [Rails (APIdock)](http://apidock.com/rails/)
* [Rails (official)](http://api.rubyonrails.org/)
* [RSpec](http://rspec.info/documentation/)
* [Webmock](https://github.com/bblimke/webmock)
* [VCR](https://relishapp.com/vcr/vcr/docs)

## Features and feature_flags

To enable logging of cache hits for feature flag requests to signaller, set the environment
variable `LOG_FEATURE_FLAG_CACHING` to `true`.

#### Those necessary for geospatial import

##### These feature_flags must be turned on:
* enable\_ingress\_geometry\_types
* geo\_imports\_to\_nbe\_enabled
* enable\_spatial\_lens\_region_coding

##### These Features must be added to your domain(s):
* mondara\_nbe
* geospatial

## Configuration variables

Below is the list of known environment variables that are used by the frontend. In most cases these are used to define values used by the Rails application itself, but in some other cases, they are used to provide information to third party services and APIs.

Most, but not all, of the variables defined below are specified as, or can optionally be overridden by ENV variables, but in a
small number of cases, the values are hard-coded in `config/config.yml`. In the remainder, the values are specified in `apps-marathon/resources/frontend.json` with selected overrides for different environments specified in `params/*/frontend.toml` where `*` may be one of `eu-west-1-prod`, `fedramp-prod`, `infrastucture`, `local`, `rc`, or `staging`. The values specified in the `apps-marathon` configuration files are injected into `config/config.yml` by way of the `docker/config.yml.j2` template file. Other values are simply set as ENV variables.

> Note! Any changes made to `config/config.yml` to add new configuration directives must also be matched by requisite changes to `docker/config.yml.j2` accordingly.

In the case where the configuration variable is being provided as an ENV variable, the variable name is referenced in ALL CAPS, so `airbrake_environnment_name` would be written as `AIRBRAKE_ENVIRONNMENT_NAME`, but when referenced at runtime within the code, it is most often converted to a variable that is all lowercase. In certain special cases, headers such as `x-socrata-auth` are written in lowercase in the header itself, so be thorough when seaching for usages of any of these variables.

Variable Name | Type | Source | Description
--- | :---: | :---: | ---
`action_controller_perform_caching` | Boolean | Configuration | Rails configuration directive specifying if caching should take place. _Must be set to `true` for Memcached to be used_.
`atomic_metrics_flush` | Boolean | Configuration | Rails configuration directive specifying if metrics will be accumulated in single file for two minutes or write atomic files for each metrics batch produced. _Must be set to `true` for atomic metrics file to be written_.
`cache_classes` | Boolean | | Configuration | Rails configuration directive specifying whether classes should be cached. Should be `true` in production.
`consider_all_requests_local` | Boolean | Configuration | Rails configuration directive specifying if full error reports should be displayed. Should be `false` in production.
`airbrake_api_key` | String | Configuration | API key used to report errors to the AirBrake service.
`airbrake_environnment_name` | String | Configuration | Name of the environment to identify the project in AirBrake. Must match the value as configured in the AirBrake service.
`airbrake_http_proxy` | URI | Configuration | Proxy host URI used to connect to Airbrake _Citation needed_.
`ark_host` | String | Docker | Host name of the docker host running this container. Used to identify when the app is running with a container. Currently used solely by `LocaleMiddleware`. _To be deprecated?_
`app_token` | String | Configuration | TheSocrata API token used when making request to Core by the frontend for most _but not all_ requests. See also `data_cards_app_token`.
`auth0_uri` | String | Configuration | _Host name_, **not "URI"**, used to connect to the Auth0 service.
`auth0_id` | String | Configuration | API token used to authenticate with the Auth0 service.
`auth0_secret` | String | Configuration | Secret key used to authenticate with the Auth0 service.
`auth0_database_connection` | String | Configuration | Which auth0 "custom database" connection to use to for username/password logins. If not defined, username/password logins submit straight to Rails.
`default_session_time_minutes` | String | Configuration | The number of minutes the session token cookie will live as a fallback if the specific time is not specified in the expected place.
`bundle_gemfile` | String | Configuration | Path to the `Gemfile` used by the Bundler gem. Programmatically determined to be the base directory of the frontend, but can be overridden by setting this ENV variable.
`canary` | Boolean | Configuration | If set to true the host will visually identify itself as the Canary.
`catalog_landing_page_airbrake_api_key` | String | Configuration | AirBrake API token used to track CLP errors.
`catalog_landing_page_airbrake_project_id` | String | Configuration | AirBrake Project ID used to track CLP errors.
`cetera_internal_uri` | URI | Configuration | Internal API endpoint that provides the cetera catalog search service.
`clortho_bucket` | String | Configuration | Bucket identifier in AWS-KMS used to access secret values defined in the Clortho service.
`consul_host` | URI | Configuration | API endpoint _URI_, **not "host"**, used to access the Consul service. Used primarily to access maintenance / downtime notices displayed in the frontend.
`coreservice_uri` | URI | Configuration | API endpoint to which all Core requests are directed, both by the Rails application as well as JavaScript running client side.
`curated_region_job_queue_hostname` | String | Configuration | Host name to connect to for the Curated Region Job Queue.
`curated_region_job_queue_port` | Integer | Configuration | Port to connect to on `curated_region_job_queue_hostname`.
`data_cards_app_token` | String | Configuration | Defines the Socrata API token used by Data Lens when making requests to Core. It is used by both the Rails app and in client side JS. See also `app_token`.
`dataset_landing_page_airbrake_api_key` | String | Configuration | AirBrake API token used specifically to track DSLP errors.
`dataset_landing_page_airbrake_project_id` | String | Configuration | AirBrake Project ID used specifically to track DSLP errors.
`disable_zookeeper` | String | Configuration | Used by the `zookeeper_discovery.rb` initializer to selectively initialize the `ZookeeperDiscovery` class.
`enable_png_download_ui` | Boolean | Configuration | Enables the PNG download feature in Data Lens. It should should be deprecated in favor of Feature Flags.
`enable_search_suggestions` | Boolean | Configuration | Enables the Spandex auto-suggestion search feature in Data Lens. It should be deprecated in favor of Feature Flags.
`env` | String | Configuration | Used as a fallback to determine which environment the application is running when `rails_env` is not present.
`esri_crawler_hostname` | String | Configuration | Host name used to connect to the ESRI crawler service.
`esri_crawler_port` | String | Configuration | Port used when connecting to `esri_crawler_hostname`.
`feature_map_disable_pan_zoom` | Boolean | Configuration | Disables pan/zoom on extremely large feature maps to prevent a possible performance impact on backend services.
`feature_map_features_per_tile` | Integer | Configuration | Sets the maximum number of features to render per tile for feature maps. Default value might be 50,000.
`feature_map_zoom_debounce` | Integer | Configuration | Sets the debounce-time for map zoom mouse clicks in milliseconds. This is to prevent excessive requests to the backend API endpoint.
`http_accept` | String | Browser | Used in metrics logging by the `LogRefererMiddleware`.
`http_port` | Integer | Configuration | HTTP port that the HTTP server listens on. _Citation needed_. _Likely deprecated_.
`http_referer` | URI | Browser | Used in metrics logging by the `LogRefererMiddleware`.
`http_user_agent` | String | Browser | User agent string provided in the request used to identify mobile users and other identification purposes (e.g. GlobalSign, etc.)
`http_version` | String | Browser | Used by `RequestLoggerMiddleware` in composing the log message.
`http_x_forwarded_for` | URI | NGINX | URI of the originating request. See also `remote_addr`, `remote_user`, `request_method`, `path_info`, `query_string`, `http_version` referenced in `RequestLoggerMiddleware`.
`http_x_forwarded_host` | String | NGINX | Host name of the originating request. This is the cname used to lookup the domain in Core.
`http_x_forwarded_proto` | String | NGINX | Protocol of the originating request. See also `http_x_ssl_request` and `SslEnforcer`.
`http_x_ssl_request` | String | NGINX | Protocol of the originating request. Expected to be `https` or the request will be redirected to use that scheme. Used as a fallback if `http_x_forwarded_proto` is not present. See `SslEnforcer`.
`import_status_service_hostname` | String | Configuration | Host name to connect to for the ISS.
`import_status_service_port` | Integer | Configuration | Port to connect to on `import_status_service_hostname`.
`internal_asset_manager_airbrake_api_key` | String | Configuration | AirBrake API token used to track Internal Asset Manager errors.
`internal_asset_manager_airbrake_project_id` | String | Configuration | AirBrake Project ID used to track Internal Asset Manager errors.
`dataset_management_api_hostname` | String | Configuration | Host name to connect to for DSMAPI.
`dataset_management_api_port` | Integer | Configuration | Port to connect to on `dataset_management_api_hostname`.
`log_level` | String | Configuration | Log level directive used when configuring `Rails.logger`.
`memcached_config_endpoint` | String | Configuration | A single host/port string used to connect to Memcached via Dalli. i.e. `fronten-fedramp-prod.f35m2z.cfg.use1.cache.amazonaws.com:11211`.
`memcached_host` | String | Configuration | A single host/port string _optionally including weighting_ used to connect to Memcached via Dalli. i.e. `10.1.0.72:11211:1` where `:1` is the optional weighting.
`memcached_hosts` | String | Configuration | _Comma-separated_ list of host/port strings _optionally including weighting_ used to connect to Memcached via Dalli. i.e. `10.1.0.72:11211:1,...` where `:1` is the optional weighting.
`memcached_keyspace` | String | Confiuration | String prefix used to namespace all keys stored in Memcached. Can be changed to assist with upgrades or other large-scale rollouts.
`memcached_value_max_bytes` | Integer | Configuration | Maximum size of values allowed to be written to Memcached via Dalli.
`metrics_dir` | String | Configuration | Directory into which runtime metrics are written for collection into balboa by a separate agent.
`mixpanel_token` | String | Configuration | API token used to report runtime metrics to MixPanel.
`odysseus_app_name` | String | Configuration | The name of the `Odysseus` application server. _Not the name of the app_.
`opendata_ga_tracking_code` | String | Configuration | Google Analytics tracking code used for the Open Data Portal.
`op_measure_airbrake_api_key` | String | Configuration | AirBrake API token used specifically to track OP measure errors.
`op_measure_airbrake_project_id` | String | Configuration | AirBrake project associated with OP measure assets.
`path_info` | String | Rails | The path portion of the incoming request. Used to determine `locale` in some cases. See also `request_path` and `request_uri`. See also `RequestLoggerMiddleware`.
`pendo_token` | String | Configuration | Pendo API token required to load pendo tracking script.
`polaroid_hostname` | String | Configuration | Host name to connect to for the Polaroid page snapshot service.
`polaroid_port` | Integer | Configuration | Port to connect to on `polaroid_host`.
`port` | Integer | Configuration | _Deprecated_ Port to expose in Docker when running in a docker container.
`query_string` | String | Rails | Used by `RequestLoggerMiddleware` in composing the log message.
`rails_log_file` | String | Configuration | File name into which to write logs from the Rails application. Can optionally be set to `STDOUT` OR `STDERR`.
`rack_env` | String | Configuration | Used to determine which environment the application is running in (e.g. `production`, `rc`, etc.). See also `rails_env`. Used primarily in `SslEnforcerConstraint`.
`rails_env` | String | Configuration | Used as a fallback to determine which environment the application is running when `rack_env` is not present.
`rack.session` | String | Rails | Used by `SocrataCookieStore` to find session information for every request.
`rack.session.options` | String | Rails | Used by `SocrataCookieStore` to find session information for every request.
`rails_serve_static_files` | Boolean | Configuration | Flag to indicate if the Rails application should serve static assetss. _Must be `true` in dockerized environments_.
`recaptcha_2_secret_token` | String | Configuration | API token used to authenticate with Recaptcha 2.
`recaptcha_2_site_key` | String | Configuration | API key used to authenticate with Recaptcha 2.
`remote_addr` | String | NGINX | IP Address of the requesting user agent. Typically expected to be the browser itself.
`remote_user` | String | Browser | Used by `RequestLoggerMiddleware` in composing the log message.
`request_method` |String | Rails | Used by `RequestLoggerMiddleware` in composing the log message.
`request_uri` | URI | Rails | URI of the incoming request. Used to identify whether or not the request is for the `version.json` endpoint. See `VersionMiddleware`.
`restore_dataset_days` | Integer | Configuration | Maximum number of days within which a dataset may be restored after deletion.
`secondary_group_identifier` | String | Configuration | Identifier of the Spandex secondary store used by the auto-suggest service.
`secret_key_base` | String | Configuration | Secret key value used to initialize sessions in Rails. _Must be set or the app cannot start_.
`server_software` | String | NGINX | Used by `RequestLoggerMiddleware` to identify when running under Apache. Used to selectively log to `STDERR` if using Apache. _Citation needed_
`session_salt` | String | Configuration | Salt value used to initialize sessions in Rails. _Must be set or the app cannot start_.
`session_store_secret` | String | Configuration | Secret key value used to store sessions in Rails. _Must be set or the app cannot start_.
`shape_file_region_query_limit` | Integer | Configuration | Maximum number of regions to fetch when reading shapefiles.
`sitemap_s3_url` | URI | Configuration | URI pointing to where in S3 robots should retrieve the sitemap from.
`socrata.core-session` | String | Configuration | Used by `SocrataCookieStore` to find session information for every request.
`soda_fountain_address` | String | Configuration | Host name or IP address of the `SodaFountain` service.
`soda_fountain_port` | Integer | Configuration | Port used when connecting to `soda_fountain_address`.
`ssl_port` | Integer | Configuration | HTTPS server port that HTTP server listens on. _Citation needed_. _Likely deprecated_.
`standard_ga_tracking_code` | String | Configuration | Google Analytics tracking code used across all domains. _Citation needed_.
`statsd_enabled` | Boolean | Configuration | Enable collection of stats using `statsd`.
`statsd_server` | String | Configuration | Host name of the `statsd` server to connect to when `statsd_enabled` is `true`.
`threadpool_count` | Integer | Configuration | Size of the `QueueThreadpool` used when rendering Canvas2 widgets.
`tileserver_host` | String | Configuration | _Single_ **internally accessible** host to connect to in a specific environment for the Tile Server service.
`tileserver_hosts` | String | Configuration | _Comma-separated_ list of **publicly accessible** host names to connect to for the Tile Server service.
`unicorn_listen_port` | Integer | Configuration | Port that Unicorn will listen on to service incoming requests.
`unicorn_timeout` | Integer | Configuration | Number of milliseconds a Unicorn worker will wait for a request to be serviced by Rails before giving up.
`unicorn_worker_processes` | Integer | Configuration | Number of Unicorn worker processes to run at startup.
`visualization_canvas_airbrake_api_key` | String | Configuration | AirBrake API token used specifically to track vizcan errors.
`visualization_canvas_airbrake_project_id` | String | Configuration | AirBrake project associated with vizcan assets.
`qualtrics_admin_survey_id` | String | Configuration | Qualtrics survey identifier
`qualtrics_profile_survey_id` | String | Configuration | Qualtrics survey identifier
`zendesk_notifications` | String | Configuration | ZenDesk configuration information for collecting what's new news articles from the API.
`x_socrata_auth` | String | Rails | Used to tell Core that the request is from an anonymous user.
`zk_hosts` | URI | Configuration | _Comma-separated_ list of URIs identifying ZooKeeper hosts to use.
`zookeeper_soda_fountain_path` | String | Configuration | `Zookeeper` path to the `SodaFountain` service.

## Translations & LocaleApp

Only `en.yml` is checked into the codebase, and it should be the source of truth for all the latest English translations.
If you add a new translation or update an existing one, once it is merged you should be able to login to LocaleApp and optionally update the translations for the other languages.

[Updating translations](https://github.com/socrata/platform-ui/blob/master/frontend/doc/update-translations.md)

If you wish to test other languages locally, you can pull the LocaleApp translations by following these steps:

- Ensure you have a `LOCALEAPP_API_KEY` set in your `frontend/.env` file:
```
LOCALEAPP_API_KEY=[KEY FROM LASTPASS]
```
- Run the `bin/pull_translations` script

After you successfully pull translations, follow the instructions here to [configure localization for a domain](https://sites.google.com/a/socrata.com/client-services/localization/localizing-content).

## Styles

  We load our styles through a home-grown StylesController, which compiles SCSS to CSS and caches the results.

## Further Reading

- [JavaScript documentation](doc/javascript.md)
