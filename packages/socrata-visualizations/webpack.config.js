const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const distPath = __dirname + '/dist'

const root = path.resolve(__dirname, '../..');
const libraryVersionPlugin = new webpack.DefinePlugin({
  LIBRARY_VERSION: JSON.stringify(require('./package.json').version)
});

module.exports = [
  {
    context: __dirname,
    entry: './examples/index.js',
    output: {
      path: __dirname + '/examples',
      filename: 'vendor.js'
    },
    module: {
      preLoaders: [
        {
          test: /\.js$/,
          loader: require.resolve('babel-loader'),
          query: {
            presets: ['babel-preset-es2015', 'babel-preset-react'].map(require.resolve),
            plugins: ["babel-plugin-transform-object-rest-spread"].map(require.resolve)
          }
        }
      ],
      loaders: [
        {
          loader: require.resolve('imports-loader'),
          test: require.resolve('dotdotdot'),
          query: { 'jQuery': 'jquery' }
        }
      ]
    },
    resolveLoader: {
      modulesDirectories: [ fs.realpathSync('node_modules') ]
    },
    resolve: {
      root,
      alias: {
        'react': path.resolve('./node_modules/react')
      },
      modulesDirectories: [ path.resolve(root, 'packages/socrata-visualizations/node_modules') ]
    }
  },

  {
    context: __dirname,
    entry: ['whatwg-fetch', './index.js'],
    plugins: [ libraryVersionPlugin ],
    externals: {
      'jquery': true,
      'socrata-utils': true,
      'd3': true,
      'lodash': true,
      'moment': true,
      'leaflet': true,
      'socrata-components': true,
      'react': true,
      'react-dom': true,
      'react-redux': true,
      'redux': true,
      'redux-logger': true,
      'redux-thunk': true
    },
    output: {
      path: distPath,
      filename: 'socrata-visualizations.js',
      libraryTarget: 'umd',
      library: ['socrata', 'visualizations']
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
          test: /\.js$/,
          loader: require.resolve('babel-loader'),
          query: {
            presets: ['babel-preset-es2015', 'babel-preset-react'].map(require.resolve),
            plugins: ["babel-plugin-transform-object-rest-spread"].map(require.resolve)
          }
        }
      ]
    },
    resolve: {
      root,
      modulesDirectories: [ path.resolve(root, 'packages/socrata-visualizations/node_modules') ]
    },
    devtool: 'source-map'
  }

  // {
  //   context: __dirname,
  //   entry: ['whatwg-fetch', './src/embed/index.js'],
  //   plugins: [ libraryVersionPlugin ],
  //   output: {
  //     path: distPath,
  //     filename: 'socrata-visualizations-embed.js',
  //     libraryTarget: 'umd',
  //     library: ['socrata', 'visualizations']
  //   },
  //   module: {
  //     loaders: [
  //       {
  //         // Prevent lodash from putting itself on window.
  //         // See: https://github.com/lodash/lodash/issues/2671
  //         test: /node_modules\/lodash/,
  //         loader: "imports?define=>undefined"
  //       },
  //       {
  //         test: /\.js$/,
  //         loader: 'babel-loader',
  //         query: {
  //           presets: ["es2015", "react"],
  //           plugins: ["transform-object-rest-spread"]
  //         },
  //         include: [ path.resolve('src'), path.resolve('karma') ]
  //       },
  //       {
  //         loader: 'imports-loader',
  //         test: /dotdotdot/,
  //         query: { 'jQuery': 'jquery' }
  //       },
  //       {
  //         test: /\.s?css$/,
  //         // Process styles but don't inline images. We don't use them.
  //         loader: 'style-loader!css-loader?url=false!sass-loader'
  //       }
  //     ]
  //   },
  //   resolve: {
  //     root,
  //     modulesDirectories: [ 'node_modules' ],
  //     alias: {
  //       'react': path.resolve('node_modules/react'),
  //       'react-dom': path.resolve('node_modules/react-dom')
  //     }
  //   },
  //   devtool: 'source-map'
  // }
  // {
  //   context: __dirname,
  //   entry: './src/embed/loader.js',
  //   output: {
  //     path: distPath,
  //     filename: 'socrata-visualizations-loader.js'
  //   },
  //   module: {
  //     loaders: [
  //       {
  //         test: /\.js$/,
  //         loader: 'babel-loader',
  //         query: {
  //           presets: ["es2015", "react"],
  //           plugins: ["transform-object-rest-spread"]
  //         }
  //       }
  //     ]
  //   },
  //   resolve: {
  //     root
  //   }
  // }

];
