var path = require('path');
var storytellerRoot = path.resolve(__dirname, '..');

function withExtraBabelPlugins(extraPlugins) {
  var babelPlugins = ['babel-plugin-transform-object-rest-spread'].concat(extraPlugins || [])

  return {
    entry: {
      admin: './app/assets/javascripts/admin',
      view: './app/assets/javascripts/view',
      editor: './app/assets/javascripts/editor',
      tile: './app/assets/javascripts/tile'
    },
    output: {
      filename: '[name].js',
      path: './public/js'
    },
    module: {
      loaders: [
        {
          loader: 'babel-loader',
          test: /\.js$/,
          exclude: /node_modules/,
          query: {
            // Manually resolve these plugins and presets to work around
            // webpack require path issues.
            presets: ['babel-preset-es2015', 'babel-preset-react'].map(require.resolve),
            plugins: babelPlugins.map(require.resolve)
          }
        },
        { loader: 'imports-loader', test: require.resolve('unidragger'), query: { 'define': '>false' } },
        { loader: 'imports-loader', test: require.resolve('jquery-sidebar'), query: { 'jQuery': 'jquery' } },

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
        }
      ]
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
