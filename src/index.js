var views = require('./views');
var dataProviders = require('./dataProviders');
// vv these requires have the side effect of registering jQuery plugins vv
require('./ChoroplethMap');
require('./ColumnChart');
require('./TimelineChart');
require('./FeatureMap');

// TODO: add exported function here called `init` which takes a VIF and instantiates the
// appropriate visualization based on the VIF's `type` field

module.exports = {
  views: views,
  dataProviders: dataProviders
};
