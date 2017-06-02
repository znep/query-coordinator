/**
 * The data provider's job is to provide a public interface for a particular
 * data source. In this case we are just providing a getter that extracts
 * static data embedded in a vif.
 *
 * See API.md for more details.
 */

const DataProvider = require('./DataProvider');
const _ = require('lodash');

/**
 * `SampleDataProvider` is an implementation of `DataProvider` that enables
 * users to read data directly from a vif.
 *
 * @constructor
 */
function SampleDataProvider() {
  // Remove the eslint directive below when adding functionality that relies on
  // self, or remove the line entirely if it is not required.
  /* eslint-disable no-unused-vars */
  const self = this;
  /* eslint-enable no-unused-vars */

  _.extend(this, new DataProvider());

  /**
   * Public methods
   */

  // The sample data provider simply reads data in the standard tabular format
  // directly from the vif. Refer to API.md for documentation on this format,
  // which is also what other data providers return (although metadata
  // providers return objects in formats unique to the source of metadata).
  this.readDataFromSeriesDataSource = function(seriesDataSource) {
    return seriesDataSource.data;
  };
}

module.exports = SampleDataProvider;
