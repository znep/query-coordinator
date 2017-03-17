const _ = require('lodash');
const path = require('path');
const root = path.resolve(__dirname, '..');
const CommonsChunkPlugin = require('webpack').optimize.CommonsChunkPlugin;
const isProduction = process.env.NODE_ENV === 'production';

const devtool = isProduction ? 'source-map' : 'cheap-eval-source-map';

module.exports = {
  context: root,
  devtool,
  entry: `${root}/src/js/index.js`,
  output: {
    path: `${root}/dist/js`,
    filename: 'socrata-components.js',
    libraryTarget: 'umd',
    library: 'styleguide'
  },
  resolve: {
    modules: [path.resolve(root), 'node_modules']
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
  plugins: [
    new CommonsChunkPlugin({
      name: 'vendor',
      filename: 'vendor.js',
      minChunks: (module) => _.includes(module.resource, 'node_modules')
    })
  ]
};
