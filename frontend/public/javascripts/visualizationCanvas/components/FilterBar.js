import _ from 'lodash';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { FilterBar } from 'common/components';
import { setFilters } from '../actions';
import { dataProviders } from 'common/visualizations';

export function mapStateToProps({ columnStats, view, filters, parentView }) {

  // Merge columns with column stats
  const columnsWithColumnStats = _.merge([], columnStats, view.columns);

  const metadataProvider = new dataProviders.MetadataProvider({
    domain: serverConfig.domain,
    datasetUid: parentView.id
  },
                                                             true);

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
    const soqlDataProvider = new dataProviders.SoqlDataProvider({
      domain: serverConfig.domain,
      datasetUid: parentView.id
    });

    return soqlDataProvider.match(column.fieldName, term);
  };

  return {
    columns,
    filters: displayableFilters,
    isValidTextFilterColumnValue
  };
}

export function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    onUpdate: setFilters
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(FilterBar);
