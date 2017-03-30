import React, { PropTypes } from 'react';
import { Link } from 'react-router';
import * as Links from '../../links';
import { connect } from 'react-redux';
import * as DisplayState from '../../lib/displayState';
import { PAGE_SIZE } from '../../actions/loadData';
import * as Selectors from '../../selectors';

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

function Pager({ path, displayState, numPages }) {
  const prevPageUrl = Links.showOutputSchema(
    path.uploadId,
    path.inputSchemaId,
    path.outputSchemaId,
    displayState.pageNo - 1
  );
  const nextPageUrl = Links.showOutputSchema(
    path.uploadId,
    path.inputSchemaId,
    path.outputSchemaId,
    displayState.pageNo + 1
  );
  return (
    <div>
      <Link to={prevPageUrl}>&lt;</Link>
      {displayState.pageNo + 1} of {numPages}
      <Link to={nextPageUrl}>&gt;</Link>
    </div>
  );
}

Pager.propTypes = {
  path: PropTypes.object.isRequired,
  displayState: PropTypes.object.isRequired,
  currentPage: PropTypes.number.isRequired,
  numPages: PropTypes.number.isRequired
};

// how am I supposed to declare that the connected component takes a
// `displayState` prop, but the internal component doesn't?
function mapStateToProps(state, ownProps) {
  const items = numItemsToPaginate(state.db, ownProps.path.outputSchemaId, ownProps.displayState);
  return {
    numPages: Math.ceil(items / PAGE_SIZE)
  };
}

export default connect(mapStateToProps)(Pager);
