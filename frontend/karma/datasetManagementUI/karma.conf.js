var path = require('path');
var WebpackFailurePlugin = require('../helpers/WebpackFailurePlugin.js');

var root = path.resolve(__dirname, '../..');

module.exports = function ( karma ) {
  karma.set({
    basePath: '../../',

    singleRun: true,

    files: [
      'karma/datasetManagementUI/index.js'
    ],

    preprocessors: {
      'karma/datasetManagementUI/index.js': ['webpack', 'sourcemap']
    },

    frameworks: ['mocha', 'chai', 'chai-as-promised', 'sinon-chai'],

    reporters: ['dots', 'mocha'],

    webpack: {
      cache: true,
      devtool: 'inline-source-map',
      module: {
        loaders: [
          {
            test: /\.jsx?$/,
            include: [
              path.resolve(root, 'public/javascripts'),
              path.resolve(root, 'node_modules/socrata-components/common'),
              path.resolve(root, 'karma/datasetManagementUI')
            ],
            loader: 'babel'
          },
          {
            test: /\.global.scss$/,
            include: [
              path.resolve(root, 'public/javascripts/datasetManagementUI')
            ],
            loader: 'style?sourceMap!css!postcss!sass'
          },
          {
            test: /^((?!\.global).)*(scss|css)$/,
            include: [
              path.resolve(root, 'public/javascripts/datasetManagementUI')
            ],
            loader: 'style?sourceMap!css?modules&localIdentName=[local]&importLoaders=1!postcss!sass'
          },
          {
            test: /\.json$/,
            loader: 'json'
          }
        ]
      },
      plugins: [ new WebpackFailurePlugin() ],
      postcss: function() {
        return [
          require('autoprefixer')
        ];
      },
      externals: {
        'react/addons': true,
        'react/lib/ExecutionEnvironment': true,
        'react/lib/ReactContext': 'window'
      },
      resolve: {
        extensions: ['', '.js', '.scss', '.json'],
        root: [
          path.resolve('.'),
          path.resolve('public/javascripts/datasetManagementUI'),
          path.resolve('karma/datasetManagementUI')
        ]
      }
    },

    webpackMiddleware: {
      noInfo: true
    },

    mochaReporter: {
      showDiff: true
    },

    colors: true,
    logLevel: 'INFO',

    browsers: [
      'Chrome',
      'Firefox',
      'PhantomJS'
    ],
    browserNoActivityTimeout: 1000 * 55,
    browserDisconnectTimeout: 1000 * 10,
    browserDisconnectTolerance: 5,
    phantomjsLauncher: {
      options: {
        viewportSize: {
          width: 1024,
          height: 768
        }
      }
    }
  });
};
