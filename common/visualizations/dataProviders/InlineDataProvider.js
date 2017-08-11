/**
 * The data provider's job is to provide a public interface for a particular
 * data source. In this case we are just providing a getter that extracts
 * inline data embedded in a vif.
 *
 * See API.md for more details.
 */

import DataProvider from './DataProvider';
import _ from 'lodash';

/**
 * `InlineDataProvider` is an implementation of `DataProvider` that enables
 * users to read data directly from a vif.
 *
 * @constructor
 */
function InlineDataProvider(vifWithInlineData) {
  const seriesDataSource = _.get(vifWithInlineData, 'series[0].dataSource', {});
  _.extend(this, new DataProvider());

  /**
   * Public methods
   */

  this.getView = () => {
    const viewOrEmptyObject = _.cloneDeep(_.get(seriesDataSource, 'view', {}));

    return viewOrEmptyObject;
  };

  this.getColumns = () => {
    const columnsOrEmptyArray = _.cloneDeep(
      _.sortBy(_.get(seriesDataSource, 'view.columns', []), 'position')
    );

    return columnsOrEmptyArray;
  };

  this.getStartIndex = () => {
    const startIndexOrZero = _.get(seriesDataSource, 'startIndex', 0);

    return startIndexOrZero;
  };

  // Non-inclusive (e.g. an 'endIndex' of 50 means that the last row in the data
  // table is number 49).
  this.getEndIndex = () => {
    const endIndexOrZero = _.get(seriesDataSource, 'endIndex', 0);

    return endIndexOrZero;
  };

  this.getRowCount = () => {
    return (this.getEndIndex() - this.getStartIndex());
  };

  this.getTotalRowCount = () => {
    const totalRowCountOrZero = _.get(seriesDataSource, 'totalRowCount', 0);

    return totalRowCountOrZero;
  };

  // The InlineDataProvider simply reads data in the standard tabular format
  // directly from the vif. Refer to API.md for documentation on this format,
  // which is also what other data providers return (although metadata
  // providers return objects in formats unique to the source of metadata).
  this.getRows = () => {
    const rowsOrEmptyArray = _.cloneDeep(_.get(seriesDataSource, 'rows', []));

    return rowsOrEmptyArray;
  };
}

module.exports = InlineDataProvider;
