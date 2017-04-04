import { PropTypes } from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import * as DisplayState from '../../lib/displayState';
import { PAGE_SIZE } from '../../actions/loadData';
import * as Selectors from '../../selectors';
import { Pager as CommonPager } from '../../../common/components/Pager';

function numItemsToPaginate(db, outputSchemaId, displayState) {
  switch (displayState.type) {
    case DisplayState.COLUMN_ERRORS:
      return db.transforms[displayState.transformId].num_transform_errors;

    case DisplayState.ROW_ERRORS: {
      const outputSchema = db.output_schemas[outputSchemaId];
      return db.input_schemas[outputSchema.input_schema_id].num_row_errors;
    }
    case DisplayState.NORMAL: {
      const columns = Selectors.columnsForOutputSchema(db, outputSchemaId);
      return Selectors.rowsTransformed(columns);
    }
    default:
      console.error('unknown display state', displayState.type);
  }
}

function mapDispatchToProps(dispatch, ownProps) {
  const { displayState, path, routing } = ownProps;

  return {
    changePage: (targetPage) => {
      if (targetPage) {
        const targetDisplayState = { ...displayState, pageNo: targetPage };
        const targetPageUrl = DisplayState.toUiUrl(path, targetDisplayState);

        dispatch(push(targetPageUrl(routing)));
      }
    }
  };
}

function mapStateToProps(state, ownProps) {
  const resultsPerPage = PAGE_SIZE;
  const currentPage = ownProps.displayState.pageNo;
  const resultCount = numItemsToPaginate(state.db,
                                         ownProps.path.outputSchemaId,
                                         ownProps.displayState);

  return { resultsPerPage, currentPage, resultCount };
}

const Pager = connect(mapStateToProps, mapDispatchToProps)(CommonPager);

Pager.propTypes = {
  path: PropTypes.object.isRequired,
  routing: PropTypes.object.isRequired,
  displayState: PropTypes.object.isRequired
};

export default Pager;
