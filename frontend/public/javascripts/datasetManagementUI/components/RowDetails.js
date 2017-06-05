import _ from 'lodash';
import { connect } from 'react-redux';
import * as Selectors from '../selectors';
import CommonRowDetails from '../../common/components/RowDetails';

function mapStateToProps(state) {
  const view = _.values(state.db.views)[0];
  const rowLabel = _.get(view, 'metadata.rowLabel', I18n.common.default_row_label);
  const currentSchema = Selectors.latestOutputSchema(state.db);
  if (!currentSchema) {
    return {
      rowLabel,
      rowCount: 0,
      columnCount: 0
    };
  }
  const columns = Selectors.columnsForOutputSchema(state.db, currentSchema.id);
  const rowCount = Selectors.rowsTransformed(columns);
  return {
    rowLabel,
    rowCount,
    columnCount: columns.length
  };
}

export default connect(mapStateToProps)(CommonRowDetails);
