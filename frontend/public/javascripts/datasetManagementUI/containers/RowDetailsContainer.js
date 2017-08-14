import _ from 'lodash';
import { connect } from 'react-redux';
import * as Selectors from '../selectors';
import CommonRowDetails from '../../common/components/RowDetails';

function mapStateToProps(state) {
  const view = _.values(state.entities.views)[0];
  const rowLabel = _.get(view, 'metadata.rowLabel', I18n.common.default_row_label);
  const currentSchema = Selectors.currentOutputSchema(state.entities);
  if (!currentSchema) {
    return {
      rowLabel,
      rowCount: 0,
      columnCount: 0
    };
  }
  const columns = Selectors.columnsForOutputSchema(state.entities, currentSchema.id);
  const rowCount = Selectors.rowsTransformed(columns);
  return {
    rowLabel,
    rowCount,
    columnCount: columns.length
  };
}

export default connect(mapStateToProps)(CommonRowDetails);
