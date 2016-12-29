const path = require('path');
const root = path.resolve(__dirname, '..');

module.exports = {
  context: root,
  devtool: 'source-map',
  entry: `${root}/src/js/index.js`,
  externals: {
    'classnames': true,
    'dompurify': true,
    'dotdotdot': true,
    'jquery': true,
    'lodash': true,
    'moment': true,
    'react': true,
    'react-dom': true,
    'socrata-utils': true,
    'tether': true,
    'tether-shepherd': true,
    'velocity-animate': true
  },
  output: {
    path: `${root}/dist/js`,
    filename: 'styleguide.js',
    libraryTarget: 'umd',
    library: 'styleguide'
  },
  resolve: {
    modulesDirectories: ['node_modules'],
    root: [ path.resolve(root) ]
  },
  module: {
    preLoaders: [
      {
        loader: 'raw-loader',
        test: /\.svg$/,
        include: `${root}/src/fonts/svg`
      }
    ],
    loaders: [
      {
        loader: 'babel-loader?cacheDirectory',
        test: /\.js$/,
        exclude: /node_modules/
      }
    ]
  },
  plugins: []
};
