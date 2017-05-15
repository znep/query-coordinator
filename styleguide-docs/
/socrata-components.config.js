const _ = require('lodash');
const path = require('path');
const { peerDependencies } = require('../package.json');
const { CommonsChunkPlugin } = require('webpack').optimize;

const root = path.resolve(__dirname, '..');
const isProduction = process.env.NODE_ENV === 'production';

const devtool = isProduction ? 'source-map' : 'cheap-eval-source-map';
const externals = isProduction
  ? _.mapValues(peerDependencies, _.stubTrue)
  : {};
const plugins = isProduction
  ? []
  : [
      new CommonsChunkPlugin({
        name: 'vendor',
        filename: 'vendor.js',
        minChunks: (module) => _.includes(module.resource, 'node_modules')
      })
    ];

module.exports = {
  context: root,
  devtool,
  entry: `${root}/src/js/index.js`,
  externals,
  output: {
    filename: 'socrata-components.js',
    library: 'styleguide',
    libraryTarget: 'umd',
    path: `${root}/dist/js`
  },
  module: {
    rules: [
      {
        test: /\.svg$/,
        include: `${root}/src/fonts/svg`,
        loader: 'raw-loader',
        enforce: 'pre'
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          cacheDirectory: true
        }
      },

      /* Non-distributed loaders */

      {
        test: require.resolve('velocity-animate'),
        loader: 'imports-loader',
        options: {
          'jQuery': 'jquery'
        }
      },
      {
        test: require.resolve('dotdotdot'),
        loader: 'imports-loader',
        options: {
          'jQuery': 'jquery'
        }
      },
      {
        test: require.resolve('jquery'),
        use: [{
          loader: 'expose-loader',
          options: 'jQuery',
        }, {
          loader: 'expose-loader',
          options: '$'
        }]
      },
      {
        test: require.resolve('react'),
        loader: 'expose-loader',
        options: 'React'
      },
      {
        test: require.resolve('react-dom'),
        loader: 'expose-loader',
        options: 'ReactDOM'
      }
    ]
  },
  plugins,
  resolve: {
    modules: [path.resolve(root), 'node_modules']
  }
};
