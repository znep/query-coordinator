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
    // EN-19953 - Data Inconsistencies in Grid View Refresh
    //
    // A view's columns include hidden columns, but query results do not include
    // values for hidden columns. Because a lot of what we do at the visualization
    // level with data table objects is based on column indices, this means that
    // we will get unexpected results if we unwittingly pass hidden columns
    // to the visualization code. We therefore want to filter out hidden columns
    // before we pass the rest on to whatever is using the InlineDataProvider.
    const columnsOrEmptyArray = _.sortBy(
      _.get(seriesDataSource, 'view.columns', []).filter(function(column) {
        const flags = _.get(column, 'flags', []);

        return (
          column.fieldName.charAt(0) !== ':' &&
          (!_.isArray(flags) || (_.isArray(flags) && flags.indexOf('hidden') === -1))
        );
      }),
      'position'
    );

    return _.cloneDeep(columnsOrEmptyArray);
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

  this.getRowIds = () => {
    return _.get(seriesDataSource, 'rowIds', []).map((rowId) => `${rowId}`);
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
