const karmaConfig = require('../helpers/karma_config');
const _ = require('lodash');
const webpackConfig = require('../helpers/webpack').karmaWebpackConfig(
  'dataset-management-ui.config.js',
  [ 'karma/datasetManagementUI', '.' ]
);

webpackConfig.externals = {
  jquery: 'jQuery',
  // 'react/addons': true,
  // 'react/lib/ExecutionEnvironment': true,
  // 'react/lib/ReactContext': 'window'
};

// To make tests easier to write, we disable auto scss class prefixes.
const styleLoaderWithDisabledAutoScssClassPrefixes =
  'style?sourceMap!css?modules&localIdentName=[local]&importLoaders=2!postcss!sass';
const styleLoader = _(webpackConfig.module.loaders).find((loader) =>
  _.get(loader, 'loader', '').indexOf('localIdentName') >= 0
);
if (styleLoader) {
  styleLoader.loader = styleLoaderWithDisabledAutoScssClassPrefixes;
} else {
  // Sometimes loader is actually loaders - an array instead of a string
  _(webpackConfig.module.loaders).each((loader) => {
    const styleLoaders = _.get(loader, 'loaders');
    if (styleLoaders) {
      _(styleLoaders).each((entry, index) => {
        if (entry.indexOf('localIdentName') >= 0) {
          styleLoaders[index] = styleLoaderWithDisabledAutoScssClassPrefixes;
        }
      })
    }
  });
}

webpackConfig.resolve.extensions = ['', '.js', '.scss', '.json'];

module.exports = function(karma) {
  karma.set(karmaConfig({
    files: [
      'karma/datasetManagementUI/index.js'
    ],
    webpack: webpackConfig
  }));
};
