(function() {

var createDatasetFromView = function(view) {
  var DatasetClass = Dataset;
  var tabularDatasetModelEnabled = _.get(this, 'socrata.featureFlags.enable_2017_experimental_tabular_dataset_model', false);
  var displayTypeIsTable = _.get(view, 'displayType', '') === 'table';
  var viewTypeIsTabular = _.get(view, 'viewType', '') === 'tabular';
  var isDatasetPage = $('body').hasClass('controller_datasets') && $('body').hasClass('action_datasets_show');

  if (tabularDatasetModelEnabled && displayTypeIsTable && viewTypeIsTabular && isDatasetPage) {
    DatasetClass = TabularDataset;
  }

  return new DatasetClass(view);
};

if (blist.inBrowser) {
  this.createDatasetFromView = createDatasetFromView;
} else {
  module.exports = createDatasetFromView;
}

})();
