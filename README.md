# Socrata Frontend

## Starting up

The command to run the HTTP server is:

```sh
sudo nginx -c ${PWD}/dev-server/nginx.conf
```

The command to run the Rails application server is:

```sh
bundle exec foreman start
```

Running the Rails stack in development should be done with [foreman](https://github.com/ddollar/foreman).
It will spawn a sidecar process running the [webpack dev server](#webpack),
which allows for re-bundling and automatic reloading on code change.

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

We proxy the webpack dev server through nginx to avoid cross-domain / SSL issues.
The websocket connection is used by the dev server to notify the page of code
changes, where it will either refresh the page, or reload specific assets (CSS,
React components).

The webpack dev server serves its packaged assets from memory.  For production
builds, see the [webpack](#webpack) section.

To build a subset of the webpack bundles, use the `FRONTEND_WEBPACK_BUNDLES` environment variable:

```
FRONTEND_WEBPACK_BUNDLES=admin,dataset-landing-page bundle exec foreman start
```

## Running the app _without_ the local stack

See: https://github.com/socrata/docs/blob/master/connect_local_frontend_to_staging_services.md

## Dependencies

Dependencies are stored in artifactoryonline.com.  A shared username and
password can be found in LastPass under the user "Socrata-frontend."
Instructions on how to use these credentials can be found in the
"Getting Artifacts" section of the [Artifactory Ops Doc](https://docs.google.com/document/d/1KihQV3-UBfZEOKIInsQlloESR6NLck8RuP4BUKzX_Y8)

To install dependencies, run:

`bin/setup_environment.sh`

This will set up NPM properly and will create a user for
`frontend@socrata.com` with password `OpenData!`.

## Tests

tl;dr: Run the Setup steps below, then

```sh
bundle exec rake test
```
This will run all Ruby and Javascript tests.

### Karma tests

We use karma to test our Javascript code. These tests live under `karma`.
There are multiple test suites defined by files named karma.conf.js.

Test suites:

1. Data Lens and Angular common components: `karma/dataCards`
2. Dataset Landing Page: `karma/datasetLandingPage`
3. Old UX tests: `karma/oldUx`

#### Setup

Ensure that you are using Ruby version 2.3.0 or greater.

Make sure you've installed karma-cli and phantomjs globally:

```sh
npm install -g karma-cli karma-phantomjs-launcher phantomjs
```

#### Karma Test Rake Tasks

```sh
bundle exec rake test:js
bundle exec rake test:js:dataCards
bundle exec rake test:js:datasetLandingPage
bundle exec rake test:js:importWizard
bundle exec rake test:js:oldUx
bundle exec rake test:js:adminGoals
```

Each rake task accepts three arguments:

- `watch`: Whether or not to watch files for changes. If a change to any of the
  tested files is detected, the tests will re-run. NOTE: THIS IS TEMPORARILY
  DISABLED due to webpack integration issues, see EN-2662. Using the option will
  cause an explanatory error on the console.
- `browser`: Which browser to run the tests in. Can be `phantom`, `chrome`, or
  `firefox`.
- `reporter`: Which reporter to use. The default is `dots`. You can also specify
  `mocha`, `progress`, `growl`, and `junit`, or install your own.

Example invocation that watches file changes, runs the dataCards tests in chrome,
and uses the mocha reporter:

```sh
bundle exec rake test:js:dataCards[true,chrome,mocha]
```

#### To run a specific Ruby unit test
    ruby -I test path/to/file.rb -n /regex_matcher_for_your_test_name/

    or for rspec
    bundle exec rspec path/to/file.rb:line_number

## Javascript/other asset package management

The frontend has classically used [Jammit](http://documentcloud.github.io/jammit/)
for asset management instead of the standard Rails asset pipeline. All assets
must be added manually to assets.yml, and the appropriate include_javascripts
calls must be included in .erb. If the assets must be loaded on-demand from JS,
make sure the new jammit package is added to the "dump" section of assets.yml
(the JS asset loader reads this section). Please note that though Jammit allows
globs in its package definitions, the JS loader doesn't support globs. This is
only an issue for on-demand loading.

### Webpack

Assets for data lens, dataset landing page, and some old UX pages are packaged
using [webpack](http://webpack.io).

Webpack provides ES2015 w/ JSX transpilation through [Babel](http://babeljs.io),
source map generation, hot module reloading for Babel, angular module annotation
and template in-lining, uglification, and other modern front-end developer niceties.
Its configuration is located in `config/webpack`.  Each file ending in `.config.js`
represents a configuration for a javascript module in the project.

For production, webpack can generate bundles with a fingerprint hash in their
filenames, as well as a manifest file mapping the entry name to its hashed
name.  The Rails initializer in `config/initializers/webpack.rb` holds configuration
for this, and the `include_webpack_bundle` helper in `application_helper.rb` allows
for seamless inclusion of webpack bundles during development and in production.

One-time webpack bundle generation can be done with

```
bundle exec rake assets:webpack
```

Running the Rails stack with [foreman](https://github.com/ddollar/foreman) will
spawn a sidecar process running the webpack dev server, which allows for re-bundling
and automatic reloading on code change.

To enable the workflow:

```sh
bundle install
bundle exec foreman start
```

#### Webpack Loaders

- `babel-loader` for ES2015 and JSX transpilation
- `eslint-loader` for linting and reporting issues to the browser
- `react-hot-loader` for reloading React components in place without a page
  reload, preserving their state
- `ng-annotate-loader` for converting the function syntax of angular's dependency
  injection into something that can be uglified
- `ngtemplate-loader` for allowing `require`ing angular templates and priming the
  template cache


### JSCodeShift

[jscodeshift](https://github.com/facebook/jscodeshift) is a tool for doing AST-to-AST
transformations of JS code.  It is helpful for making changes across a codebase
that are more complicated than just a search and replace.

Under the `tools/jscodeshift-transforms` are a few
transformations for modifying our code in an AST-to-AST manner.

To run a transform, follow the instructions on the jscodeshift project page, but
setting and environment variable of `BABEL_ENV="jscodeshift"` - this ensures
that a clean babel configuration is used for the transforms, alleviating an issue
with babel versions.

### Bower packages

In order to allow clearer management of dependencies, Bower was (eventually) integrated into the asset management system. Unfortunately, the "normal" ways of integrating bower packages and Rails won't work:
- Rails-Assets (a gem source which transparently wraps Bower packages as gems) would result in yet another 3rd-party dependency on deploy. This is too risky, especially as this service is still in beta.
- bower-rails does not introduce a deploy dependency, but since we've butchered the Rails asset pipeline from the beginning this package turned out to be difficult to integrate.

#### Setting up bower locally
1. Install node.js (platform dependent).
2. Install bower: `# npm install -g bower`

### YUI Compressor errors

There is a tool to help us troubleshoot YUI / Jammit compressor errors. It is in the `tools` directory and can be invoked with the command below. It currently expects a working directory to exist which is `../../tmp` which you must create beforehand.

> Note: The Jammit gem will silently fail to use configured compressors if the gem(s) are not installed or fail to load. For example it reverts to using `jsmin` by default (the documentation lies). `jsmin` is known to generate invalid Javascript code.

```sh
tools/verify_compression.rb --all
```
## Dev Proxy (DEPRECATED)

The dev proxy allows NewUX frontend developers to load data from staging or production while still using a local copy of the NewUX. To use just run:

```sh
dev-server/dev-proxy.js
```

## Tools in `bin` directory

These tools can be used to run commands like `rails`, `rake`, `bundler` and so on, when on the application is deployed in a development environment.

An example of starting up the `rails` console on a production host is:

```sh
sudo -u blist RAILS_ENV=production bundle exec bin/rails c
```

An example of running `bundler` on a prouction host:

```sh
sudo -u blist RAILS_ENV=production bundle install --without=development --deployment
```
An example of running `rake` on a production host:

```sh
sudo -u blist RAILS_ENV=productionbundle exec bin/rake routes
```

You can add `-h` for more options. By default it routes requests to `dataspace-demo.test-socrata.com`. That may change in the future.

## Linting

A linter is a tool that we use to find problematic patterns or code that doesn't
adhere to certain style guidelines. For javascript, we use `eslint`, because it's
highly configurable. `eslint` is automatically installed via npm as a dev dependency.
For ruby, we use `reek`, which is installed as a gem.

Although the codebase is automatically linted by Jenkins for each build, you can manually
run linters for different parts of the codebase using the following
rake tasks:

```sh
rake lint:js:all       # Lint the whole javascript codebase
rake lint:js:oldUx     # Lint the old ux
rake lint:js:dataCards # Lint data lens
rake lint:js:datasetLandingPage # Lint dataset landing page
rake lint:js:diff      # Lint javascript files changed on this branch
rake lint:ruby         # Lint ruby code
rake lint              # Lint all the things
```

The lint tasks take an optional argument representing the desired format of the output.
The default for the `js` flavors is 'stylish' and the default for the `ruby` flavors is
'text'. See the [eslint documentation](http://eslint.org/docs/user-guide/command-line-interface#f-format) and the
[reek documentation](https://github.com/troessner/reek#output-formats) for more formats. Example:

```sh
rake "lint:js:all[junit]"
```

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

## Features and feature_flags

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

_Note:_ Most, but not all, of the variables defined below can be specified or overridden via ENV variables, but in some cases, the values come solely from hard-coded values in `config/config.yml`. In other cases the values are specified either within `metachef` in the appropriate environment JSON file (e.g.`environments/production.json`) in the case of the dockerized app running in SEA1, or in `apps-marathon` in the case of the dockerized app running in AWS.

In the case where the configuration variable is being provided as an ENV variable, the variable name is referenced in ALL CAPS, so `airbrake_environnment_name` would be written as `AIRBRAKE_ENVIRONNMENT_NAME`, but when referenced within the code itself, it is most often converted to a variable that is all lowercase. In certain special cases, headers such as `x-socrata-auth` are written in lowercase in the header itself, so be thorough when seaching for usages of any of these variables.

Variable Name | Type | Source | Description
--- | :---: | :---: | ---
`action_controller_perform_caching` | Boolean | Configuration | Rails configuration directive specifying if caching should take place. _Must be set to `true` for Memcached to be used_.
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
`auth0_jwt` | String | Configuration | Javascript Web Token used to authenticate with the Auth0 service.
`bundle_gemfile` | String | Configuration | Path to the `Gemfile` used by the Bundler gem. Programmatically determined to be the base directory of the frontend, but can be overridden by setting this ENV variable.
`canary` | Boolean | Configuration | If set to true the host will visually identify itself as the Canary.
`cetera_host` | URI | Configuration | API endpoint _URI_, **not "host"**, that provides the cetera catalog search service.
`clortho_bucket` | String | Configuration | Bucket identifier in AWS-KMS used to access secret values defined in the Clortho service.
`consul_host` | URI | Configuration | API endpoint _URI_, **not "host"**, used to access the Consul service. Used primarily to access maintenance / downtime notices displayed in the frontend.
`coreservice_uri` | URI | Configuration | API endpoint to which all Core requests are directed, both by the Rails application as well as JavaScript running client side.
`curated_region_job_queue_hostname` | String | Configuration | Host name to connect to for the Curated Region Job Queue.
`curated_region_job_queue_port` | Integer | Configuration | Port to connect to on `curated_region_job_queue_hostname`.
`data_cards_app_token` | String | Configuration | Defines the Socrata API token used by Data Lens when making requests to Core. It is used by both the Rails app and in client side JS. See also `app_token`.
`dataset_landing_page_airbrake_api_key` | String | Configuration | AirBrake API token used specifically to track DSLP errors.
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
`kafka_rest_uri` | URI | Configuration | _Deprecated_ API endpoint used to connect to Kafka.
`log_level` | String | Configuration | Log level directive used when configuring `Rails.logger`.
`memcached_hosts` | String | Configuration | _Comma-separated_ list of URIs _including weighting_ used to connect to Memcached via Dalli. i.e. `10.1.0.72:11211:1,...`
`memcached_value_max_bytes` | Integer | Configuration | Maximum size of values allowed to be written to Memcached via Dalli.
`metrics_dir` | String | Configuration | Directory into which runtime metrics are written for collection into balboa by a separate agent.
`mixpanel_token` | String | Configuration | API token used to report runtime metrics to MixPanel.
`odux_enable_feature_map` | Boolean | Configuration | Enables to use of the feature map (point map) in Data Lens.
`odysseus_app_name` | String | Configuration | The name of the `Odysseus` application server. _Not the name of the app_.
`opendata_ga_tracking_code` | String | Configuration | Google Analytics tracking code used for the Open Data Portal.
`path_info` | String | Rails | The path portion of the incoming request. Used to determine `locale` in some cases. See also `request_path` and `request_uri`. See also `RequestLoggerMiddleware`.
`phidippides_address` | String | Configuration | Host name or IP address of the Phidippides service.
`phidippides_port` | Integer | Configuration | Port to connect to on `phidippides_address`.
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
`recaptcha_public_key` | String | Configuration | Public key used to authenticate with Recaptcha.
`recaptcha_private_key` | String | Configuration | Private key used to authenticate with Recaptcha.
`recaptcha_2_secret_token` | String | Configuration | API token used to authenticate with Recaptcha 2.
`recaptcha_2_site_key` | String | Configuration | API key used to authenticate with Recaptcha 2.
`remote_addr` | String | NGINX | IP Address of the requesting user agent. Typically expected to be the browser itself.
`remote_user` | String | Browser | Used by `RequestLoggerMiddleware` in composing the log message.
`request_method` |String | Rails | Used by `RequestLoggerMiddleware` in composing the log message.
`request_uri` | URI | Rails | URI of the incoming request. Used to identify whether or not the request is for the `version.json` endpoint. See `VersionMiddleware`.
`restore_dataset_days` | Integer | Configuration | Maximum number of days within which a dataset may be restored after deletion.
`rpx_facebook_url` | URI | Configuration | API endpoint used for OAuth with Facebook.
`rpx_googleplus_url` | URI | Configuration | API endpoint used for OAuth with Google+.
`rpx_signin_url` | URI | Configuration | API endpoint used for OAuth with OpenId.
`rpx_twitter_url` | URI | Configuration | API endpoint used for OAuth with Twitter.
`rpx_windowslive_url` | URI | Configuration | API endpoint used for OAuth with WindowsLive.
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
`userzoom` | String | Configuration | Userzoom survey configuration identifiers i.e. CUID.
`whats_new` | String | Configuration | ZenDesk configuration information for collecting what's new news articles from the API.
`x_socrata_auth` | String | Rails | Used to tell Core that the request is from an anonymous user.
`zk_hosts` | URI | Configuration | _Comma-separated_ list of URIs identifying ZooKeeper hosts to use.
`zookeeper_soda_fountain_path` | String | Configuration | `Zookeeper` path to the `SodaFountain` service.
`zookeeper_phidippides_path` | String | Configuration | `Zookeeper` path to the `Phiddipides` service.
