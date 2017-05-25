const _ = require('lodash');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const babelPlugins = ['babel-plugin-transform-object-rest-spread'];
const { peerDependencies } = require('./package.json');
const externals = _.mapValues(peerDependencies, _.stubTrue);

// Package with all deps included.
// Only used for the legacy styleguide-docs.
// Please don't use this for anything else.
const staticPackageConfig = {
  context: __dirname,
  entry: './static.js',
  output: {
    path: __dirname + '/dist/js',
    filename: 'socrata-components-static.js',
    libraryTarget: 'umd',
    library: ['socrata', 'components']
  },
  module: {
    preLoaders: [
      {
        loader: require.resolve('raw-loader'),
        test: /\.svg$/,
        include: `${root}/common/resources/fonts/svg`
      }
    ],
    loaders: [
      {
        loader: require.resolve('babel-loader'),
        test: /\.jsx?$/,
        exclude: /node_modules/,
        query: {
          // Manually resolve these plugins and presets to work around
          // webpack require path issues.
          presets: ['babel-preset-es2015', 'babel-preset-react'].map(require.resolve),
          plugins: babelPlugins.map(require.resolve)
        }
      }
    ]
  },
  resolve: {
    root: root,
    modulesDirectories: [ path.resolve(root, 'packages/socrata-components/node_modules') ]
  },
  devtool: 'source-map'
};

// Package with no deps included - everything
// is a peer dependency.
const dynamicPackageConfig = _.cloneDeep(staticPackageConfig);
dynamicPackageConfig.entry = './index.js';
dynamicPackageConfig.externals = externals;
dynamicPackageConfig.output.filename = 'socrata-components.js';

module.exports = [
  staticPackageConfig,
  dynamicPackageConfig
];
