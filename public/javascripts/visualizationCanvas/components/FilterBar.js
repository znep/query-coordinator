import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { FilterBar } from 'socrata-components';
import { setFilters } from '../actions';
import { dataProviders } from 'socrata-visualizations';

export function mapStateToProps({ columnStats, view, filters, parentView }) {

  // Get displayable columns only, subcolumns and system columns are omitted
  const displayableColumns = new dataProviders.MetadataProvider({
    domain: serverConfig.domain,
    datasetUid: parentView.id
  }).getDisplayableColumns(view);

  // Show filters for supported column types.
  const columns = _.chain([]).
    merge(columnStats, displayableColumns).
    filter((column) => {
      if (column.dataTypeName === 'number') {
        return _.isNumber(column.rangeMin) && _.isNumber(column.rangeMax);
      }

      return column.dataTypeName === 'text' || column.dataTypeName === 'calendar_date';
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
