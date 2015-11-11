# Socrata Frontend

## Starting up

The command to run the Rails application server is:

```sh
bundle exec unicorn_rails -c config/unicorn.rb
```

The command to run the HTTP server is:
```sh
sudo nginx -c ${PWD}/dev-server/nginx.conf
```

## Dependencies

Dependencies are stored in artifactoryonline.com.  A shared username and
password can be found in LastPass under the user "Socrata-frontend."
Instructions on how to use these credentials can be found in the
"Getting Artifacts" section of the [Artifactory Ops Doc](https://drive.google.com/a/socrata.com/folderview?ddrp=1&id=0B8bqh9w-C6AnNDJiNjYwMzgtZjJjNS00NWY0LTllNGEtNDdlNTdkNjhkZGY3#)

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
1. Old UX tests: karma/oldUx/karma.conf.js
2. Data Lens and Angular common components: karma/dataCards/karma.conf.js

#### Setup

Ensure that you are using Ruby version 1.9.3 or greater.

Make sure you've installed karma-cli and phantomjs globally:

```sh
npm install -g karma-cli phantomjs karma-phantomjs-launcher grunt
```

#### Karma Test Rake Tasks

```sh
bundle exec rake test:js
bundle exec rake test:js:dataCards
bundle exec rake test:js:oldUx
```

Each rake task accepts three arguments:

- `watch`: Whether or not to watch files for changes. If a change to any of the
  tested files is detected, the tests will re-run.
- `browser`: Which browser to run the tests in. Can be `phantom`, `chrome`, or
  `firefox`.
- `reporter`: Which reporter to use. The default is `dots`. You can also specify
  `mocha`, `progress`, `growl`, and `junit`, or install your own.

Example invocation that watches file changes, runs the dataCards tests in chrome,
and uses the mocha reporter:

```sh
bundle exec rake test:js:dataCards[true,chrome,mocha]
```

#### To generate coverage results

Just run `bundle exec rake test:karma`, the karma test task will run karma
 configured to compute coverage. Coverage results will live in
  frontend/karma/coverage-reports/ for all tested projects.

#### To run tests in SauceLabs

Karma knows how to launch tests against browsers specified in supported_browsers.json
(see karma/dataCards/karma.conf.js to see how we teach this to Karma).

Our current SOP is to support two major versions back from a browser's latest version.
To speed up testing, we define a set of critical browsers (defined as the latest version
of all browsers, plus all supported versions of IE).

Please be judicious in your use of SauceLabs - we are limited in usage (see
the SauceLabs dashboard using the creds in LastPass to see how much we have
remaining for the month).

The rake task is

```sh
rake test:karma_sauce [CRITICAL_BROWSERS_ONLY=true|false] [BROWSER_FAMILIES="comma-separated browser names"]
```

CRITICAL_BROWSERS_ONLY tells the runner to only run tests on critical browsers.
It defaults to false (run on all browsers).

BROWSER_FAMILIES limits the run to a comma-separated list of browser names (chrome, internet explorer, etc)

Examples:
- To launch on _all_ supported browsers: `rake test:karma_sauce`
- To launch on only critical browsers: `rake test:karma_sauce CRITICAL_BROWSERS_ONLY=true`
- To launch on only a particular set of browser families: `rake test:karma_sauce BROWSER_FAMILIES="safari, internet explorer"`
- To launch only a particular browser, run `karma start` manually and specify a browser name formatted like:
  "saucelabs {browser name} {browser version} {platform}

  So for instance to run tests on Safari 7 on Mavericks, do:

  ```sh
  (cd karma/dataCards && karma start karma.conf.js --browsers "saucelabs safari 7 os x 10.9" --singleRun true)
  ```

  See supported_browsers.json for a list of values we support. You can add new
  browsers to this file - see https://saucelabs.com/platforms/webdriver for a
  list of browsers SauceLabs supports.

When running tests on SauceLabs through a Sauce Connect tunnel that is started
manually (through the Sauce OSX App or the Sauce Connect Jenkins Plugin), and a
tunnel identifier is specified, you must make sure to provide the same
`SAUCE_TUNNEL_IDENTIFIER` as an environment variable so that the Karma sauce
test runner will use the identified tunnel.

If using a Sauce Connect tunnel without a tunnel identifier, the karma sauce
test runner will default to using the unnamed tunnel.

#### To exclude groups of tests

NOTE: THIS IS NOT SUPPORTED IN THE RAKE TASKS
When launching karma directly, you may pass an --exclude-groups flag to not run
a certain subset of tests. Groups are defined in karma.conf.js and as of this
writing are: controllers directives filters integration services models util.

Example:

```sh
(cd karma/dataCards && karma start karma.conf.js --browsers PhantomJS --singleRun false --exclude-groups "directives integration")
```

This only works for Data Lens/Angular component tests (not old UX).

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

## Babel transpilation

We have introduced transpilation of ES2015 / JSX source code via [Babel](http://babeljs.io). In order to run Babel, first install version 5 of Babel (as specified in the package.json file used by NPM) by `npm install`.

> Note: If you had already installed a different version of `babel` by other means, you will have to uninstall it before running the above command.

One-time babel compilation can be done by running `bundle exec rake assets:babel` to transpile the ES2015 / JSX assets.

Running the Rails stack with [foreman](https://github.com/ddollar/foreman) allows
watching of source changes and automatic compilation.

To enable the workflow:

```sh
bundle install
foreman start
```

### YUI Compressor errors

There is a tool to help us troubleshoot YUI / Jammit compressor errors. It is in the `tools` directory and can be invoked with the command below. It currently expects a working directory to exist which is `../../tmp` which you must create beforehand.

```sh
tools/verify_compression.rb --all
```

### Bower packages

In order to allow clearer management of dependencies, Bower was (eventually) integrated into the asset management system. Unfortunately, the "normal" ways of integrating bower packages and Rails won't work:
- Rails-Assets (a gem source which transparently wraps Bower packages as gems) would result in yet another 3rd-party dependency on deploy. This is too risky, especially as this service is still in beta.
- bower-rails does not introduce a deploy dependency, but since we've butchered the Rails asset pipeline from the beginning this package turned out to be difficult to integrate.

#### Setting up bower locally
1. Install node.js (platform dependent).
2. Install bower: `# npm install -g bower`

## Dev Proxy

The dev proxy allows NewUX frontend developers to load data from staging or production while still using a local copy of the NewUX. To use just run:

```sh
dev-server/dev-proxy.js
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

### Ruby

* [Minitest](http://docs.seattlerb.org/minitest/)
* [Mocha](http://gofreerange.com/mocha/docs/)
* [Rails (APIdock)](http://apidock.com/rails/)
* [Rails (official)](http://api.rubyonrails.org/)
* [RSpec](http://rspec.info/documentation/)
* [Webmock](https://github.com/bblimke/webmock)
