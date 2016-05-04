var path = require('path');
var Rewire = require('rewire-webpack');

module.exports = [
  {
    context: __dirname,
    entry: './examples/index.js',
    output: {
      path: __dirname + '/examples',
      filename: 'vendor.js'
    },
    resolve: {
      modulesDirectories: ['node_modules'],
      alias: {
        'socrata-utils': path.join(__dirname, '.', 'node_modules/socrata-utils/dist/socrata.utils.js'),
        '_': path.join(__dirname, '.', 'node_modules/lodash/index.js'),
        'jQuery': path.join(__dirname, '.', 'node_modules/jquery/dist/jquery.js')
      }
    }
  },
  {
    context: __dirname,
    entry: './src/index.js',
    externals: {
      'jquery': 'jQuery',
      'socrata-utils': {
        root: ['socrata', 'utils'],
        commonjs2: 'socrata.utils',
        commonjs: 'socrata.utils',
        amd: 'socrata.utils'
      },
      'd3': 'd3',
      'lodash': '_',
      'moment': 'moment',
      'leaflet': 'L',
      'react': 'React',
      'react-dom': 'ReactDOM'
    },
    output: {
      path: __dirname + '/dist',
      filename: 'socrata-visualizations.js',
      libraryTarget: 'umd',
      library: ['socrata', 'visualizations']
    },
    module: {
      preLoaders: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          loader: 'babel'
        },
      ],
      loaders: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          loader: 'strict'
        }
      ]
    },
    resolve: {
      modulesDirectories: ['node_modules']
    },
    plugins: [
      new Rewire()
    ],
    devtool: 'cheap-source-map'
  }
];
