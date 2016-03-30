# How Webpack Bundles Work

Understand that we have two types of bundles: the development bundle and the production
bundle:

- The development bundle includes various configuration tweaks to improve build times and adds
  things helpful for development like source maps.  The development bundle is typically never
  written to disk but is cached in memory and served by the webpack dev server.  All requests
  beginning with `/javascripts/webpack` are rerouted to the webpack dev server via nginx (see
  `/dev-server/nginx.conf`).
- The production bundle takes a long time and includes extra steps such as fingerprinting and
  uglification.  These bundles are written to `public/javascripts/build`, which is a .gitignored
  directory and have filenames containing a hash of their contents, which assists in cache busting.

Next, rails has to know which bundle to serve for a given request.  When the server starts, it
initializes webpack configuration based on the `Rails.env` (see `config/application.rb`).  If rails
is running in a production environment, the webpack initializer reads something called a "manifest".
The manifest is something output as part of the production build and maps bundle names to their
filenames on disk.  In development mode, reading from the manifest is not necessary as requests will
be forwarded to the dev server.

To include a webpack bundle on a page there is a helper method in `application_helper.rb` called
`include_webpack_bundle`.  In development mode this will forward the request to the webpack dev
server.  In production mode this will look up the desired bundle in the manifest and return a script
tag with a `src` attribute referencing the appropriate bundle filename.

To test the production bundle locally, set two configuration flags at the top of
`config/initializers/webpack.rb`:

- `Rails.configuration.webpack[:use_manifest] = true`
- `Rails.configuration.webpack[:use_dev_server] = false`

This will override the configuration defined in `config/application.rb` and use the production
webpack logic even though Rails is in development mode.  Remember to run `npm run build:prod` to
populate `public/javascript/build` and restart Rails for the configuration changes to take effect.
