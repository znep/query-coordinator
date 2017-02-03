import _ from 'lodash';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { FilterBar } from 'socrata-components';
import { setFilters } from '../actions';
import { getFilterableColumns, getSpandexDataProvider } from '../selectors/metadata';

const mapStateToProps = (state) => {
  const { metadata, vifAuthoring } = state;

  const columns = getFilterableColumns(metadata);
  const filters = _.filter(vifAuthoring.authoring.filters, (filter) => {
    return _.isString(filter.columnName) && _.find(columns, ['fieldName', filter.columnName]);
  });
  const fetchSuggestions = (column, searchTerm) => {
    return getSpandexDataProvider(metadata).getSuggestions(column.fieldName, searchTerm, 10);
  };

  return {
    columns,
    filters,
    isReadOnly: false,
    fetchSuggestions
  };
};

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({ onUpdate: setFilters }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(FilterBar);
