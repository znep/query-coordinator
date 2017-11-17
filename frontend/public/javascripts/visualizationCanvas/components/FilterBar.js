import _ from 'lodash';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { FilterBar } from 'common/components';
import { dataProviders } from 'common/visualizations';

import { setFilters } from '../actions';

export function mapStateToProps(state) {
  const {
    columnStats,
    filters,
    parentView,
    view
  } = state;

  // Merge columns with column stats
  const columnsWithColumnStats = _.merge([], columnStats, view.columns);

  const metadataConfig = {
    datasetUid: parentView.id,
    domain: serverConfig.domain
  };

  const metadataProvider = new dataProviders.MetadataProvider(metadataConfig, true);

  // Get displayable columns only, subcolumns and system columns are omitted
  const displayableColumns = metadataProvider.getDisplayableColumns({
    ...view,
    columns: columnsWithColumnStats
  });

  // Filter out unsupported column types
  const columns = metadataProvider.getFilterableColumns({ columns: displayableColumns });

  // Filter out any filters that depend on columns that might be missing
  const displayableFilters = _.filter(filters, (filter) => {
    return _.find(columns, { fieldName: filter.columnName });
  });

  const isValidTextFilterColumnValue = (column, term) => {
    const soqlDataProvider = new dataProviders.SoqlDataProvider(metadataConfig);

    return soqlDataProvider.match(column.fieldName, term);
  };

  return {
    columns,
    filters: displayableFilters,
    isValidTextFilterColumnValue,
    spandex: metadataConfig
  };
}

export function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    onUpdate: setFilters
  }, dispatch);
}

// EN-20390 - Don't poke spandex for now until we can figure out a more sustainable approach
// export default compose(
//   connect(mapStateToProps, mapDispatchToProps),
//   spandexSubscriber()
// )(FilterBar);
export default connect(mapStateToProps, mapDispatchToProps)(FilterBar);
