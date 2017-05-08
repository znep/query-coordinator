import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { FilterBar } from 'socrata-components';
import { setFilters } from '../actions';
import { dataProviders } from 'socrata-visualizations';

export function mapStateToProps({ columnStats, view, filters, parentView }) {

  // Merge columns with column stats
  const columnsWithColumnStats = _.merge([], columnStats, view.columns);

  // Get displayable columns only, subcolumns and system columns are omitted
  const displayableColumns = new dataProviders.MetadataProvider({
    domain: serverConfig.domain,
    datasetUid: parentView.id
  }).getDisplayableColumns({
    ...view,
    columns: columnsWithColumnStats
  });

  // Filter out unsupported column types
  const columns = _.filter(displayableColumns, (column) => {
    if (column.dataTypeName === 'number') {
      return _.isNumber(column.rangeMin) && _.isNumber(column.rangeMax);
    }
    return column.dataTypeName === 'text' || column.dataTypeName === 'calendar_date';
  });

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
