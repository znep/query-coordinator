import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { FilterBar } from 'socrata-components';
import { setFilters } from '../actions';
import { dataProviders } from 'socrata-visualizations';

export function mapStateToProps({ view, filters, parentView }) {

  // Filtering is only supported on number columns and text columns.
  const columns = _.chain(view.columns).
    filter((column) => {
      if (column.dataTypeName === 'number') {
        return _.isNumber(column.rangeMin) && _.isNumber(column.rangeMax);
      }

      return column.dataTypeName === 'text';
    }).
    value();

  const fetchSuggestions = (column, term) => {
    const spandex = new dataProviders.SpandexDataProvider({
      domain: serverConfig.domain,
      datasetUid: parentView.id
    });

    return spandex.getSuggestions(column.fieldName, term, 10);
  };

  return {
    columns,
    filters,
    fetchSuggestions
  };
}

export function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    onUpdate: setFilters
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(FilterBar);
