import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { FilterBar } from 'socrata-components';
import { setFilters } from '../actions';
import { getFilterableColumns, getSpandexDataProvider } from '../selectors/metadata';

const mapStateToProps = (state) => {
  const { metadata, vifAuthoring } = state;

  const filters = vifAuthoring.authoring.filters;
  const columns = getFilterableColumns(metadata);
  const fetchSuggestions = (column, searchTerm) => {
    return getSpandexDataProvider(metadata).getSuggestions(column.fieldName, searchTerm, 10);
  };

  return {
    filters,
    columns,
    fetchSuggestions
  };
};

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({ onUpdate: setFilters }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(FilterBar);
