const path = require('path');
const storytellerRoot = path.resolve(__dirname, '..');
const svgFontPath = path.resolve(storytellerRoot, '../common/resources/fonts/svg');
const { getStyleguideIncludePaths } = require(path.resolve(storytellerRoot, '../common/webpack/shared_config'));

function withBabelPolyfill(entry) {
  return ['babel-polyfill-safe', entry];
}

function withExtraBabelPlugins(extraPlugins) {
  const babelPlugins = ['babel-plugin-transform-class-properties'].concat(extraPlugins || []);

  return {
    entry: {
      admin: withBabelPolyfill('./app/assets/javascripts/admin'),
      view: withBabelPolyfill('./app/assets/javascripts/view'),
      editor: withBabelPolyfill('./app/assets/javascripts/editor'),
      tile: withBabelPolyfill('./app/assets/javascripts/tile'),
      new: withBabelPolyfill('./app/assets/javascripts/new')
    },
    output: {
      filename: '[name].js',
      path: './public/js'
    },
    module: {
      preLoaders: [
        {
          test: /\.svg$/,
          loader: require.resolve('raw-loader'),
          include: svgFontPath
        },
        {
          test: /\.(eot|woff|svg|woff2|ttf)$/,
          loader: require.resolve('url-loader'),
          query: 'limit=100000',
          exclude: svgFontPath
        }
      ],
      loaders: [
        {
          loader: require.resolve('babel-loader'),
          test: /\.js$/,
          exclude: /node_modules/,
          query: {
            // Manually resolve these plugins and presets to work around
            // webpack require path issues.
            presets: ['babel-preset-stage-3', 'babel-preset-es2015', 'babel-preset-react'].map(require.resolve),
            plugins: babelPlugins.map(require.resolve)
          }
        },

        // Required for auto-loading timezone data in moment-timezone.
        {
          loader: require.resolve('json-loader'),
          test: /\.json$/
        },

        {
          loader: require.resolve('imports-loader'),
          test: require.resolve('unidragger'),
          query: { 'define': '>false' }
        },
        {
          loader: require.resolve('imports-loader'),
          test: require.resolve('jquery-sidebar'),
          query: { 'jQuery': 'jquery' }
        },

        // Expose jQuery as $ and jQuery for developer
        // convenience and so other libraries can bind
        // to it (for example, dotdotdot).
        {
          loader: require.resolve('expose-loader'),
          query: '$',
          test: require.resolve('jquery')
        },
        {
          loader: require.resolve('expose-loader'),
          query: 'jQuery',
          test: require.resolve('jquery')
        },
        {
          test: /\.scss$/,
          loaders: [
            require.resolve('style-loader'),
            require.resolve('css-loader') + '?modules&importLoaders=1&localIdentName=[path]___[name]__[local]___[hash:base64:5]',
            require.resolve('sass-loader')
          ]
        }
      ],
    },
    sassLoader: {
      includePaths: getStyleguideIncludePaths()
    },
    resolve: {
      alias: {
        'squire': path.resolve(storytellerRoot, 'node_modules/squire-rte/build/squire-raw.js')
      },
      root: [ path.resolve(storytellerRoot, '..'), path.resolve(storytellerRoot, 'app/assets/javascripts/') ],
      modulesDirectories: [ path.resolve(storytellerRoot, 'node_modules') ]
    }
  };
}

module.exports = {
  withExtraBabelPlugins: withExtraBabelPlugins
};
