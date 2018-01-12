How We JavaScript (in frontend)
===

JavaScript is a language usually run in the browser. We use JavaScript to provide interactive
experiences in the browser to our customers. This document gives a detailed explanation of our
use of JavaScript in the [frontend repository](https://github.com/socrata/frontend).

Getting Started
---

The script `bin/setup_environment.sh` sets up artifactory, ruby, npm, and postgres. It is run as
part of the [onramp script](https://github.com/socrata/docs/tree/master/onramp). Next, start
nginx:

```sh
sudo nginx -c ${PWD}/dev-server/nginx.conf
```

Next, run rails:

```sh
bundle exec unicorn -c config/unicorn.rb -N
```

Finally, run webpack-dev-server

```sh
npm run webpack-dev-server
```

Filesystem Overview
---

Files related to JavaScript can be found in the following places in the frontend repository:

- `config` contains [webpack](https://webpack.github.io/docs/configuration.html) configuration
  files, which describe how JavaScript is to be compiled, bundled, transpiled, optimized, and
  packaged. Specifically, `config/webpack.config.js` is the top-level configuration that is
  ultimately passed to webpack. There is also a directory
  `config/webpack`, which contains a webpack configuration for each JavaScript application.
- `karma` contains all JavaScript unit tests. There is a subdirectory for each JavaScript
  application.
- `node_modules` is a `.gitignore`d file that contains all JavaScript dependencies. It is managed
  by the command line tool `npm` and is not present in an initial clone of the repository.
- `package.json` is a file that specifies JavaScript-oriented metadata about the frontend project.
  It specifies things like dependencies and tooling scripts and is generally used by `npm`.
- `public/javascripts` contains all of the JavaScript code.
- `tools` contains several miscellaneous scripts that perform operations on the JavaScript codebase.
  Notably, `tools/jscodeshift-transforms`, `tools/postinstall.sh`, and
  `tools/merge-asset-manifests.js`

Developing
---

### Tests

To run the karma tests, run:

```
bundle exec rake test:karma:parallel
```

Test files are located in `karma`. Each directory corresponds to a suite of tests. For testing
code that uses webpack, we often have karma only load a single file that uses `require` and `import`
(often using [require.context](https://webpack.github.io/docs/context.html) to recursively include
test files), and use the webpack preprocessor to compile the single file.

### Lint

To run the lint check using eslint, run:

```
bundle exec rake lint:js
```

### webpack-dev-server

We use [webpack-dev-server](https://webpack.github.io/docs/webpack-dev-server.html) for speedy
recompilation of modified Javascript files. There are some situations when it must be restarted:

- A new dependency is added to the `node_modules` folder (common after pulling or after performing
  an `npm install`).
- The webpack config is updated.

An npm task is provided to run `webpack-dev-server` with the correct command line arguments: `npm
run webpack-dev-server`.

If you are only working in one or two areas of the JavaScript codebase, you can specify the
environment variable `FRONTEND_WEBPACK_BUNDLES` to tell `webpack-dev-server` to only compile a
subset of the webpack bundles, which will speed up compilation and use less memory. Specify a list
of webpack bundles separated by commas:

```
export FRONTEND_WEBPACK_BUNDLES='dataset-management-ui,data-lens'
```

For a list of webpack bundles, run this command from the root of the frontend repository:

```
for file in config/webpack/*.config.js; do echo $(basename $file .config.js); done
```

### Language Features (ES6)

There are many cool ways to add features to JavaScript using transpilation and other tools like
flow. Most code processed with webpack is transpiled using babel, and is able to use the full gamut
of ES6 syntax. It is important for frontend developers at Socrata to decide on the set of ES6
features that will be used to increase understanding and collaboration. Our documented JavaScript
standards can be found in [this Google
Doc](https://docs.google.com/document/d/1dAU1QbonSKNob1o4FvDHiJUfRVgGZl6wCmEybwHVzmU/edit#heading=h.e5cwa92crct).

### Naming Conventions

Use the following rules for naming JavaScript files and directories:

- If the file or directory deals with nodejs, npm, or is tooling written in JavaScript, use
  kebab-case.
- If the file or directory is application code designed to be run in the browser, use camelCase for
  it, with the exception that if it exports a class use StudlyCase.

Dependencies
---

### Libraries

We use a variety of JavaScript libraries to help minimize the amount of code we write and to
leverage existing solutions to problems. Major libraries currently in use include:

- [jQuery](https://jquery.com), a utility library providing a wide range of functionality. Used
  extensively throughout the codebase, most notably in the classic UX.
- [Lodash](https://lodash.com), a utility library providing tools for operating on collections,
  using functional programming, and several other miscellaneous helpers.
- [Backbone](http://backbonejs.org), used sparingly in some govstat pages.
- [Moment.js](http://momentjs.com), a library for working with dates in JavaScript.
- [Mocha](https://mochajs.org), a test framework.
- [Chai](http://chaijs.com), an assertion library.
- [Sinon](http://sinonjs.org), a library providing useful test utilities.
- [Karma](https://karma-runner.github.io/1.0/index.html), a test runner.
- [Open Layers](http://openlayers.org/two), a library for displaying maps in browsers. Used in the
  classic UX.
- [Leaflet](http://leafletjs.com/), a library for displaying maps in browsers. Used in newer areas
  of the codebase.
- [Highcharts](http://www.highcharts.com), a library for rendering visualizations. Used in the
  classic UX.
- [d3](https://d3js.org), a library for rendering visualizations. Used in newer areas of the
  codebase.
- [RxJS](http://reactivex.io/rxjs), a library for working with asynchronous streams. Used in the
  Angular version of Data Lens.
- [Squire](https://neilj.github.io/Squire), a richtext editor.
- [Angular](https://angularjs.org), a large application framework. Used in the Angular version of
  Data Lens.
- [React](https://facebook.github.io/react), a library for building self-contained components and
  connecting them to data.
- [Redux](http://redux.js.org/index.html), an implementation of
  [flux](https://facebook.github.io/flux), used as a state container for handling large amounts of
  data and events in a predictable way.

### Dependency Management

We have a couple of different ways of installing these libraries:

#### Filesystem

Some libraries are copied into various places on the filesystem, mostly in
`public/javascripts/plugins`. This is generally discouraged, as it means we add large, minified
files to source control and makes updates difficult.

#### npm

##### Overview

[npm](https://www.npmjs.com) stands for "node package manager" and is currently the preferred option
for installing JavaScript libraries. It is recommended to use `node` 4 or higher and `npm` 3 or
  higher. The node version management tool `n` (`brew install n`) may be used to manage different
  versions of node. npm provides the command line tool `npm` which can be used to install
  dependencies and also run arbitrary build scripts. npm should be installed by default if you have
  run the [onramp script](https://github.com/socrata/docs/tree/master/onramp) or otherwise installed
  node. To install all dependencies, run:

```
npm install
```

from the root of the frontend repository. This command reads metadata about packages from the
`package.json` file and performs any necessary installation.  To determine whether or not your local
modules are out of date with those in `package.json`, run:

```
npm run check-dependencies
```

This will automatically be run before starting webpack and after pulling in new code to inform you
whether or not an `npm install` is required.

It has been observed that `npm install` can be non-deterministic in nature. If your dependencies are
more than several weeks out of date, it may be necessary to run `npm install` twice. In severe cases
it may be necessary to completely remove the `node_modules` directory and run `npm install` from a
clean slate.

In general, to add a new dependency, run `npm install some-library --save` which will cause npm to
add an entry to `package.json` that refers to the new library. Alternatively, one can manually edit
`package.json` to add the appropriate entry under the dependencies section, then run `npm install`
to install it. Be advised that we use exact versions for all of our dependencies.

##### Scripts

npm provides several hooks that can be used to execute actions at certain times. For instance, in
the `scripts` section of our `package.json`, we specify a postinstall script that runs `sh
./tools/postinstall.sh`. This postinstall script currently copies stylesheets into
`public/stylesheets` so they can be publicly served. In general, the prefixes "pre" and "post" may
be prepended to a script name to run a command before or after the specified hook or script,
respectively. For more information on npm scripts, see the [npm
documentation](https://docs.npmjs.com/misc/scripts).

##### package.json

The `package.json` file is a JSON file that provides metadata to npm so it knows what scripts are
available, which dependencies to install, how to publish the project to a registry, etc. The most
important fields of the `package.json` field are:

- `version`, the version of the project. Not currently used in frontend.
- `config`, an arbitrary blob the we use to store some configuration information that is accessed
  by other node scripts.
- `scripts`, scripts and hooks that can be run by npm, usually geared towards dependency management.
- `dependencies` and `devDependencies` specify the dependencies for the project. `devDependencies`
  are dependencies that are not installed if the `NODE_ENV` is "production". Currently we do not
  use this field correctly, and it does not make sense to run `NODE_ENV=production npm install` from
  the root of the frontend repository. This is because much of our `devDependencies` are required
  for Jenkins to build the artifact using `npm run build:prod` in the release script.

For complete documentation of all fields that can be present in the `package.json` file, see
[here](https://docs.npmjs.com/files/package.json).

#### Artifactory

Artifactory is a repostiory for dependencies for several Socrata projects. We cache public npm
modules in artifactory in `npm-remote`, and we publish our private npm modules to `npm-local`.
There is a meta repository called `npm-virtual` that will serve artifacts from both `npm-local` and
`npm-remote`. Artifactory setup is handled by the `bin/setup_environment.sh` script, which adds
configuration to `~/.npmrc`.

Bundling
---

### Webpack

TODO

#### Webpack Configuration Files

TODO

#### Webpack Bundles

Understand that we have two types of webpack bundles -- the development bundle and the production
bundle:

- The development bundle includes various configuration tweaks to improve build times and adds
  things helpful for development like source maps. The development bundle is typically never
  written to disk but is cached in memory and served by the webpack dev server. All requests
  beginning with `/javascripts/webpack` are rerouted to the webpack dev server via nginx (see
  `/dev-server/nginx.conf`).
- The production bundle takes a long time and includes extra steps such as fingerprinting and
  uglification. These bundles are written to `public/javascripts/build`, which is a .gitignored
  directory and have filenames containing a hash of their contents, which assists in cache busting.

Next, rails has to know which bundle to serve for a given request. When the server starts, it
initializes webpack configuration based on the `Rails.env` (see `config/application.rb`). If rails
is running in a production environment, the webpack initializer reads something called a "manifest".
The manifest is something output as part of the production build and maps bundle names to their
filenames on disk. The main manifest is located at `public/javascripts/build/manifest.json` and is
generated by `tools/merge-asset-manifests.js`. In development mode, reading from the manifest is
not necessary as requests will be forwarded to the dev server. In test mode, there is a fixture
that is used in lieu of building the entire manifest each time tests are run. The test fixture
is located in `spec/fixtures/webpack_manifest.json`. This fixture was created by copying the
manifest from staging via this url:
`https://opendata-demo.test-socrata.com/javascripts/build/manifest.json`

To include a webpack bundle on a page there is a helper method in `application_helper.rb` called
`include_webpack_bundle`. In development mode this will forward the request to the webpack dev
server. In production mode this will look up the desired bundle in the manifest and return a script
tag with a `src` attribute referencing the appropriate bundle filename.

To test the production bundle locally, start the frontend with the following two environment variables
set:

```
WEBPACK_USE_MANIFEST=true WEBPACK_USE_DEV_SERVER=false rails s
```

This will override the configuration defined in `config/application.rb` and use the production
webpack logic even though Rails is in development mode. Remember to run `npm run build:prod` to
populate `public/javascript/build` and restart Rails for the configuration changes to take effect.

> Note: If you're having trouble running `npm run build:prod` due to memory allocation errors, you
> can focus it down to a smaller set of assets by using the `FRONTEND_WEBPACK_BUNDLES` option which
> is documented elsewhere in this file.

Jenkins
---

There is a Jenkins job that will run tests and lint for pull requests that modify Javascript files.
The script is located in `bin/test`. The jenkins job is called `frontend-pull-request-test`.

There are two main release scripts that will build frontend in order to deploy it to an environment.
These are `frontend-staging` and `frontend-release`. Both of these jobs call the main `frontend`
Jenkins job. The `frontend` Jenkins job calls the script located in `bin/build`, which runs webpack
to generate a production build.

Troubleshooting
---

### Node modules

If you are stuck on a perplexing issue and it seems to be related to a missing reference to a
library, try running `npm install` or the equivalent command `npm i`. If that doesn't fix the
issue and you haven't touched `frontend` in a while, you can reinstall _all_ Node dependencies
by running the command below.

```sh
rm -rf node_modules && npm i
```

> Note that this approach is the nuclear option and while it usually works, it takes a long time to run.
> Try the less extreme suggestions below first.

### General

- Try restarting webpack-dev-server. Quit the process in the tab spawned by the start script and run
  `npm run webpack-dev-server`.
- If you haven't touched `frontend` in a really long time you may need to upgrade your version
  of Node by running the command below:

```sh
brew install n
n "`cat .node-version`"
npm rebuild node-sass
npm install
```

> Note that `n` is a version manager akin to `rbenv` for Ruby.

- Another thing to try is to rerun `bin/setup_environment.sh`, which will reconfigure a few key
  components.

### ENOENT Errors

If you encounter an error from npm that looks like this when trying to install a package:

```
Error: ENOENT: no such file or directory, rename '/Users/user/frontend/node_modules/.staging/...' -> '/Users/user/frontend/node_modules/npm/node_modules/...'
```

Then run `npm cache clean` and try to install the package again. See [this Github
issue](https://github.com/npm/npm/issues/9633).

### EADDRINUSE 0.0.0.0:3030

If you see an `EADDRINUSE` error from npm when trying to run webpack, this means you are running a
process that is listening on the port that webpack is trying to listen on.  Frequently this means
another instance of webpack is running, you can check for this by running `ps aux | grep webpack`.
You may also use `lsof` to find the process listening on port 3030.  After killing the process, try
running webpack-dev-server again.
