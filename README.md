# Socrata Frontend

## Starting up

The basic bootstrap command is:

    JS_LOGGING=true rails s

Or if you want to start a pool of workers using Unicorn:

    bundle exec unicorn_rails -c config/unicorn.rb

_Note: The example above that uses Unicorn is required if you want to run Polaroid locally and be able to download PNG images from Data Lens._

## Tests

tl;dr: Run the Setup steps below, then
```
bundle exec rake test
```
This will run all Ruby and Javascript tests.

### Karma tests

We use karma to test our Javascript code. These tests live under karma-test.
There are multiple test suites defined by files named karma-unit.js.

Test suites:
1. Old UX tests: karma-test/old-ux/karma-unit.js
2. Data Lens and Angular common components: karma-test/dataCards/karma-unit.js

#### Setup

Ensure that you are using Ruby version 1.9.3 or greater.

Make sure you've installed karma-cli and phantomjs globally:
```
npm install -g karma-cli phantomjs karma-phantomjs-launcher grunt
```

#### To run all Javascript tests once

```
bundle exec rake test:karma
```

#### To watch file changes and run tests in phantom:

Note that this specifies a particular karma test suite. If you want to watch _all_
karma suites, you'll have to run all the below commands.

Note that if you change the contents of karma-unit.js, you'll have to restart
the command.

1. Old UX
```
(cd karma-test/old-ux && karma start karma-unit.js --browsers PhantomJS --singleRun false)
```
2. Data Lens
```
(cd karma-test/dataCards && karma start karma-unit.js --browsers PhantomJS --singleRun false)
```

#### To watch file changes and run tests in Chrome (so you can open up the inspector for app or test code):

1. Old UX
```
(cd karma-test/old-ux && karma start karma-unit.js --browsers Chrome --singleRun false)
```
2. Data Lens
```
(cd karma-test/dataCards && karma start karma-unit.js --browsers Chrome --singleRun false)
```

#### To generate coverage results
Just run `bundle exec rake test:karma`, the karma test task will run karma configured to compute coverage. Coverage results will live in frontend/karma-test/coverage-reports/ for all tested projects.

#### To run tests in SauceLabs

Karma knows how to launch tests against browsers specified in supported_browsers.json
(see karma-unit/dataCards/karma-unit.js to see how we teach this to Karma).

Our current SOP is to support two major versions back from a browser's latest version.
To speed up testing, we define a set of critical browsers (defined as the latest version
of all browsers, plus all supported versions of IE).

Please be judicious in your use of SauceLabs - we are limited in usage (see the SauceLabs dashboard using the creds in LastPass to see how much we have remaining for the month).

The rake task is
```
rake test:karma_sauce [CRITICAL_BROWSERS_ONLY=true|false] [BROWSER_FAMILIES="comma-separated browser names"]
```

CRITICAL_BROWSERS_ONLY tells the runner to only run tests on critical browsers. It defaults to false (run on all browsers).

BROWSER_FAMILIES limits the run to a comma-separated list of browser names (chrome, internet explorer, etc)

Examples:
- To launch on _all_ supported browsers: `rake test:karma_sauce`
- To launch on only critical browsers: `rake test:karma_sauce CRITICAL_BROWSERS_ONLY=true`
- To launch on only a particular set of browser families: `rake test:karma_sauce BROWSER_FAMILIES="safari, internet explorer"`
- To launch only a particular browser, run `karma start` manually and specify a browser name formatted like:
  "saucelabs {browser name} {browser version} {platform}

  So for instance to run tests on Safari 7 on Mavericks, do:

  ```
  (cd karma-test/dataCards && karma start karma-unit.js --browsers "saucelabs safari 7 os x 10.9" --singleRun true)
  ```

  See supported_browsers.json for a list of values we support. You can add new browsers to this file - see https://saucelabs.com/platforms/webdriver for a list of browsers SauceLabs supports.

#### To exclude groups of tests

NOTE: THIS IS NOT SUPPORTED IN THE RAKE TASKS
When launching karma directly, you may pass an --exclude-groups flag to not run a certain subset of tests. Groups are defined in karma-unit.js and as of this writing are: controllers directives filters integration services models util.

Example:

```
(cd karma-test/dataCards && karma start karma-unit.js --browsers PhantomJS --singleRun false --exclude-groups "directives integration")
```

This only works for Data Lens/Angular component tests (not old UX).

## Javascript/other asset package management

The frontend has classically used [Jammit](http://documentcloud.github.io/jammit/) for asset management instead of the standard Rails asset pipeline. All assets must be added manually to assets.yml, and the appropriate include_javascripts calls must be included in .erb. If the assets must be loaded on-demand from JS, make sure the new jammit package is added to the "dump" section of assets.yml (the JS asset loader reads this section). Please note that though Jammit allows globs in its package definitions, the JS loader doesn't support globs. This is only an issue for on-demand loading.

### Bower packages

In order to allow clearer management of dependencies, Bower was (eventually) integrated into the asset management system. Unfortunately, the "normal" ways of integrating bower packages and Rails won't work:
- Rails-Assets (a gem source which transparently wraps Bower packages as gems) would result in yet another 3rd-party dependency on deploy. This is too risky, especially as this service is still in beta.
- bower-rails does not introduce a deploy dependency, but since we've butchered the Rails asset pipeline from the beginning this package turned out to be difficult to integrate.

Instead, we're using a standard bower setup plus a script to install required package files into our pre-existing Jammit asset structure. This script is [bower-installer](https://github.com/blittle/bower-installer). The configuration for this can be found in the frontend's bower.json.

WARNING: running `bower-installer` will replace the contents of all your bower files in public/javascript/bowers with their original content, replacing any changes you may have made. If you made any modifications to the files in public/javascript/bower, move them to another folder!

This gives us a few things:
- Deploy/build don't have to care at all. All the bower package files are just dropped into /public/javascripts, just like was done manually.
- Everything needed to run the app is in source control.

A few complications are introduced:
- When installing/updating bower packages, bower-installer must be run. Otherwise Jammit won't see the changes.
- Bower and bower-installer (and by extension node and npm) must be installed for development __only__.
- Bower packages don't always specify their main files (= what bower-installer installs). This can fortunately be overridden or specified in our bower.json.

#### Setting up bower locally
1. Install node.js (platform dependent).
2. Install bower: `# npm install -g bower`
3. Install bower-installer: `# npm install -g bower-installer@0.7.1`

#### Installing new bower packages (and save to bower.json):
1. `frontend# bower install --save awesome-package`
2. `frontend# bower-installer`

#### Updating bower packages
1. `frontend# bower update [awesome-package]`
2. `frontend# bower-installer`

## Dev Proxy

The dev proxy allows NewUX frontend developers to load data from staging or production while still using a local copy of the NewUX. To use just run:

```
dev-server/dev-proxy.js
```

You can add `-h` for more options. By default it routes requests to `dataspace-demo.test-socrata.com`. That may change in the future.
