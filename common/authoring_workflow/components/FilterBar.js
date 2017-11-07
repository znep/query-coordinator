import _ from 'lodash';
import { bindActionCreators, compose } from 'redux';
import { connect } from 'react-redux';

import { FilterBar } from 'common/components';
import spandexSubscriber from 'common/spandex/subscriber';

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
    isValidTextFilterColumnValue,
    spandex: _.pick(metadata, ['datasetUid', 'domain'])
  };
};

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({ onUpdate: setFilters }, dispatch);
};

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  spandexSubscriber()
)(FilterBar);
