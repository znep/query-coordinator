import _ from 'lodash';
import { connect } from 'react-redux';
import * as Selectors from 'selectors';
import CommonRowDetails from '../../common/components/RowDetails';

export function mapStateToProps({ entities }, { revisionSeq, fourfour }) {
  const view = entities.views[fourfour];
  const rowLabel = _.get(view, 'metadata.rowLabel', I18n.common.default_row_label);
  const currentSchema = Selectors.currentOutputSchema(entities);
  if (!currentSchema) {
    return {
      rowLabel,
      rowCount: 0,
      columnCount: 0
    };
  }
  const columns = Selectors.columnsForOutputSchema(entities, currentSchema.id);
  const rowCount = Selectors.totalRows(entities, revisionSeq);
  return {
    rowLabel,
    rowCount,
    columnCount: columns.length
  };
}

export default connect(mapStateToProps)(CommonRowDetails);
