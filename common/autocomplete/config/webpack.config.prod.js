var autoprefixer = require('autoprefixer');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var ManifestPlugin = require('webpack-manifest-plugin');
var InterpolateHtmlPlugin = require('react-dev-utils/InterpolateHtmlPlugin');
var url = require('url');
var getClientEnvironment = require('./env');
const path = require('path');
var paths = require('./paths');
const root = path.resolve(__dirname, '..');

function ensureSlash(path, needsSlash) {
  var hasSlash = path.endsWith('/');
  if (hasSlash && !needsSlash) {
    return path.substr(path, path.length - 1);
  } else if (!hasSlash && needsSlash) {
    return path + '/';
  } else {
    return path;
  }
}

// We use "homepage" field to infer "public path" at which the app is served.
// Webpack needs to know it to put the right <script> hrefs into HTML even in
// single-page apps that may serve index.html for nested URLs like /todos/42.
// We can't use a relative path in HTML because we don't want to load something
// like /todos/42/static/js/bundle.7289d.js. We have to know the root.
var homepagePath = require(paths.appPackageJson).homepage;
var homepagePathname = homepagePath ? url.parse(homepagePath).pathname : '/';
// Webpack uses `publicPath` to determine where the app is being served from.
// It requires a trailing slash, or the file assets will get an incorrect path.
var publicPath = ensureSlash(homepagePathname, true);
// `publicUrl` is just like `publicPath`, but we will provide it to our app
// as %PUBLIC_URL% in `index.html` and `process.env.PUBLIC_URL` in JavaScript.
// Omit trailing slash as %PUBLIC_PATH%/xyz looks better than %PUBLIC_PATH%xyz.
var publicUrl = ensureSlash(homepagePathname, false);
// Get environment variables to inject into our app.
var env = getClientEnvironment(publicUrl);

module.exports = {
  context: root,
  devtool: 'source-map',
  entry: `${root}/src/main.js`,
  output: {
    path: `${root}/build`,
    filename: 'socrata-autocomplete.js',
    libraryTarget: 'umd',
    library: 'socrata-autocomplete'
  },
  resolve: {
    modulesDirectories: ['node_modules'],
    root: [ path.resolve(root) ]
  },
  module: {
    preLoaders: [
      {
        // Prevent lodash from putting itself on window.
        // See: https://github.com/lodash/lodash/issues/2671
        test: /node_modules\/lodash/,
        loader: "imports?define=>undefined"
      },
      {
        loader: 'raw-loader',
        test: /\.svg$/,
        include: `${root}/src/fonts/svg`
      },
      {
        test: /\.scss$/,
        loaders: [
          'style-loader',
          'css-loader?modules&importLoaders=1&localIdentName=[path]_[name]_[local]_[hash:base64:5]',
          'autoprefixer-loader',
          'sass-loader'
        ]
      }
    ],
    loaders: [
      {
        loader: 'babel-loader?cacheDirectory',
        test: /\.js$/,
        exclude: /node_modules/
      },
      {
        test: /\.json$/,
        loader: 'json',
      }
    ]
  },
  // We use PostCSS for autoprefixing only.
  postcss: function() {
    return [
      autoprefixer({
        browsers: [
          '>1%',
          'last 4 versions',
          'Firefox ESR',
          'not ie < 9', // React doesn't support IE8 anyway
        ]
      }),
    ];
  },
  sassLoader: {
    includePaths: [
      `${root}/node_modules/bourbon/app/assets/stylesheets`,
      `${root}/node_modules/bourbon-neat/app/assets/stylesheets`,
      `${root}/node_modules/breakpoint-sass/stylesheets`,
      `${root}/node_modules/modularscale-sass/stylesheets`,
      `${root}/node_modules/normalize.css`
    ]
  },
  plugins: [
    // Makes some environment variables available to the JS code, for example:
    // if (process.env.NODE_ENV === 'production') { ... }. See `./env.js`.
    // It is absolutely essential that NODE_ENV was set to production here.
    // Otherwise React will be compiled in the very slow development mode.
    new webpack.DefinePlugin(env),
    // This helps ensure the builds are consistent if source hasn't changed:
    new webpack.optimize.OccurrenceOrderPlugin(),
    // Try to dedupe duplicated modules, if any:
    new webpack.optimize.DedupePlugin(),
    // Minify the code.
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        screw_ie8: true, // React doesn't support IE8
        warnings: false
      },
      mangle: {
        screw_ie8: true
      },
      output: {
        comments: false,
        screw_ie8: true
      }
    }),
    // Note: this won't work without ExtractTextPlugin.extract(..) in `loaders`.
    new ExtractTextPlugin('css/[name].css')
  ]
};
