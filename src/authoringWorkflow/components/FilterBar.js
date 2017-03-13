import _ from 'lodash';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { FilterBar } from 'socrata-components';
import { setFilters } from '../actions';
import { getFilterableColumns, getSoqlDataProvider } from '../selectors/metadata';

const mapStateToProps = (state) => {
  const { metadata, vifAuthoring } = state;

  const columns = getFilterableColumns(metadata);
  const filters = _.filter(vifAuthoring.authoring.filters, (filter) => {
    return _.isString(filter.columnName) && _.find(columns, ['fieldName', filter.columnName]);
  });
  const isValidTextFilterColumnValue = (column, searchTerm) => {
    return getSoqlDataProvider(metadata).match(column.fieldName, searchTerm);
  };

  return {
    columns,
    filters,
    isReadOnly: false,
    isValidTextFilterColumnValue
  };
};

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({ onUpdate: setFilters }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(FilterBar);
